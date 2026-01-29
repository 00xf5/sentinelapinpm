import { SentinelClient } from '../client/sentinel';
import { SentinelConfig, SentinelDecision } from '../types';

/**
 * Cloudflare Worker / Vercel Edge Adapter Options
 */
export interface EdgeAdapterOptions extends SentinelConfig {
    /**
     * KV Namespace (for Cloudflare) or reference to Edge Config (for Vercel)
     */
    cache?: {
        get: (key: string) => Promise<string | null>;
        put: (key: string, value: string, options?: { expirationTtl: number }) => Promise<void>;
    };
    /**
     * Cache TTL in seconds (default: 300 / 5 minutes)
     */
    cacheTtl?: number;
}

/**
 * Sentinel Edge Adapter (Cloudflare Workers / Vercel Edge Runtime)
 * Optimized for sub-5ms local enforcement using KV/Edge caches.
 */
export const sentinelEdge = (options: EdgeAdapterOptions) => {
    const client = new SentinelClient(
        options.apiKey,
        options.endpoint,
        options.timeout,
        options.debug
    );

    const ttl = options.cacheTtl || 300;

    return async (request: Request, context?: any) => {
        const url = new URL(request.url);
        const path = url.pathname;

        // Path checking logic (simplified for edge)
        const isProtected = (p: string): boolean => {
            if (Array.isArray(options.protect)) {
                return options.protect.some(pattern => {
                    if (pattern === p) return true;
                    if (pattern.endsWith('*')) return p.startsWith(pattern.slice(0, -1));
                    return false;
                });
            }
            return !!options.protect[p];
        };

        if (!isProtected(path)) return null;

        // Resolve IP
        const ip = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   '127.0.0.1';

        // 1. FAST PATH: Check Edge Cache
        if (options.cache) {
            try {
                const cached = await options.cache.get(`sentinel:verdict:${ip}`);
                if (cached === 'BLOCK') {
                    return new Response(JSON.stringify({ error: 'Access Denied', code: 'EDGE_BLOCK' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                if (cached === 'ALLOW') return null;
            } catch (err) {
                if (options.debug) console.error('[Sentinel Edge] Cache Read Error:', err);
            }
        }

        // 2. PRIMARY CHECK
        try {
            const decision = await client.check({
                target: ip,
                profile: options.profile || 'api',
                trustToken: request.headers.get('x-sentinel-trust') || undefined
            });

            // Update Cache Asynchronously
            if (options.cache && context?.waitUntil) {
                context.waitUntil(
                    options.cache.put(
                        `sentinel:verdict:${ip}`, 
                        decision.allow ? 'ALLOW' : 'BLOCK', 
                        { expirationTtl: ttl }
                    ).catch(() => {})
                );
            }

            if (!decision.allow) {
                return new Response(JSON.stringify({
                    error: 'Access Denied',
                    reason: decision.reason,
                    remediation: decision.remediation
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

        } catch (error) {
            if (options.debug) console.error('[Sentinel Edge] Decision Error:', error);
            if (options.fail === 'closed') {
                return new Response(JSON.stringify({ error: 'Security System Unavailable' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        return null;
    };
};

import { SentinelClient } from '../client/sentinel';
import { SentinelConfig } from '../types';

/**
 * Sentinel Next.js Edge Middleware
 */
export const sentinelEdge = (config: SentinelConfig) => {
    const client = new SentinelClient(
        config.apiKey,
        config.endpoint,
        config.timeout,
        config.debug
    );

    const isPathProtected = (path: string): string | null => {
        if (!config.protect) return null;

        if (Array.isArray(config.protect)) {
            return config.protect.includes(path) ? 'balanced' : null;
        }

        if (config.protect[path]) return config.protect[path];

        for (const pattern in config.protect) {
            if (pattern.endsWith('*')) {
                const base = pattern.slice(0, -1);
                if (path.startsWith(base)) return config.protect[pattern];
            }
        }

        return null;
    };

    return async (request: any) => {
        const url = new URL(request.url);
        const path = url.pathname;

        const mode = isPathProtected(path);
        if (!mode || mode === 'monitor') return null;

        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '127.0.0.1';

        const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;

        try {
            const decision = await client.check({
                target: cleanIp,
                profile: config.profile || 'api',
                privacy_mode: 'full',
                trustToken: request.headers.get('x-sentinel-trust')
            });

            if (!decision.allow) {
                return {
                    blocked: true,
                    status: 403,
                    decision,
                    response: new Response(JSON.stringify({
                        error: 'Access denied',
                        reason: decision.reason,
                        remediation: decision.remediation
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    })
                };
            }
        } catch (error) {
            if (config.fail === 'closed') {
                return {
                    blocked: true,
                    status: 403,
                    response: new Response(JSON.stringify({
                        error: 'Security system unavailable',
                        code: 'SENTINEL_UNREACHABLE'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    })
                };
            }
        }

        return null;
    };
};

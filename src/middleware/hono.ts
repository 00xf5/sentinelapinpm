import { SentinelClient } from '../client/sentinel';
import { SentinelConfig } from '../types';

/**
 * Sentinel Hono Middleware
 */
export const sentinelHono = (config: SentinelConfig) => {
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

    return async (c: any, next: any) => {
        const path = c.req.path;
        const mode = isPathProtected(path);

        if (!mode || mode === 'monitor') {
            await next();
            return;
        }

        const ip = c.req.header('x-forwarded-for') ||
            c.req.header('x-real-ip') ||
            '127.0.0.1';

        const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;

        try {
            const decision = await client.check({
                target: cleanIp,
                profile: config.profile || 'api',
                privacy_mode: 'full',
                trustToken: c.req.header('x-sentinel-trust')
            });

            if (!decision.allow) {
                if (config.onBlock) {
                    return config.onBlock(c.req, c.res, decision);
                }

                return c.json({
                    error: 'Access denied',
                    reason: decision.reason,
                    remediation: decision.remediation
                }, 403);
            }
        } catch (error) {
            if (config.fail === 'closed') {
                return c.json({
                    error: 'Security system unavailable',
                    code: 'SENTINEL_UNREACHABLE'
                }, 403);
            }
        }

        await next();
    };
};

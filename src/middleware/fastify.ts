import { FastifyRequest, FastifyReply } from 'fastify';
import { SentinelClient } from '../client/sentinel';
import { SentinelConfig } from '../types';

/**
 * Sentinel Fastify Middleware
 */
export const sentinelFastify = (config: SentinelConfig) => {
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

    return async (request: FastifyRequest, reply: FastifyReply) => {
        const mode = isPathProtected(request.url);
        if (!mode || mode === 'monitor') return;

        const ip = (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1';
        const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;

        try {
            const decision = await client.check({
                target: cleanIp,
                profile: config.profile || 'api',
                privacy_mode: 'full',
                trustToken: request.headers['x-sentinel-trust'] as string
            });

            if (!decision.allow) {
                if (config.onBlock) {
                    return config.onBlock(request as any, reply as any, decision);
                }

                return reply.code(403).send({
                    error: 'Access denied',
                    reason: decision.reason,
                    remediation: decision.remediation
                });
            }
        } catch (error) {
            if (config.fail === 'closed') {
                return reply.code(403).send({
                    error: 'Security system unavailable',
                    code: 'SENTINEL_UNREACHABLE'
                });
            }
        }
    };
};

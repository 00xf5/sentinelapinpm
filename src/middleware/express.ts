import { Request, Response, NextFunction } from 'express';
import { SentinelConfig, ProtectionMode, ConfigurationError, SentinelError } from '../types';
import { SentinelClient } from '../client/sentinel';

class PathMatcher {
    static matches(path: string, pattern: string): boolean {
        if (path === pattern) return true;
        if (pattern.includes('*')) {
            const regexPattern = pattern.replace(/\*/g, '.*').replace(/\//g, '\\/');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(path);
        }
        return false;
    }

    static getMode(path: string, protect: SentinelConfig['protect']): ProtectionMode | null {
        if (Array.isArray(protect)) {
            const isProtected = protect.some(pattern => this.matches(path, pattern));
            return isProtected ? 'balanced' : null;
        }
        for (const [pattern, mode] of Object.entries(protect)) {
            if (this.matches(path, pattern)) return mode;
        }
        return null;
    }
}

function validateConfig(config: SentinelConfig): void {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
        throw new ConfigurationError('apiKey is required');
    }
    if (!config.protect) {
        throw new ConfigurationError('protect configuration is required');
    }
}

function getClientIP(req: Request): string {
    const mockIp = req.headers['x-sentinel-mock-ip'];
    if (mockIp && typeof mockIp === 'string') return mockIp;

    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ips.split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') return realIp;

    if (req.ip) {
        let ip = req.ip;
        if (ip.startsWith('::ffff:')) ip = ip.substring(7);
        if (ip === '::1') ip = '127.0.0.1';
        return ip;
    }

    return '127.0.0.1';
}

/**
 * Sentinel Express Middleware
 */
export function sentinel(config: SentinelConfig) {
    validateConfig(config);

    const client = new SentinelClient(
        config.apiKey,
        config.endpoint,
        config.timeout,
        config.debug
    );

    const failStrategy = config.fail || 'closed';
    const defaultProfile = config.profile || 'api';

    return async (req: Request, res: Response, next: NextFunction) => {
        const path = req.path;
        const mode = PathMatcher.getMode(path, config.protect);

        if (!mode) return next();

        if (mode === 'monitor') {
            const ip = getClientIP(req);
            client.check({ target: ip, profile: defaultProfile }).catch(() => { });
            return next();
        }

        const ip = getClientIP(req);
        const trustToken = req.headers['x-sentinel-trust'] as string;
        const bwtNonce = req.headers['x-bwt-nonce'] as string;

        try {
            const decision = await client.check({
                target: ip,
                profile: defaultProfile,
                trustToken,
                bwtNonce
            });

            if (decision.allow) return next();

            if (config.webhooks?.onBlock) {
                fetch(config.webhooks.onBlock, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'SENTINEL_BLOCK', ip, path, decision })
                }).catch(() => { });
            }

            if (config.onBlock) {
                return config.onBlock(req, res, decision);
            }

            return res.status(403).json({
                error: 'Access denied',
                reason: decision.reason,
                remediation: decision.remediation
            });

        } catch (error) {
            if (failStrategy === 'open') return next();

            return res.status(503).json({
                error: 'Security verification unavailable',
                message: 'Please try again later'
            });
        }
    };
}

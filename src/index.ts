// Export middleware
export { sentinel } from './middleware/express';
export { sentinelFastify } from './middleware/fastify';
export { sentinelEdge } from './middleware/next';
export { sentinelHono } from './middleware/hono';

// Export client
export { SentinelClient } from './client/sentinel';

// Export types
export type {
    SentinelConfig,
    SentinelDecision,
    SecurityProfile,
    ProtectionMode,
    FailStrategy,
    PathProtection,
    CheckParams,
    Verdict
} from './types';

export { SentinelError, ConfigurationError } from './types';

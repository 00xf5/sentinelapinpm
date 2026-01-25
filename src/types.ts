/**
 * Security profile types for different endpoint sensitivities
 */
export type SecurityProfile = 'api' | 'signup' | 'payments' | 'crypto';

/**
 * Protection modes that determine blocking behavior
 */
export type ProtectionMode = 'monitor' | 'balanced' | 'strict';

/**
 * Fail strategy when Sentinel API is unreachable
 */
export type FailStrategy = 'open' | 'closed';

/**
 * Verdict from Sentinel decision engine
 */
export type Verdict = 'TRUSTED' | 'NEUTRAL' | 'UNTRUSTED';

/**
 * Path protection configuration
 */
export type PathProtection =
    | string[]  // Simple array of paths
    | Record<string, ProtectionMode>;  // Path -> Mode mapping

/**
 * Decision response from Sentinel API
 */
export interface SentinelDecision {
    allow: boolean;
    action: 'allow' | 'block';
    http_status: number;
    risk: string;
    reason: string;
    confidence: number;
    remediation?: {
        widget_required: boolean;
        trust_token_eligible: boolean;
    };
    latency_ms?: number;
}

/**
 * Main configuration for Sentinel middleware
 */
export interface SentinelConfig {
    /**
     * Your Sentinel API key (get from dashboard)
     */
    apiKey: string;

    /**
     * Paths to protect - can be array of strings or object mapping paths to modes
     * @example ['/login', '/signup']
     * @example { '/login': 'strict', '/api/*': 'monitor' }
     */
    protect: PathProtection;

    /**
     * Default security profile for protected endpoints
     * @default 'api'
     */
    profile?: SecurityProfile;

    /**
     * Sentinel API endpoint URL
     * @default 'https://sentinel.risksignal.name.ng'
     */
    endpoint?: string;

    /**
     * Fail strategy when Sentinel is unreachable
     * - 'closed': Block requests (secure default)
     * - 'open': Allow requests through
     * @default 'closed'
     */
    fail?: FailStrategy;

    /**
     * Request timeout in milliseconds
     * @default 2000
     */
    timeout?: number;

    /**
     * Custom block handler
     */
    onBlock?: (req: any, res: any, decision: SentinelDecision) => void;

    /**
     * Webhook notifications for security events
     */
    webhooks?: {
        onBlock?: string;      // URL to POST to when an attack is blocked
        onFlag?: string;       // URL to POST to when a suspicious event occurs
    };

    /**
     * Behavioral Work Token (BWT) options
     * Enforces cryptographic proof-of-work for "Unstable" IPs
     */
    bwt?: {
        enabled: boolean;
        difficulty?: number;   // Default: 1
    };

    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
}

/**
 * Internal check parameters sent to Sentinel API
 */
export interface CheckParams {
    target: string;
    profile: SecurityProfile;
    privacy_mode?: 'strict' | 'full';
    trustToken?: string;
    bwtNonce?: string;
}

/**
 * Error thrown when Sentinel API fails
 */
export class SentinelError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'SentinelError';
        Object.setPrototypeOf(this, SentinelError.prototype);
    }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
        Object.setPrototypeOf(this, ConfigurationError.prototype);
    }
}

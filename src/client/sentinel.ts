import { CheckParams, SentinelDecision, SentinelError } from '../types';

/**
 * HTTP client for communicating with Sentinel decision engine
 */
export class SentinelClient {
    private readonly endpoint: string;
    private readonly apiKey: string;
    private readonly timeout: number;
    private readonly debug: boolean;

    constructor(
        apiKey: string,
        endpoint: string = 'https://sentinel.risksignal.name.ng',
        timeout: number = 2000,
        debug: boolean = false
    ) {
        this.apiKey = apiKey;
        this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = timeout;
        this.debug = debug;
    }

    /**
     * Make a decision request to Sentinel API
     */
    async check(params: CheckParams): Promise<SentinelDecision> {
        const url = `${this.endpoint}/v1/check?mode=decision`;

        if (this.debug) {
            console.log('[Sentinel] Making decision request:', { url, target: params.target, profile: params.profile });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    ...(params.trustToken ? { 'x-sentinel-trust': params.trustToken } : {}),
                    ...(params.bwtNonce ? { 'x-bwt-nonce': params.bwtNonce } : {})
                },
                body: JSON.stringify({
                    target: params.target,
                    profile: params.profile,
                    privacy_mode: params.privacy_mode || 'full',
                    bwt_enabled: !!params.bwtNonce
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new SentinelError(
                    `Sentinel API returned ${response.status}: ${errorText}`,
                    response.status
                );
            }

            const decision = await response.json() as SentinelDecision;

            if (this.debug) {
                console.log('[Sentinel] Decision received:', {
                    allow: decision.allow,
                    reason: decision.reason,
                    latency: decision.latency_ms
                });
            }

            return decision;

        } catch (error: any) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new SentinelError(
                    `Sentinel API timeout after ${this.timeout}ms`,
                    undefined,
                    error
                );
            }

            if (error instanceof SentinelError) {
                throw error;
            }

            throw new SentinelError(
                `Failed to connect to Sentinel: ${error.message}`,
                undefined,
                error
            );
        }
    }

    /**
     * Health check to verify Sentinel API is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.timeout)
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

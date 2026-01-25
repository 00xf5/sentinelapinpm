# API Turnstile (Sentinel) — CAPTCHA-Free API Bot Protection, Abuse Prevention & Anti-Bot Middleware

<div align="center">
  <img src="https://sentinel.risksignal.name.ng/sentinel-logo.png" alt="API Turnstile Sentinel - CAPTCHA-Free API Bot Protection Middleware" width="120" />
  <h3>Turnstile for API</h3>
  <p>Cloudflare Turnstile protects browsers. <b>Sentinel protects APIs.</b></p>
  <p>
    <a href="https://www.npmjs.com/package/api-turnstile"><img src="https://img.shields.io/npm/v/api-turnstile?color=orange&style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/00xf5/sentinelapinpm/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/api-turnstile?style=flat-square" alt="MIT License" /></a>
    <a href="https://sentinel.risksignal.name.ng"><img src="https://img.shields.io/badge/latency-<50ms-green?style=flat-square" alt="Latency" /></a>
  </p>
</div>

---

> **The first line of defense for modern APIs — a CAPTCHA-free anti-bot middleware for API abuse prevention, credential stuffing, and automation attacks.**  
> **Block bots, scripts, credential stuffing, and automation attacks — without rate limits or CAPTCHAs.**  
> **API Turnstile is a Cloudflare Turnstile alternative built specifically for APIs.**

## What Is API Turnstile?

API Turnstile is a high-performance security middleware for Node.js, Express, Next.js, Bun, and Hono. Unlike traditional WAFs that rely on IP reputation or CAPTCHAs, Sentinel uses **Infrastructure Forensics** and **Behavioral Work Tokens (BWT)** to identify automated threats in real-time.

API Turnstile is an **anti-bot middleware for APIs** and a practical **Cloudflare Turnstile alternative for backend services**. 
It protects REST and GraphQL APIs from abuse, credential stuffing, fake signups, scraping, and automated attacks — without browser challenges or CAPTCHAs.

It allows legitimate traffic through with sub-50ms latency while forcing automated scripts to solve cryptographic challenges they aren't built for.

## Use Cases

API Turnstile is commonly used for:

- **API Bot Protection** for public and private APIs
- **CAPTCHA-Free Signup & Login Protection**
- **Credential Stuffing Prevention**
- **API Abuse & Scraping Prevention**
- **Anti-Bot Protection for Mobile & SPA Backends**
- **WAF Alternative for APIs**
- **Rate Limit Alternatives using Trust Scoring**

## Architecture

Sentinel operates on a three-tier defense matrix:

1.  **Fast-Path Matrix (< 20ms)**: Instant vetting against a global ASN/IP reputation matrix (OVH, Hetzner, DigitalOcean, etc.).
2.  **Behavioral Work Tokens (BWT)**: A cryptographic challenge-response system that escalatesPoW difficulty for suspicious IPs.
3.  **Infrastructure Forensics**: Deep analysis of request signatures to detect Puppeteer, Playwright, curl, and VPN/Proxy masking.

---

## Key Features

- **Extreme Performance**: Sub-50ms decision latency globally.
- **Zero Friction**: No CAPTCHAs, no puzzles, no interrupted user flows.
- **Adaptive Defenses**: Automatically scales security based on the `risk-score` of an incoming request.
- **Framework Agnostic**: Native middleware for Express, Fastify, Next.js, Hono, and Bun.
- **CLI Forensics**: Stream live traffic decisions and audit IPs directly from your terminal.
- **Outcome-Focused**: Designed for Registration Fraud, Account Takeover (ATO), and Scraping Prevention.

---

## Installation

```bash
npm install api-turnstile
```

---

## Basic Integration

### Express.js
```javascript
import { sentinel } from 'api-turnstile';
import express from 'express';

const app = express();

app.use(sentinel({
  apiKey: 'YOUR_SENTINEL_KEY',
  protect: ['/api/auth/*', '/v1/payments'],
  profile: 'api' // Default profile
}));
```

### Next.js (Edge Middleware)
```typescript
// middleware.ts
import { sentinelEdge } from 'api-turnstile';

export default sentinelEdge({
  apiKey: process.env.SENTINEL_KEY,
  protect: {
    '/api/auth/*': 'strict',
    '/api/public/*': 'monitor'
  }
});

export const config = {
  matcher: '/api/:path*',
};
```

---

## Advanced Configuration

The `sentinel` middleware accepts a `SentinelConfig` object for granular control.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Required** | Your Sentinel API key. |
| `protect` | `string[] \| Object` | `[]` | List of paths to protect or a map of path patterns to `ProtectionMode`. |
| `profile` | `string` | `'api'` | Sensitivity profile: `api`, `signup`, `payments`, `crypto`. |
| `fail` | `'open' \| 'closed'` | `'closed'` | Fail strategy if API is unreachable. `closed` blocks access. |
| `onBlock` | `Function` | `403 JSON` | Custom block handler: `(req, res, decision) => void`. |
| `bwt.enabled` | `boolean` | `true` | Enable Behavioral Work Tokens (Adaptive PoW). |
| `webhooks.onBlock`| `string` | `undefined` | URL to POST to when an attack is blocked. |

### Path Protection Modes
Control how strictly each path is enforced:
- **`monitor`**: Passive logging. Never blocks.
- **`balanced`**: Defensive mode. Blocks high-confidence automated threats.
- **`strict`**: Zero-tolerance. Blocks any suspicious signal including VPNs and Datacenters.

```javascript
protect: {
  '/api/public': 'monitor',
  '/api/user/*': 'balanced',
  '/api/sensitive': 'strict'
}
```

---

## Security Profiles

Sentinel profiles tune the engine's heuristics based on the endpoint's value:

| Profile | Focus | Use Case |
| :--- | :--- | :--- |
| **`api`** | Velocity | Standard API endpoints, data feeds. |
| **`signup`** | Identity | Registration, Login, Forget Password. |
| **`payments`** | Integrity | Checkout, Subscription, Payment Method Update. |
| **`crypto`** | Pure Trust | Wallets, Faucets, On-Chain interactions. |

---

## Response Formats

### Successful Decision (Allowed)
Requests that pass Sentinel checks proceed seamlessly to your next middleware.

### Blocked Decision (Default 403)
If a request is blocked, Sentinel returns a detailed forensic response:

```json
{
  "error": "Access denied",
  "reason": "Headless browser signature detected (Puppeteer/Chrome)",
  "remediation": {
    "widget_required": false,
    "trust_token_eligible": true
  }
}
```

---

## Sentinel CLI

The package includes a powerful command-line interface for real-time traffic analysis.

```bash
# Install CLI globally
npm install -g api-turnstile

# Stream live traffic forensic decisions
sentinel tail --key YOUR_API_KEY

# Perform an immediate audit on an IP address
sentinel check 1.2.3.4

# View security ROI and outcome metrics
sentinel stats
```

---

## Behavioral Work Tokens (BWT)

BWT is our proprietary adaptive PoW system. When Sentinel identifies an "Unstable" IP, it scales a cryptographic challenge that must be solved by the client. 

1. **Legitimate Users**: The `api-turnstile` client (or frontend widget) solves the challenge in ~10-40ms in the background.
2. **Bot Scripts**: Python, Go, and simple NodeJS scripts fail the challenge as they lack the cryptographic engine required to generate a valid `BWT-Nonce`.

---

## Deployment & Compatibility

- **Node.js**: 18.x and above.
- **Bun**: 1.0.0 and above.
- **Cloud Runtime**: Vercel Edge, Cloudflare Workers, AWS Lambda.
- **Database**: Zero external DB dependencies (Decision Engine is managed).

## Related

- [Sentinel API Security Platform](https://sentinel.risksignal.name.ng) — Managed API bot protection
- [Why CAPTCHAs Fail for APIs](https://sentinel.risksignal.name.ng/blog/captchas-fail-for-apis)

## License

MIT © [Sentinel Security](https://sentinel.risksignal.name.ng)

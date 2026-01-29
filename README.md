# API Turnstile (Sentinel) — Turnstile for APIs

<div align="center">
  <img src="https://sentinel.risksignal.name.ng/sentinel-logo.png" alt="Sentinel Logo" width="120" />
  <h3>Your APIs are being abused. You just don't see it yet.</h3>
  <p>Cloudflare Turnstile protects browsers. <b>Sentinel protects APIs.</b></p>
  <p>
    <a href="https://www.npmjs.com/package/api-turnstile"><img src="https://img.shields.io/npm/v/api-turnstile?color=orange&style=flat-square" alt="NPM Version" /></a>
    <a href="https://sentinel.risksignal.name.ng"><img src="https://img.shields.io/badge/latency-<50ms-green?style=flat-square" alt="Latency" /></a>
  </p>
</div>

---

**Sentinel** is a high-velocity deterministic trust layer for modern APIs. It stops automated abuse, credential stuffing, and fake signups by analyzing **Infrastructure DNA** and enforcing **Behavioral Work Tokens** without ever showing a CAPTCHA to a human.

## 🚫 Problems We Stop
- **Signup Flooding**: Thousands of fake accounts hitting your database.
- **Credential Stuffing**: Automated login attempts using leaked passwords.
- **API Scraping**: Competitors or AI agents draining your proprietary data.
- **Ghost Traffic Tax**: Unnecessary AWS/Cloud compute costs from non-human traffic.

## ⚡ Global Edge Enforcement
Sentinel is built for the internet's edge. Deploy as a standard Node.js middleware or a **Global Edge Guard** on Cloudflare Workers / Vercel Edge.

- **Fast-Path Matrix**: Instant identification of hosting/proxy infrastructure.
- **Edge Cache Support**: Sub-2ms rejection using Cloudflare KV or Vercel Edge Config.
- **Agentic Governance**: Specific profiles to identify and throttle AI Agents vs Humans.

### Example: Cloudflare Worker Edge Enforcement
```typescript
import { sentinelEdge } from 'api-turnstile';

export default {
  async fetch(request, env, ctx) {
    const shield = sentinelEdge({
      apiKey: env.SENTINEL_KEY,
      cache: env.SENTINEL_KV, // Cloudflare KV Namespace
      protect: ['/v1/*'],
      profile: 'agentic' // Identify & throttle AI Agents
    });

    const blockResponse = await shield(request, ctx);
    if (blockResponse) return blockResponse;

    return await fetch(request);
  }
};
```

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
| **`agentic`** | AI Governance | LLM Agents, Scrapers, Automated Crawlers. |

### Using the Agentic Profile
The `agentic` profile is designed to differentiate between human users and AI Agents (like GPT-5, Perplexity, etc.). When enabled, Sentinel provides granular signals that allow you to serve "Lite" or "Cached" content to bots while saving expensive compute for humans.

```javascript
app.use(sentinel({
  apiKey: '...',
  protect: ['/data/*'],
  profile: 'agentic'
}));
```

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

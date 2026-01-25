# API Turnstile — CAPTCHA-Free API Bot Protection & Abuse Prevention

<div align="center">
  <img src="https://sentinel.risksignal.name.ng/sentinel-logo.png" alt="Sentinel Logo" width="120" />
  <h3>The Deterministic Trust Layer for Modern APIs</h3>
  <p>Cloudflare Turnstile protects browsers. <b>Sentinel protects APIs.</b></p>
  <p>
    <a href="https://www.npmjs.com/package/api-turnstile"><img src="https://img.shields.io/npm/v/api-turnstile?color=orange&style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/00xf5/sentinelapinpm/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/api-turnstile?style=flat-square" alt="MIT License" /></a>
    <a href="https://sentinel.risksignal.name.ng"><img src="https://img.shields.io/badge/latency-<50ms-green?style=flat-square" alt="Latency" /></a>
  </p>
</div>

---

> **CAPTCHA-free API bot protection for Node.js and serverless APIs.**  
> **Block bots, scripts, credential stuffing, and automation attacks — without rate limits or CAPTCHAs.**  
> **API Turnstile is a Cloudflare Turnstile alternative built specifically for APIs.**

## What Is API Turnstile?

API Turnstile is an API bot protection and abuse prevention middleware for Node.js, Express, Next.js, Bun, and serverless environments.  
It blocks automated attacks such as credential stuffing, fake account creation, payment fraud, and API scraping — without CAPTCHAs or browser JavaScript.

## 🚀 Key Features

- **⚡ Sub-50ms Latency**: Built on a globally distributed decision engine.
- **🛡️ Adaptive Defenses**: Automatically escalates cryptographic challenges (BWT) for suspicious IPs.
- **🔌 Multi-Framework**: First-class support for Node.js (Express/Fastify) and Edge Runtimes (Next.js/Bun).
- **🕹️ CLI Intelligence**: Stream live traffic decisions directly to your terminal with `sentinel tail`.
- **🎯 Outcome-Based**: Focuses on business results (e.g., bot reduction, capital saved) rather than just "block counts".

## 📦 Installation

```bash
npm install api-turnstile
```

## 🛠️ Quick Start

### Express / Node.js
```javascript
import { sentinel } from 'api-turnstile';
import express from 'express';

const app = express();

app.use(sentinel({
  apiKey: 'your_api_key',
  protect: ['/api/v1/auth/*', '/v1/payments'],
  profile: 'api'
}));
```

### Next.js Edge Middleware
```javascript
// middleware.ts
import { sentinelEdge } from 'api-turnstile/middleware/next';

export default sentinelEdge({
  apiKey: process.env.SENTINEL_KEY,
  protect: {
    '/api/auth/*': 'strict',
    '/api/public/*': 'monitor'
  }
});
```

## ⚙️ Configuration Deep Dive

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Required** | Your Sentinel API key. |
| `protect` | `string[] \| Object` | `[]` | Paths to protect. Supports wildcards (`*`) and per-path modes. |
| `profile` | `string` | `'api'` | Protection profile: `api`, `signup`, `payments`, `crypto`. |
| `fail` | `'open' \| 'closed'` | `'closed'` | Strategy if the Sentinel API is unreachable. |
| `bwt.enabled` | `boolean` | `true` | Enable Behavioral Work Tokens (Adaptive PoW). |
| `onBlock` | `function` | Default 403 response | Custom handler for blocked requests. |

### Protection Modes
- **`monitor`**: Logs activity but never blocks. Ideal for initial onboarding.
- **`balanced`**: Blocks obvious bots and high-risk signals.
- **`strict`**: Enforces zero-tolerance for automation and proxy traffic.

## 💻 Sentinel CLI

The package includes a powerful CLI for real-time forensics and monitoring.

```bash
# Install globally
npm install -g api-turnstile

# Stream live decisions in real-time
sentinel tail --key YOUR_API_KEY

# Perform an immediate forensic check on an IP
sentinel check 1.2.3.4

# View security outcomes and ROI stats
sentinel stats
```

## 🧠 Behavioral Work Tokens (BWT)

BWT is Sentinel's secret weapon. When an IP is deemed "unstable" (not yet high-risk enough to block), Sentinel issues a cryptographic challenge.

1. Legitimate clients (using this SDK) solve the challenge in the background (~5ms overhead).
2. Bot scripts (Headless Chrome, curl, python-requests) fail to solve the token.
3. Your server rejects the request before it ever hits your business logic.

## 🔗 Links

- **[Dashboard & API Management](https://sentinel.risksignal.name.ng)**
- **[Documentation](https://sentinel.risksignal.name.ng/docs)**
- **[GitHub Repository](https://github.com/00xf5/sentinelapinpm)**

## 📄 License

MIT © [Sentinel Security](https://sentinel.risksignal.name.ng)

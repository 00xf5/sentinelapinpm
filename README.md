# api-turnstile

Cloudflare Turnstile protects browsers. Sentinel protects APIs.
Block bots, scrapers, and automated attacks in under 50ms using infrastructure and behavioral signals. No CAPTCHAs required.

## Installation

```bash
npm install api-turnstile
```

## Quick Start (Express)

```javascript
import { sentinel } from 'api-turnstile';

app.use(sentinel({
  apiKey: process.env.SENTINEL_KEY,
  protect: ['/login', '/api/*']
}));
```

## Features

- **Multi-Framework**: Native support for Express, Fastify, Hono, and Bun.
- **Edge Native**: Specialized middleware for Next.js Edge Runtime and Vercel.
- **Sentinel CLI**: Terminal-based monitoring (`sentinel tail`) and forensics.
- **Economic Defenses**: Behavioral Work Tokens (BWT) to increase bot costs.
- **Real-time Alerts**: Webhook notifications for blocked incidents.

## Supported Adapters

| Framework | Middleware |
|-----------|------------|
| Express / Node | `sentinel(config)` |
| Fastify | `sentinelFastify(config)` |
| Hono / Bun | `sentinelHono(config)` |
| Next.js Edge | `sentinelEdge(config)` |

## Configuration

| Option | Description |
|--------|-------------|
| `apiKey` | Your API key from the dashboard |
| `protect` | Array of paths or path-to-mode mapping |
| `profile` | Security profile (`api`, `signup`, `payments`, `crypto`) |
| `webhooks` | Optional URL for block notifications |
| `fail` | Strategy if API is down (`open`, `closed`) |

## Links

- [Dashboard & API Keys](https://sentinel.risksignal.name.ng)
- [Full Documentation](https://sentinel.risksignal.name.ng/docs)
- [GitHub Repository](https://github.com/risksignal/sentinel)

## License

MIT

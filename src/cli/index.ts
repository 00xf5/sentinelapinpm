#!/usr/bin/env node
import { SentinelClient } from '../client/sentinel';
import * as fs from 'fs';
import * as path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));

const usage = `
Sentinel CLI v${pkg.version}
The deterministic trust layer for modern APIs.

Usage:
  sentinel <command> [options]

Commands:
  check <ip>      Perform a real-time reputation and trust check on an IP
  stats           View aggregate security outcomes and mitigation rates
  tail            Stream live trust decisions to your terminal
  scan <url>      Simulate a security audit on an endpoint (CI/CD ready)
  version         Show current version

Options:
  --key <key>     Specify API key (defaults to SENTINEL_API_KEY env var)
  --mock <ip>     Mock IP for the scan (default: 1.1.1.1)
  --profile <p>   Decision profile (default: api)
  --debug         Enable verbose logging
`;

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help' || command === '--help') {
        console.log(usage);
        return;
    }

    if (command === 'version' || command === '--version' || command === '-v') {
        console.log(`sentinel v${pkg.version}`);
        return;
    }

    let apiKey = process.env.SENTINEL_API_KEY;
    const keyIndex = args.indexOf('--key');
    if (keyIndex !== -1 && args[keyIndex + 1]) {
        apiKey = args[keyIndex + 1];
    }

    if (!apiKey) {
        console.error('Error: No API key found. Set SENTINEL_API_KEY or use --key.');
        process.exit(1);
    }

    const debug = args.includes('--debug');
    const client = new SentinelClient(apiKey, 'https://sentinel.risksignal.name.ng', 5000, debug);

    try {
        switch (command) {
            case 'scan':
                const url = args[1];
                if (!url) {
                    console.error('Error: Please specify a target URL.');
                    process.exit(1);
                }
                const mockIp = args.includes('--mock') ? args[args.indexOf('--mock') + 1] : '1.1.1.1';

                console.log(`Scanning security layer at ${url}`);
                console.log(`Simulating origin: ${mockIp}\n`);

                const start = Date.now();
                const scanRes = await fetch(url, {
                    headers: {
                        'x-sentinel-mock-ip': mockIp,
                        'x-forwarded-for': mockIp
                    }
                });
                const duration = Date.now() - start;

                if (scanRes.status === 403) {
                    console.log(`PASS: Sentinel correctly blocked the request.`);
                    console.log(`Latency: ${duration}ms`);
                } else {
                    console.log(`FAIL: Hostile traffic reached the origin (HTTP ${scanRes.status}).`);
                    console.log(`Check if your middleware is correctly applied to this path.`);
                }
                break;

            case 'check':
                const ip = args[1];
                if (!ip) {
                    console.error('Error: Please specify an IP address.');
                    process.exit(1);
                }
                const profile = args.includes('--profile') ? args[args.indexOf('--profile') + 1] : 'api';

                console.log(`Checking trust for ${ip} [Profile: ${profile}]...`);
                const decision = await client.check({ target: ip, profile: profile as any });

                console.log(`Verdict:    ${decision.allow ? 'PASS' : 'BLOCK'}`);
                console.log(`Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
                console.log(`Reason:     ${decision.reason.toUpperCase()}`);
                console.log(`Latency:    ${decision.latency_ms}ms`);
                break;

            case 'stats':
                const statsRes = await fetch('https://sentinel.risksignal.name.ng/api/analytics', {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });

                if (!statsRes.ok) {
                    const err = await statsRes.text();
                    console.error(`Error: Failed to fetch stats: ${err}`);
                    return;
                }

                const stats = await statsRes.json() as any;
                console.log(`System Statistics`);
                console.log(`-----------------`);
                console.log(`Total Signals:     ${stats.total_signals.toLocaleString()}`);
                console.log(`Mitigation Rate:   ${stats.outcomes.reduction}`);
                console.log(`Blocked Attacks:   ${stats.outcomes.blocked.toLocaleString()}`);
                console.log(`Capital Saved:     $${stats.outcomes.saved}`);
                break;

            case 'tail':
                let lastSeen = new Date().toISOString();
                console.log('Streaming live decisions (Press Ctrl+C to stop)...');

                setInterval(async () => {
                    try {
                        const tailRes = await fetch('https://sentinel.risksignal.name.ng/api/analytics', {
                            headers: { 'Authorization': `Bearer ${apiKey}` }
                        });
                        if (!tailRes.ok) return;
                        const data = await tailRes.json() as any;
                        const logs = (data.recent_logs || []).reverse();

                        for (const log of logs) {
                            if (new Date(log.time) > new Date(lastSeen)) {
                                const v = log.verdict.toUpperCase();
                                const label = v === 'TRUSTED' ? 'PASS' : v === 'UNSTABLE' ? 'FLAG' : 'BLOCK';
                                console.log(`${new Date(log.time).toLocaleTimeString()} [${label}] ${log.target.padEnd(15)} | ${log.reason} (${log.latency}ms)`);
                                lastSeen = log.time;
                            }
                        }
                    } catch (e) { }
                }, 2000);
                break;

            default:
                console.log(`Error: Unknown command: ${command}`);
                console.log(usage);
        }
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();

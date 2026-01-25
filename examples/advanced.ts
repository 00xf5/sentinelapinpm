/**
 * Advanced Express Example
 * 
 * This example demonstrates:
 * - Per-path protection modes
 * - Custom block handlers
 * - Different security profiles
 * - Debug logging
 */

import express from 'express';
import { sentinel } from 'api-turnstile';

const app = express();
app.use(express.json());

// Advanced Sentinel configuration
app.use(sentinel({
    apiKey: process.env.SENTINEL_KEY || 'your-api-key-here',

    // Different modes for different paths
    protect: {
        '/auth/login': 'strict',           // Zero tolerance for login
        '/auth/signup': 'strict',          // Zero tolerance for signup
        '/api/payment': 'strict',          // Maximum security for payments
        '/api/user/*': 'balanced',         // Block obvious abuse
        '/api/public/*': 'monitor'         // Log only, never block
    },

    // Optimize for signup/auth endpoints
    profile: 'signup',

    // Fail closed - block if Sentinel is unreachable
    fail: 'closed',

    // Custom timeout
    timeout: 3000,

    // Enable debug logging
    debug: true,

    // Custom block handler
    onBlock: (req, res, decision) => {
        console.log(`🚫 Blocked request to ${req.path}:`, {
            ip: req.ip,
            reason: decision.reason,
            confidence: decision.confidence
        });

        // Return custom error response
        res.status(403).json({
            error: 'Access Denied',
            message: 'Your request has been blocked by our security system',
            reason: decision.reason,
            support: 'contact@yourcompany.com',
            // Optionally provide widget for verification
            verify_url: decision.remediation?.widget_required
                ? 'https://yoursite.com/verify'
                : null
        });
    }
}));

// Public endpoints - not protected
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/public/stats', (req, res) => {
    res.json({
        users: 1000,
        requests: 50000
    });
});

// Protected auth endpoints
app.post('/auth/signup', (req, res) => {
    const { email, password } = req.body;

    console.log('✅ Legitimate signup request for:', email);

    res.json({
        success: true,
        message: 'Account created successfully',
        userId: 'user-123'
    });
});

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    console.log('✅ Legitimate login request for:', email);

    res.json({
        success: true,
        token: 'jwt-token-here',
        expiresIn: 3600
    });
});

// Protected API endpoints
app.post('/api/payment', (req, res) => {
    const { amount, currency } = req.body;

    console.log('✅ Legitimate payment request:', { amount, currency });

    res.json({
        success: true,
        transactionId: 'txn-456'
    });
});

app.get('/api/user/profile', (req, res) => {
    res.json({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('🛡️  Sentinel protection active:');
    console.log('   - /auth/* → STRICT mode');
    console.log('   - /api/payment → STRICT mode');
    console.log('   - /api/user/* → BALANCED mode');
    console.log('   - /api/public/* → MONITOR mode');
});

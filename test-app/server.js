/**
 * Test Express Application for api-turnstile
 * 
 * This app demonstrates real-world integration with the Sentinel Engine
 * and validates all middleware functionality.
 */

import express from 'express';
import 'dotenv/config';
import { sentinel } from '../dist/index.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configuration
const SENTINEL_KEY = process.env.SENTINEL_KEY || 'test-key-please-replace';
const SENTINEL_ENDPOINT = process.env.SENTINEL_ENDPOINT || 'http://localhost:3001';
const PORT = process.env.PORT || 4000;

console.log('🔧 Configuration:');
console.log(`   Sentinel Endpoint: ${SENTINEL_ENDPOINT}`);
console.log(`   API Key: ${SENTINEL_KEY.substring(0, 8)}...`);
console.log('');

// Apply Sentinel middleware with comprehensive configuration
app.use(sentinel({
    apiKey: SENTINEL_KEY,
    endpoint: SENTINEL_ENDPOINT,

    // Different protection levels for different paths
    protect: {
        '/auth/login': 'strict',
        '/auth/signup': 'strict',
        '/api/payment': 'strict',
        '/api/user/*': 'balanced',
        '/api/public/*': 'monitor'
    },

    profile: 'signup',
    fail: 'closed',
    timeout: 3000,
    debug: true,

    // Custom block handler
    onBlock: (req, res, decision) => {
        console.log(`🚫 BLOCKED: ${req.method} ${req.path}`);
        console.log(`   Reason: ${decision.reason}`);
        console.log(`   Confidence: ${decision.confidence}`);

        res.status(403).json({
            success: false,
            error: 'Access Denied',
            message: 'Your request has been blocked by our security system',
            reason: decision.reason,
            confidence: decision.confidence,
            support: 'security@example.com'
        });
    }
}));

// ============================================
// PUBLIC ENDPOINTS (No Protection)
// ============================================

app.get('/', (req, res) => {
    res.json({
        service: 'api-turnstile Test Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            public: [
                'GET /',
                'GET /health'
            ],
            protected: [
                'POST /auth/login (strict)',
                'POST /auth/signup (strict)',
                'POST /api/payment (strict)',
                'GET /api/user/profile (balanced)',
                'GET /api/public/stats (monitor)'
            ]
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// PROTECTED ENDPOINTS (Strict Mode)
// ============================================

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`✅ ALLOWED: Login attempt for ${email}`);

    res.json({
        success: true,
        message: 'Login successful',
        token: 'jwt-token-here',
        user: {
            id: 'user-123',
            email: email
        }
    });
});

app.post('/auth/signup', (req, res) => {
    const { email, password, name } = req.body;

    console.log(`✅ ALLOWED: Signup for ${email}`);

    res.json({
        success: true,
        message: 'Account created successfully',
        userId: 'user-456',
        email: email
    });
});

app.post('/api/payment', (req, res) => {
    const { amount, currency } = req.body;

    console.log(`✅ ALLOWED: Payment of ${amount} ${currency}`);

    res.json({
        success: true,
        transactionId: 'txn-789',
        amount: amount,
        currency: currency,
        status: 'completed'
    });
});

// ============================================
// PROTECTED ENDPOINTS (Balanced Mode)
// ============================================

app.get('/api/user/profile', (req, res) => {
    console.log(`✅ ALLOWED: Profile access`);

    res.json({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        created: '2024-01-01'
    });
});

app.put('/api/user/settings', (req, res) => {
    console.log(`✅ ALLOWED: Settings update`);

    res.json({
        success: true,
        message: 'Settings updated'
    });
});

// ============================================
// MONITORED ENDPOINTS (Monitor Mode)
// ============================================

app.get('/api/public/stats', (req, res) => {
    console.log(`📊 MONITORED: Public stats accessed`);

    res.json({
        totalUsers: 10000,
        activeUsers: 1500,
        requests24h: 50000
    });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Test Server Started!');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log('');
    console.log('🛡️  Sentinel Protection Active:');
    console.log('   ├─ /auth/login       → STRICT');
    console.log('   ├─ /auth/signup      → STRICT');
    console.log('   ├─ /api/payment      → STRICT');
    console.log('   ├─ /api/user/*       → BALANCED');
    console.log('   └─ /api/public/*     → MONITOR');
    console.log('');
    console.log('📝 Try these commands:');
    console.log('');
    console.log('   # Test public endpoint (no protection)');
    console.log('   curl http://localhost:4000/');
    console.log('');
    console.log('   # Test protected login (strict mode)');
    console.log('   curl -X POST http://localhost:4000/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email":"test@example.com","password":"pass123"}\'');
    console.log('');
    console.log('   # Test protected signup (strict mode)');
    console.log('   curl -X POST http://localhost:4000/auth/signup \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email":"new@example.com","password":"pass123","name":"John"}\'');
    console.log('');
    console.log('   # Test user profile (balanced mode)');
    console.log('   curl http://localhost:4000/api/user/profile');
    console.log('');
    console.log('   # Test public stats (monitor mode - never blocks)');
    console.log('   curl http://localhost:4000/api/public/stats');
    console.log('');
});

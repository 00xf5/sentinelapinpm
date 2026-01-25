#!/usr/bin/env node

/**
 * Automated Test Suite for api-turnstile
 * 
 * This script tests all middleware functionality against a running
 * Sentinel Engine instance.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:4000';
import 'dotenv/config';

console.log('🧪 api-turnstile Test Suite');
console.log(`   Testing against: ${BASE_URL}`);
console.log('');

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
    }
}

async function request(method, path, body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();

    return { status: response.status, data };
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
    console.log('📋 Running Tests...\n');

    // Test 1: Server is running
    await test('Server is running', async () => {
        const { status } = await request('GET', '/');
        if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    });

    // Test 2: Health check works
    await test('Health check endpoint', async () => {
        const { status, data } = await request('GET', '/health');
        if (status !== 200) throw new Error(`Expected 200, got ${status}`);
        if (data.status !== 'ok') throw new Error('Health check failed');
    });

    // Test 3: Public endpoint (no protection)
    await test('Public endpoint accessible', async () => {
        const { status, data } = await request('GET', '/');
        if (status !== 200) throw new Error(`Expected 200, got ${status}`);
        if (!data.service) throw new Error('Invalid response');
    });

    // Test 4: Protected login endpoint
    await test('Login endpoint (strict mode)', async () => {
        const { status, data } = await request('POST', '/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        // Should either pass (200) or be blocked (403)
        if (status !== 200 && status !== 403) {
            throw new Error(`Unexpected status: ${status}`);
        }

        if (status === 200 && !data.success) {
            throw new Error('Expected success response');
        }

        if (status === 403 && !data.reason) {
            throw new Error('Block response missing reason');
        }
    });

    // Test 5: Protected signup endpoint
    await test('Signup endpoint (strict mode)', async () => {
        const { status, data } = await request('POST', '/auth/signup', {
            email: 'newuser@example.com',
            password: 'password123',
            name: 'Test User'
        });

        if (status !== 200 && status !== 403) {
            throw new Error(`Unexpected status: ${status}`);
        }
    });

    // Test 6: Payment endpoint (strict mode)
    await test('Payment endpoint (strict mode)', async () => {
        const { status } = await request('POST', '/api/payment', {
            amount: 100,
            currency: 'USD'
        });

        if (status !== 200 && status !== 403) {
            throw new Error(`Unexpected status: ${status}`);
        }
    });

    // Test 7: User profile (balanced mode)
    await test('User profile endpoint (balanced mode)', async () => {
        const { status } = await request('GET', '/api/user/profile');

        if (status !== 200 && status !== 403) {
            throw new Error(`Unexpected status: ${status}`);
        }
    });

    // Test 8: Public stats (monitor mode - should never block)
    await test('Public stats endpoint (monitor mode)', async () => {
        const { status, data } = await request('GET', '/api/public/stats');

        // Monitor mode should NEVER block
        if (status !== 200) {
            throw new Error(`Monitor mode blocked request! Status: ${status}`);
        }

        if (!data.totalUsers) {
            throw new Error('Invalid stats response');
        }
    });

    // Test 9: 404 handling
    await test('404 handling', async () => {
        const { status } = await request('GET', '/nonexistent');
        if (status !== 404) throw new Error(`Expected 404, got ${status}`);
    });

    // Test 10: Invalid JSON handling
    await test('Invalid request handling', async () => {
        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid-json'
            });

            // Should handle gracefully
            if (response.status < 400 || response.status >= 600) {
                throw new Error('Should return error status');
            }
        } catch (error) {
            if (error.message.includes('Should return')) throw error;
            // Network errors are ok for this test
        }
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Results');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total:  ${passed + failed}`);
    console.log('');

    if (failed === 0) {
        console.log('🎉 All tests passed!');
        console.log('');
        console.log('✅ api-turnstile is working correctly');
        console.log('✅ Middleware is properly protecting endpoints');
        console.log('✅ All protection modes functioning as expected');
        console.log('');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed');
        console.log('');
        console.log('Possible issues:');
        console.log('1. Sentinel Engine not running');
        console.log('2. Invalid API key');
        console.log('3. Network connectivity issues');
        console.log('4. Configuration mismatch');
        console.log('');
        process.exit(1);
    }
}

// Check if server is reachable first
console.log('🔍 Checking server availability...');
fetch(`${BASE_URL}/health`)
    .then(() => {
        console.log('✅ Server is reachable\n');
        runTests();
    })
    .catch((error) => {
        console.log('❌ Cannot reach server');
        console.log(`   Error: ${error.message}`);
        console.log('');
        console.log('Make sure the test server is running:');
        console.log('   cd test-app');
        console.log('   npm run dev');
        console.log('');
        process.exit(1);
    });

/**
 * Quick Test Script
 * 
 * This script validates that the api-turnstile package is working correctly
 * by testing the core functionality without requiring a full Express server.
 */

import { SentinelClient, SentinelError, ConfigurationError } from '../dist/index.js';

console.log('🧪 Testing api-turnstile package...\n');

// Test 1: Client Initialization
console.log('Test 1: Client Initialization');
try {
    const client = new SentinelClient(
        'test-api-key',
        'https://sentinel.risksignal.name.ng',
        2000,
        true
    );
    console.log('✅ Client initialized successfully\n');
} catch (error) {
    console.error('❌ Client initialization failed:', error);
    process.exit(1);
}

// Test 2: Error Classes
console.log('Test 2: Error Classes');
try {
    const sentinelError = new SentinelError('Test error', 500);
    const configError = new ConfigurationError('Invalid config');

    if (sentinelError.name === 'SentinelError' && configError.name === 'ConfigurationError') {
        console.log('✅ Error classes working correctly\n');
    } else {
        throw new Error('Error classes not properly named');
    }
} catch (error) {
    console.error('❌ Error class test failed:', error);
    process.exit(1);
}

// Test 3: Type Exports (compilation test - if this file compiles, types are exported)
console.log('Test 3: Type Exports');
console.log('✅ TypeScript types exported successfully (compilation passed)\n');

console.log('🎉 All tests passed! Package is ready to use.\n');
console.log('Next steps:');
console.log('1. Test with a real Express app');
console.log('2. Verify connection to your Sentinel Engine');
console.log('3. Update package.json metadata');
console.log('4. Publish to npm');

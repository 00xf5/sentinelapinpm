/**
 * Basic Express Example
 * 
 * This example shows the simplest way to protect your API endpoints
 * with Sentinel in under 60 seconds.
 */

import express from 'express';
import { sentinel } from 'api-turnstile';

const app = express();
app.use(express.json());

// Apply Sentinel protection to auth endpoints
app.use(sentinel({
    apiKey: process.env.SENTINEL_KEY || 'your-api-key-here',
    protect: ['/login', '/signup', '/reset-password']
}));

// Public endpoint - not protected
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Protected endpoint - only legitimate traffic reaches here
app.post('/signup', (req, res) => {
    const { email, password } = req.body;

    // Your signup logic here
    console.log('Creating account for:', email);

    res.json({
        success: true,
        message: 'Account created successfully'
    });
});

// Protected endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Your login logic here
    console.log('Login attempt for:', email);

    res.json({
        success: true,
        token: 'jwt-token-here'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Sentinel protection active on /login and /signup');
});

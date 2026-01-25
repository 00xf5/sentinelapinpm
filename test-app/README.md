# api-turnstile Test Application

This is a comprehensive test application that validates the `api-turnstile` package against a running Sentinel Engine.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd test-app
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your Sentinel API key:

```env
SENTINEL_KEY=your-actual-api-key-here
SENTINEL_ENDPOINT=http://localhost:3001
PORT=4000
```

### 3. Start Your Sentinel Engine

Make sure your Sentinel Engine is running:

```bash
# In the sentinel-engine directory
npm run dev
```

The engine should be running on `http://localhost:3001`

### 4. Start the Test Server

```bash
npm run dev
```

The test server will start on `http://localhost:4000`

## 🧪 Running Tests

### Manual Testing

The server provides helpful curl commands on startup. Try these:

```bash
# Test public endpoint (no protection)
curl http://localhost:4000/

# Test protected login (strict mode)
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Test protected signup (strict mode)
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"pass123","name":"John"}'

# Test user profile (balanced mode)
curl http://localhost:4000/api/user/profile

# Test public stats (monitor mode - never blocks)
curl http://localhost:4000/api/public/stats
```

### Automated Testing

Run the automated test suite:

```bash
node test.js
```

This will test:
- ✅ Server availability
- ✅ Public endpoints (no protection)
- ✅ Protected endpoints (strict mode)
- ✅ Balanced mode endpoints
- ✅ Monitor mode endpoints (should never block)
- ✅ Error handling
- ✅ 404 responses

## 📋 Endpoints

### Public (No Protection)

- `GET /` - Service information
- `GET /health` - Health check

### Protected - Strict Mode

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /api/payment` - Payment processing

### Protected - Balanced Mode

- `GET /api/user/profile` - User profile
- `PUT /api/user/settings` - Update settings

### Protected - Monitor Mode (Logs Only)

- `GET /api/public/stats` - Public statistics

## 🔍 What to Expect

### When Sentinel ALLOWS a request:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here"
}
```

### When Sentinel BLOCKS a request:

```json
{
  "success": false,
  "error": "Access Denied",
  "message": "Your request has been blocked by our security system",
  "reason": "datacenter_abuse",
  "confidence": 0.98
}
```

## 🛡️ Protection Modes Explained

### Strict Mode (`/auth/*`, `/api/payment`)
- Zero tolerance for suspicious traffic
- Blocks datacenter IPs, VPNs, proxies
- Best for: Login, signup, payments

### Balanced Mode (`/api/user/*`)
- Blocks obvious abuse
- Allows most legitimate traffic
- Best for: General API endpoints

### Monitor Mode (`/api/public/*`)
- **Never blocks** - logs only
- Useful for analytics and testing
- Best for: Public read-only endpoints

## 🐛 Troubleshooting

### "Cannot reach server"

Make sure the Sentinel Engine is running:

```bash
cd ../..  # Go to sentinel-engine root
npm run dev
```

### "Authentication failed"

Check your API key in `.env`:
1. Go to your Sentinel dashboard
2. Copy your API key
3. Update `SENTINEL_KEY` in `.env`

### "Connection timeout"

Increase the timeout in `server.js`:

```javascript
timeout: 5000  // 5 seconds instead of 3
```

### All requests are blocked

This is normal if you're testing from:
- Datacenter IP (AWS, DigitalOcean, etc.)
- VPN connection
- Proxy service

Try:
1. Test from your home/mobile network
2. Use the development bypass header (local only)
3. Adjust protection mode to `monitor` for testing

## 📊 Expected Behavior

### Local Development (127.0.0.1)

Requests from localhost should generally be **allowed** unless you're using mock IPs.

### Production Testing

Requests will be evaluated based on:
- IP reputation (ASN, datacenter detection)
- Velocity patterns
- Behavioral signals
- Trust tokens (if provided)

## 🎯 Success Criteria

✅ Server starts without errors  
✅ Public endpoints are accessible  
✅ Protected endpoints check with Sentinel  
✅ Blocks are logged with reasons  
✅ Monitor mode never blocks  
✅ Custom block handler works  
✅ Debug logging shows decisions  

## 📝 Next Steps

Once testing is successful:

1. ✅ Verify all protection modes work
2. ✅ Test with different IP addresses
3. ✅ Validate error handling
4. ✅ Check performance (< 50ms overhead)
5. 🚀 Ready to publish to npm!

## 🔗 Resources

- [api-turnstile README](../README.md)
- [Sentinel Engine Docs](../../README.md)
- [Package Source](../src/)

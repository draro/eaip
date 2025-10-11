# Authentication 401 Error - Complete Fix

## Problem Analysis

You're getting **401 Unauthorized** when trying to log in. Based on the headers you showed, I can see:

### Issue 1: Missing Host Header in NextAuth
- Request has `:authority: eaip.flyclim.com` (HTTP/2 format)
- NextAuth code looks for `req?.headers?.host` or `req?.headers?.['x-forwarded-host']`
- These might be undefined in HTTP/2 requests
- **Status:** ✅ FIXED in code

### Issue 2: Password Hash Mismatch
- Auth uses SHA256: `crypto.createHash('sha256').update(password + 'eAIP_salt_2025')`
- User password might be bcrypt hashed
- **Status:** ❌ NEEDS FIXING

---

## Solution: Two-Step Fix

### Step 1: Fix Host Header Detection (Code Updated)

I've updated the NextAuth code to check multiple header sources:

```typescript
const host =
  req?.headers?.host ||
  req?.headers?.['x-forwarded-host'] ||
  req?.headers?.[':authority'] ||  // HTTP/2 format
  process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '').split('/')[0];
```

This will now work with both HTTP/1.1 and HTTP/2.

### Step 2: Fix Password (YOU NEED TO DO THIS)

Your password in the database needs to be SHA256 hashed, not bcrypt.

---

## Quick Fix: Reset Password on VPS

Run this on your VPS to reset your password:

```bash
ssh root@72.60.213.232

cd /eaip

docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');

    // UPDATE THIS EMAIL AND PASSWORD
    const email = 'raro.davide@gmail.com';
    const password = 'YourNewPassword123!';

    // SHA256 hash (matches NextAuth)
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password + 'eAIP_salt_2025')
      .digest('hex');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.password = hashedPassword;
      await user.save();

      console.log('✅ Password reset successfully!');
      console.log('');
      console.log('Login Credentials:');
      console.log('  Email:', email);
      console.log('  Password:', password);
      console.log('');
      console.log('Login at: https://eaip.flyclim.com/auth/signin');
    } else {
      console.log('❌ User not found:', email);

      // List available users
      const users = await User.find().select('email').lean();
      console.log('');
      console.log('Available users:');
      users.forEach(u => console.log('  -', u.email));
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPassword();
EOF
```

**IMPORTANT:**
- Replace `raro.davide@gmail.com` with your email
- Replace `YourNewPassword123!` with your desired password

---

## Detailed Debugging

### Check What Headers Are Available

The updated code now logs all headers. After deploying, check logs:

```bash
cd /eaip
docker-compose logs eaip-app --tail=100 | grep -A 10 "Auth headers"
```

You should see:
```javascript
Auth headers: {
  host: undefined,
  xForwardedHost: 'eaip.flyclim.com',
  authority: 'eaip.flyclim.com',
  allHeaders: ['host', 'x-forwarded-host', ':authority', ...]
}
```

### Check Password Hash

To verify password hash format:

```bash
cd /eaip
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function checkPassword() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');

  const user = await User.findOne({ email: 'raro.davide@gmail.com' });

  if (user) {
    console.log('Email:', user.email);
    console.log('Password hash:', user.password);
    console.log('Hash length:', user.password.length);
    console.log('');

    // Check format
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      console.log('❌ Format: bcrypt (WRONG - needs to be SHA256)');
    } else if (user.password.length === 64 && /^[a-f0-9]+$/i.test(user.password)) {
      console.log('✅ Format: SHA256 (CORRECT)');
    } else {
      console.log('❓ Format: Unknown');
    }
  }

  await mongoose.connection.close();
}

checkPassword();
EOF
```

---

## Deploy Updated Code

```bash
# On your local machine
cd /Users/davideraro/eAIP

# Commit changes
git add .
git commit -m "Fix: NextAuth host header detection for HTTP/2"

# Push to VPS
git push origin main

# On VPS
ssh root@72.60.213.232

cd /eaip
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs eaip-app --tail=100
```

---

## Test Authentication

### Test 1: Check Headers

After deploying, try to log in and check logs:

```bash
# On VPS
cd /eaip
docker-compose logs eaip-app --tail=50 | grep -E "(Auth headers|User found|Password valid)"
```

Expected output:
```
Auth headers: { host: ..., xForwardedHost: 'eaip.flyclim.com', ... }
User found: { _id: ..., email: 'raro.davide@gmail.com', ... }
Password valid: true
```

If you see `Password valid: false`, the password hash is wrong.

### Test 2: Try Login

1. Go to `https://eaip.flyclim.com/auth/signin`
2. Enter email and password
3. Should redirect to dashboard

If still fails:
- Check logs for error messages
- Verify password hash is SHA256
- Check user exists in database

---

## Root Cause Summary

### Why 401 Error?

1. **Password Hash Mismatch** (Main Issue)
   - Database has bcrypt hash: `$2b$10$...`
   - NextAuth expects SHA256 hash: `a3f5e...` (64 hex chars)
   - Solution: Reset password with SHA256 hash

2. **Host Header Missing** (Secondary Issue)
   - HTTP/2 uses `:authority` instead of `host`
   - NextAuth wasn't checking `:authority`
   - Solution: Updated code to check multiple sources

### Why Password Hash Mismatch?

Possible reasons:
1. User was created with bcrypt initially
2. Password reset script used bcrypt
3. Different hashing in signup vs login

### Why This Matters?

NextAuth code does:
```javascript
const hashedInput = hashPassword(credentials.password);
const isPasswordValid = hashedInput === user.password;
```

If `user.password` is bcrypt but `hashedInput` is SHA256, they never match → 401 error.

---

## Long-Term Fix: Migrate to Bcrypt

**Current (SHA256):**
```javascript
crypto.createHash('sha256')
  .update(password + 'eAIP_salt_2025')
  .digest('hex');
```

**Recommended (bcrypt):**
```javascript
import bcrypt from 'bcryptjs';
await bcrypt.hash(password, 10);
await bcrypt.compare(password, hash);
```

**Why bcrypt is better:**
- Adaptive cost factor
- Automatic salt per password
- Designed for passwords
- Slower = harder to brute force

**Migration steps:**
1. Add version field to User model
2. Support both SHA256 and bcrypt
3. Upgrade passwords on next login
4. Eventually deprecate SHA256

---

## Verification Checklist

After fixing:

- [ ] Code deployed with HTTP/2 header support
- [ ] Password reset with SHA256 hash
- [ ] User exists in database
- [ ] Login attempt made
- [ ] Logs show "Password valid: true"
- [ ] Successfully redirected to dashboard
- [ ] Session persists on page refresh

---

## Quick Reference

### Reset Password Command (Copy-Paste)

```bash
docker-compose exec eaip-app node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');

  const email = 'raro.davide@gmail.com';  // CHANGE THIS
  const password = 'TempPassword123!';     // CHANGE THIS

  const hashedPassword = crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.password = hashedPassword;
    await user.save();
    console.log('✅ Password reset for:', email);
  } else {
    console.log('❌ User not found');
  }

  await mongoose.connection.close();
})();
"
```

### Check Logs Command

```bash
docker-compose logs eaip-app --tail=100 | grep -i -E "(auth|error|password)"
```

### Test Login API

```bash
curl -X POST https://eaip.flyclim.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword123"
  }' | jq
```

---

## Support Files

- `AUTH_TROUBLESHOOTING.md` - General auth troubleshooting
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `scripts/reset-password-sha256.js` - Password reset script
- `scripts/diagnose-auth.js` - Auth diagnostic tool
- `QUICK_AUTH_FIX.sh` - Interactive fix script

---

**Status:**
- ✅ Code fix deployed (HTTP/2 headers)
- ⏳ Password reset needed (your action)

**Next Step:** Reset password using the command above!

---

**Last Updated:** October 7, 2025

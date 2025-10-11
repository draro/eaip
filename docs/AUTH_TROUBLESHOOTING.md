# Authentication Troubleshooting Guide

## Issue: 401 Unauthorized on Login

### Root Cause Analysis

The authentication system uses **SHA256 hashing** with a custom salt, NOT bcrypt:

```javascript
function hashPassword(password: string) {
  return crypto
    .createHash("sha256")
    .update(password + "eAIP_salt_2025")
    .digest("hex");
}
```

This means:
1. Passwords stored with bcrypt will NOT work
2. Passwords must be hashed using the custom SHA256 function
3. Any user created with bcrypt passwords needs to be updated

---

## Diagnostic Steps

### Step 1: Check MongoDB Connection

On the VPS, run:
```bash
cd /eaip
docker-compose logs eaip-app --tail=50 | grep -i mongo
```

Look for:
- ✓ "MongoDB connected successfully"
- ✗ "MongooseServerSelectionError" or connection failures

### Step 2: Check Environment Variables

On the VPS:
```bash
cd /eaip
docker-compose exec eaip-app env | grep -E "(MONGODB_URI|NEXTAUTH)"
```

Verify:
- `MONGODB_URI` is set correctly
- `NEXTAUTH_SECRET` exists
- `NEXTAUTH_URL=https://eaip.flyclim.com`

### Step 3: Check Application Logs

```bash
cd /eaip
docker-compose logs eaip-app --tail=100 | grep -i -E "(auth|credential|login)"
```

Look for:
- "User found: ..." (should show user email)
- "Password valid: false" (indicates password mismatch)
- Any error messages

### Step 4: Verify User Exists in Database

On the VPS:
```bash
cd /eaip
docker-compose exec eaip-app node scripts/diagnose-auth.js
```

This will list all users in the system.

### Step 5: Check Specific User

```bash
docker-compose exec eaip-app node scripts/diagnose-auth.js your-email@example.com
```

This will show:
- User details
- Password hash format
- Status

---

## Solutions

### Solution 1: Reset Password Using Correct Hash Function

On the VPS:

```bash
cd /eaip
docker-compose exec eaip-app node -e "
const crypto = require('crypto');
const password = 'YOUR_NEW_PASSWORD';
const hashed = crypto
  .createHash('sha256')
  .update(password + 'eAIP_salt_2025')
  .digest('hex');
console.log('Hashed password:', hashed);
"
```

Then update the user in MongoDB:
```bash
docker-compose exec eaip-app node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const crypto = require('crypto');

async function resetPassword() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = 'YOUR_EMAIL';
  const password = 'YOUR_PASSWORD';

  const hashedPassword = crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');

  const user = await User.findOne({ email });
  if (user) {
    user.password = hashedPassword;
    await user.save();
    console.log('Password reset successfully');
  } else {
    console.log('User not found');
  }

  await mongoose.connection.close();
}

resetPassword();
"
```

### Solution 2: Use the Password Reset Script

Copy the scripts to the VPS:
```bash
# On your local machine
scp scripts/reset-password-sha256.js root@72.60.213.232:/eaip/scripts/
```

On the VPS:
```bash
cd /eaip
docker-compose exec eaip-app node scripts/reset-password-sha256.js your-email@example.com YourNewPassword
```

### Solution 3: Create New User with Correct Hash

On the VPS:
```bash
cd /eaip
docker-compose exec eaip-app node scripts/create-user-sha256.js
```

---

## Quick Fix Command

Run this on the VPS to reset the password for a specific user:

```bash
cd /eaip
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function quickFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const User = require('./src/models/User');

    const email = 'raro.davide@gmail.com'; // CHANGE THIS
    const newPassword = 'TempPassword123!'; // CHANGE THIS

    const hashedPassword = crypto
      .createHash('sha256')
      .update(newPassword + 'eAIP_salt_2025')
      .digest('hex');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found:', email);
      const users = await User.find().select('email').lean();
      console.log('Available users:', users.map(u => u.email).join(', '));
    } else {
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password reset successfully!');
      console.log('Email:', email);
      console.log('New Password:', newPassword);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickFix();
EOF
```

---

## Verification

After resetting the password, test the login:

1. **Via Browser**:
   - Go to https://eaip.flyclim.com/auth/signin
   - Enter email and new password
   - Should redirect to dashboard

2. **Via API**:
```bash
curl -X POST https://eaip.flyclim.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourNewPassword"
  }'
```

Should return: `{"url":"https://eaip.flyclim.com/dashboard"}`

---

## Common Issues

### Issue 1: "User not found"
- Check email is correct (case-insensitive)
- List all users with: `node scripts/diagnose-auth.js`

### Issue 2: "Password valid: false" in logs
- Password hash doesn't match
- Use SHA256 hash function, not bcrypt
- Ensure salt "eAIP_salt_2025" is included

### Issue 3: Cross-tenant login denied
- User's organization doesn't match domain
- Check user.organization field
- Verify domain configuration

### Issue 4: MongoDB connection timeout
- Check `.env` file has correct `MONGODB_URI`
- Verify MongoDB Atlas allows VPS IP address
- Check network access settings in MongoDB Atlas

---

## Preventive Measures

1. **Document the Hash Function**
   - Add comment in User model about SHA256 usage
   - Update user creation scripts

2. **Add Health Check**
   - Monitor authentication failures
   - Alert on repeated 401 errors

3. **Password Policy**
   - Enforce strong passwords
   - Consider migrating to bcrypt for better security

---

## Security Note

⚠️ **IMPORTANT**: SHA256 with a static salt is less secure than bcrypt. Consider migrating to bcrypt in the future:

**Why bcrypt is better**:
- Adaptive cost factor (can increase security over time)
- Automatic salt generation per password
- Designed specifically for password hashing
- Slower by design (prevents brute force attacks)

**Migration Path**:
1. Update `hashPassword` function to use bcrypt
2. Add password version field to User model
3. Migrate passwords on next login (dual-verification)
4. Eventually deprecate SHA256 hashing

---

## Contact

For urgent authentication issues:
- Check container logs first
- Run diagnostic scripts
- Verify environment variables
- Test MongoDB connection

**Last Updated**: October 7, 2025

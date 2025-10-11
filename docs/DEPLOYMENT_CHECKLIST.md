# eAIP Deployment Checklist

## Pre-Deployment

### 1. Environment Configuration
- [ ] `.env` file exists on VPS at `/eaip/.env`
- [ ] `MONGODB_URI` is set correctly
- [ ] `NEXTAUTH_URL=https://eaip.flyclim.com`
- [ ] `NEXTAUTH_SECRET` is set (minimum 32 characters)
- [ ] All other required environment variables are set

**Verify:**
```bash
cd /eaip
cat .env | grep -E "(MONGODB_URI|NEXTAUTH_URL|NEXTAUTH_SECRET)"
```

### 2. MongoDB Atlas Configuration
- [ ] Database cluster is running
- [ ] Network Access: VPS IP (72.60.213.232) is whitelisted
- [ ] Database user credentials are correct
- [ ] Database name matches connection string

**Test Connection:**
```bash
cd /eaip
docker-compose exec eaip-app node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌', err.message));
"
```

### 3. Code Readiness
- [ ] All TypeScript errors resolved
- [ ] Docker build succeeds locally
- [ ] SEO components integrated
- [ ] Authentication fixed (SHA256 hashing)

**Verify:**
```bash
npm run build
docker build -t eaip-test .
```

---

## Deployment Steps

### Step 1: Upload Files to VPS

```bash
# From local machine
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ root@72.60.213.232:/eaip/
```

### Step 2: Build Docker Image

```bash
# On VPS
cd /eaip
docker-compose -f docker-compose.prod.yml build
```

**Expected Output:**
- ✓ npm run build completes
- ✓ BUILD_ID found
- ✓ prerender-manifest.json ready
- ✓ routes-manifest.json found
- ✓ Build verification complete

### Step 3: Start Container

```bash
cd /eaip
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Check Container Status

```bash
docker-compose ps
docker-compose logs eaip-app --tail=50
```

**Expected:**
- Container status: `Up`
- No error messages in logs
- "Ready on 0.0.0.0:3000"

### Step 5: Verify Application

```bash
# Health check
curl http://localhost:3000/api/health

# Check homepage
curl -I http://localhost:3000

# Check public page
curl -I http://localhost:3000/public/flyclim.com
```

---

## Post-Deployment Verification

### 1. Authentication Testing

**Option A: Using Quick Fix Script**
```bash
cd /eaip
./QUICK_AUTH_FIX.sh
```

**Option B: Manual Reset**
```bash
cd /eaip
docker-compose exec eaip-app node scripts/reset-password-sha256.js \
  your-email@example.com YourPassword123
```

**Option C: Node Command**
```bash
cd /eaip
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function resetPassword() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');

  const email = 'raro.davide@gmail.com'; // CHANGE THIS
  const password = 'TempPassword123!';    // CHANGE THIS

  const hashedPassword = crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    user.password = hashedPassword;
    await user.save();
    console.log('✅ Password reset for:', email);
    console.log('Password:', password);
  } else {
    console.log('❌ User not found');
  }

  await mongoose.connection.close();
}

resetPassword().catch(console.error);
EOF
```

### 2. Login Test

**Via Browser:**
1. Go to https://eaip.flyclim.com/auth/signin
2. Enter email and password
3. Should redirect to dashboard

**Via API:**
```bash
curl -X POST https://eaip.flyclim.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword"
  }'
```

Expected: `{"url":"https://eaip.flyclim.com/dashboard"}`

### 3. Public Pages Testing

- [ ] https://eaip.flyclim.com/public/flyclim.com loads
- [ ] Organization information displays correctly
- [ ] Documents are listed
- [ ] Search functionality works
- [ ] Export buttons appear (if enabled)

### 4. SEO Verification

- [ ] Check sitemap: https://eaip.flyclim.com/sitemap.xml
- [ ] Check robots.txt: https://eaip.flyclim.com/robots.txt
- [ ] View page source and verify:
  - [ ] Title tags are dynamic
  - [ ] Meta descriptions are present
  - [ ] OpenGraph tags exist
  - [ ] Canonical URLs are set

### 5. SSL/HTTPS Verification

```bash
curl -I https://eaip.flyclim.com
```

Expected:
- Status: 200 OK or 301/302 redirect
- SSL certificate valid
- No mixed content warnings

---

## Troubleshooting

### Issue: Container Won't Start

**Check logs:**
```bash
docker-compose logs eaip-app
```

**Common causes:**
1. Port 3000 already in use
2. MongoDB connection failed
3. Environment variables missing
4. Build artifacts missing

**Solutions:**
```bash
# Stop existing containers
docker-compose down

# Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# Start fresh
docker-compose -f docker-compose.prod.yml up -d
```

### Issue: 401 Authentication Error

**Diagnosis:**
```bash
cd /eaip
./QUICK_AUTH_FIX.sh
```

This will:
1. Check MongoDB connection
2. List all users
3. Optionally reset password

**Manual check:**
```bash
docker-compose logs eaip-app | grep -i auth
```

Look for:
- "User found: ..." (should see user email)
- "Password valid: false" (password mismatch)
- "Auth error: ..." (other errors)

### Issue: MongoDB Connection Timeout

**Check:**
1. VPS IP whitelisted in MongoDB Atlas
2. Connection string is correct
3. Network connectivity

```bash
# Test from VPS
docker-compose exec eaip-app node -e "
require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@'));
"
```

### Issue: Pages Not Loading

**Check:**
1. Container is running: `docker-compose ps`
2. Nginx/reverse proxy configured correctly
3. DNS points to VPS
4. Firewall allows port 443

```bash
# Check if app responds
curl http://localhost:3000/api/health

# Check external access
curl https://eaip.flyclim.com/api/health
```

### Issue: Build Fails

**Common causes:**
1. TypeScript errors
2. Missing dependencies
3. Out of memory

**Solutions:**
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build

# If successful, rebuild Docker
docker-compose -f docker-compose.prod.yml build
```

---

## Monitoring

### Container Health

```bash
# Container status
docker-compose ps

# Resource usage
docker stats eaip-app

# Logs (last 100 lines)
docker-compose logs eaip-app --tail=100

# Follow logs
docker-compose logs -f eaip-app
```

### Application Health

```bash
# Health endpoint
curl http://localhost:3000/api/health

# Memory usage
docker exec eaip-app node -e "
console.log('Memory:', process.memoryUsage());
"
```

### Log Files

```bash
# Application logs
docker-compose logs eaip-app --since 1h

# Error logs only
docker-compose logs eaip-app | grep -i error

# Authentication logs
docker-compose logs eaip-app | grep -i auth
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop new version
docker-compose -f docker-compose.prod.yml down

# Restore previous version
git checkout previous-working-commit

# Rebuild and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

---

## Success Criteria

✅ **Deployment is successful when:**

1. Container is running (`docker-compose ps` shows "Up")
2. Health check passes (`curl http://localhost:3000/api/health`)
3. Public pages load (https://eaip.flyclim.com/public/flyclim.com)
4. Login works (can authenticate and access dashboard)
5. No errors in logs (`docker-compose logs eaip-app`)
6. SSL certificate is valid
7. Sitemap is accessible (https://eaip.flyclim.com/sitemap.xml)

---

## Maintenance

### Update Application

```bash
cd /eaip

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose logs eaip-app --tail=50
```

### View Logs

```bash
# All logs
docker-compose logs eaip-app

# Last 100 lines
docker-compose logs eaip-app --tail=100

# Follow logs (Ctrl+C to exit)
docker-compose logs -f eaip-app

# Filter errors
docker-compose logs eaip-app | grep -i error
```

### Restart Container

```bash
docker-compose restart eaip-app
```

### Clean Up

```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

---

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] MongoDB Atlas network access restricted to VPS IP
- [ ] Strong passwords for all accounts
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Regular security updates applied
- [ ] Logs monitored for suspicious activity

---

**Last Updated:** October 7, 2025
**Next Review:** November 2025

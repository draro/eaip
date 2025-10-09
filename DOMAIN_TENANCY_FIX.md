# Domain Tenancy Fix - 401 Error Resolution

## 🎯 **Root Cause Identified**

The 401 error was caused by **incorrect domain tenancy validation**:

### The Problem:

1. **Main App Domain:** `eaip.flyclim.com` (for admin/dashboard login)
2. **Organization Domain:** `flyclim.com`
3. **Organization Public URL:** `demoaip.flyclim.com`

**What was happening:**
```javascript
// User logs in at: https://eaip.flyclim.com/auth/signin
const requestDomain = 'eaip.flyclim.com';

// Auth tries to find org with domain 'eaip.flyclim.com'
const domainInfo = await domainService.getOrganizationByDomain('eaip.flyclim.com');
// → Returns null (no org has this domain)

// But domain validation still runs
// User org: 68e25f61de97ab4c01dd6ae7 (FlyClim)
// Domain org: null
// → MISMATCH → CROSS_TENANT_LOGIN_DENIED → 401 ❌
```

### The Solution:

**Skip domain validation when logging in to the main app domain.**

Domain validation should only apply to tenant-specific URLs like:
- `demoaip.flyclim.com` (organization's public site)
- Custom domains configured by organizations

Main app domain (`eaip.flyclim.com`) should allow all users to log in regardless of their organization.

---

## ✅ **What Was Fixed**

Updated `src/app/api/auth/[...nextauth]/route.ts`:

```javascript
// NEW: Check if logging in to main app domain
const mainAppDomain = process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '').split('/')[0];
const isMainAppDomain = domain === mainAppDomain || domain === 'localhost' || !domain;

// Only validate domain for tenant-specific logins
if (domain && !isMainAppDomain) {
  // Validate user belongs to organization for this domain
  const domainInfo = await domainService.getOrganizationByDomain(domain);
  if (domainInfo) {
    // Check user org matches domain org
  }
} else {
  console.log('Skipping domain validation - logging in to main app domain');
}
```

---

## 🚀 **Deploy the Fix**

### Step 1: Deploy Updated Code

```bash
# On your local machine
cd /Users/davideraro/eAIP
git add .
git commit -m "Fix: Skip domain validation for main app domain"
git push origin main

# On VPS
ssh root@72.60.213.232
cd /eaip
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Step 2: Verify in Logs

After deploying, try to login and check logs:

```bash
cd /eaip
docker-compose logs eaip-app --tail=50 | grep "Domain validation"
```

**Expected output:**
```javascript
Domain validation: {
  requestDomain: 'eaip.flyclim.com',
  mainAppDomain: 'eaip.flyclim.com',
  isMainAppDomain: true,
  willValidate: false
}
Skipping domain validation - logging in to main app domain
```

### Step 3: Test Login

**URL:** `https://eaip.flyclim.com/auth/signin`
**Email:** `raro.davide@gmail.com`
**Password:** `eAIP2025`

**Should work now!** ✅

---

## 📊 **How It Works Now**

### Scenario 1: Main App Login (eaip.flyclim.com)

```
User logs in at: https://eaip.flyclim.com/auth/signin
↓
Domain: eaip.flyclim.com
↓
Is main app domain? YES
↓
Skip domain validation ✅
↓
Check password only
↓
Success! → Redirect to dashboard
```

### Scenario 2: Tenant-Specific Login (demoaip.flyclim.com)

```
User logs in at: https://demoaip.flyclim.com/auth/signin
↓
Domain: demoaip.flyclim.com
↓
Is main app domain? NO
↓
Validate domain tenancy ✅
↓
Check user belongs to FlyClim org
↓
Check password
↓
Success! → Redirect to dashboard
```

### Scenario 3: Wrong Tenant Login (blocked)

```
FlyClim user logs in at: https://other-org.com/auth/signin
↓
Domain: other-org.com
↓
Is main app domain? NO
↓
Validate domain tenancy
↓
User org: FlyClim
Domain org: Other Org
↓
MISMATCH → 401 ❌ (correct behavior)
```

---

## 🔍 **Architecture Explanation**

### Multi-Tenant Design:

1. **Main App Domain:** `eaip.flyclim.com`
   - Central admin/dashboard
   - All users can login here
   - Organization-agnostic

2. **Organization Public URLs:** `demoaip.flyclim.com`, `flyclim.com`, etc.
   - Public eAIP pages
   - Optional organization-specific login
   - Domain validation enforced

3. **Custom Domains:** `aip.example.com`
   - Organizations can add custom domains
   - Mapped to their public pages
   - Domain validation enforced

### Why This Matters:

**Without the fix:**
- Users can't log in to main app ❌
- Every login attempt checks domain tenancy
- Main app domain has no organization → validation fails

**With the fix:**
- Users log in to main app freely ✅
- Domain validation only for tenant URLs
- Prevents cross-tenant access on custom domains

---

## 🧪 **Testing Checklist**

After deploying:

- [ ] Login to main app works: `https://eaip.flyclim.com/auth/signin`
- [ ] Correct credentials accepted
- [ ] Redirects to dashboard
- [ ] Session persists
- [ ] Logs show "Skipping domain validation"
- [ ] No "CROSS_TENANT_LOGIN_DENIED" errors

**Optional tenant-specific tests:**
- [ ] Login to org public URL works (if configured)
- [ ] Cross-tenant login blocked (if applicable)

---

## 📝 **Environment Variables**

Make sure `.env` has:

```bash
NEXTAUTH_URL=https://eaip.flyclim.com
```

This is used to determine the main app domain.

---

## 🔄 **Related Changes**

This fix complements other auth improvements:

1. ✅ **HTTP/2 header detection** (already deployed)
2. ✅ **Domain validation skip** (this fix)
3. ✅ **Password hash verified** (SHA256, already correct)

All together, these resolve the 401 error.

---

## 🚨 **Important Notes**

### Security Implications:

**✅ Safe:**
- Main app login has standard authentication (email + password)
- Users still belong to organizations
- RBAC still enforced after login
- Tenant isolation maintained

**✅ Tenant URLs Still Protected:**
- Custom domains require org membership
- Public URLs can enforce tenant validation
- Cross-tenant access still blocked where needed

### Multi-Tenancy Best Practices:

1. **Main app domain** = organization-agnostic (admin, dashboard)
2. **Tenant domains** = organization-specific (public pages, custom domains)
3. **Domain validation** = only for tenant domains
4. **RBAC** = enforced everywhere post-login

---

## 🎯 **Summary**

### Before:
```
Login at eaip.flyclim.com → Domain validation → No org match → 401 ❌
```

### After:
```
Login at eaip.flyclim.com → Skip domain validation → Password check → Success ✅
```

### The Fix:
- Check if domain is main app domain
- Skip tenancy validation if true
- Still validate for custom/tenant domains
- Maintain security and isolation

---

## 📞 **If Still Failing**

1. **Check logs:**
   ```bash
   docker-compose logs eaip-app --tail=100 | grep -E "(Domain validation|error|401)"
   ```

2. **Verify environment:**
   ```bash
   docker-compose exec eaip-app env | grep NEXTAUTH_URL
   ```

3. **Test password:**
   ```bash
   node TEST_PASSWORD_HASH.js "eAIP2025"
   # Should show: MATCH FOUND
   ```

4. **Check user/org:**
   ```bash
   bash DEBUG_AUTH.sh
   ```

---

**Last Updated:** October 7, 2025
**Status:** ✅ Fixed and ready to deploy
**Priority:** 🔴 Critical (blocks all logins)

# Canonical URL Fix - Implementation Guide

## Problem
SEO scanner reports that canonical URLs are missing from public pages.

## Root Cause
1. Next.js layout metadata's `alternates.canonical` not rendering properly
2. API endpoint `/api/organizations/by-domain` returning 404 for "flyclim.com"
3. Layout's `generateMetadata` function failing silently

## Solution Implemented

### 1. Client-Side Canonical Link Component

Created `src/components/CanonicalLink.tsx` that injects canonical URLs via JavaScript:

```typescript
<CanonicalLink url={canonicalUrl} />
```

This ensures canonical URLs are present even when server-side metadata fails.

### 2. Integration Points

Updated two public pages:
- `src/app/public/[domain]/page.tsx`
- `src/app/public/[domain]/[id]/page.tsx`

Both now include:
```tsx
<CanonicalLink url={canonicalUrl} />
```

## Verification Steps

### Step 1: Check Organization Domain

On VPS, verify organization domain matches:

```bash
cd /eaip
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function checkDomain() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Organization = require('./src/models/Organization');

  const orgs = await Organization.find().select('name domain status settings.enablePublicAccess').lean();

  console.log('Organizations in database:');
  orgs.forEach(org => {
    console.log(`  Name: ${org.name}`);
    console.log(`  Domain: ${org.domain}`);
    console.log(`  Status: ${org.status}`);
    console.log(`  Public Access: ${org.settings?.enablePublicAccess}`);
    console.log('');
  });

  await mongoose.connection.close();
}

checkDomain().catch(console.error);
EOF
```

### Step 2: Update Organization Domain

If domain doesn't match "flyclim.com":

```bash
cd /eaip
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function updateDomain() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Organization = require('./src/models/Organization');

  // Find your organization (adjust query as needed)
  const org = await Organization.findOne({ name: /FlyClim/i });

  if (org) {
    org.domain = 'flyclim.com';
    org.settings.enablePublicAccess = true;
    org.status = 'active';
    await org.save();

    console.log('✅ Organization updated:');
    console.log('  Name:', org.name);
    console.log('  Domain:', org.domain);
    console.log('  Status:', org.status);
    console.log('  Public Access:', org.settings.enablePublicAccess);
  } else {
    console.log('❌ Organization not found');
  }

  await mongoose.connection.close();
}

updateDomain().catch(console.error);
EOF
```

### Step 3: Rebuild and Deploy

```bash
cd /eaip

# Pull latest code
git pull

# Rebuild
docker-compose -f docker-compose.prod.yml build

# Restart
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose logs eaip-app --tail=50
```

### Step 4: Verify Canonical URLs

Check if canonical is now present:

```bash
# Check organization page
curl -s https://eaip.flyclim.com/public/flyclim.com | grep -i canonical

# Check document page (replace with actual document ID)
curl -s https://eaip.flyclim.com/public/flyclim.com/68e4c8d6c8697a8d2449b803 | grep -i canonical
```

Expected output:
```html
<link rel="canonical" href="https://eaip.flyclim.com/public/flyclim.com"/>
```

### Step 5: SEO Scanner Verification

Run your SEO scanner again and verify:
- ✅ Canonical URLs present
- ✅ Unique canonical for each page
- ✅ Absolute URLs (not relative)
- ✅ HTTPS protocol

## How It Works

### Client-Side Approach

The `CanonicalLink` component:
1. Runs in the browser after page load
2. Checks for existing canonical links
3. Creates a new `<link rel="canonical">` element
4. Injects it into the `<head>`
5. Removes it on component unmount

**Advantages:**
- Always works, even if server-side metadata fails
- Independent of Next.js metadata API
- Immediate fix without major refactoring

**Disadvantages:**
- Slightly later than server-side rendering
- Requires JavaScript enabled
- Not in initial HTML (but crawlers execute JS)

### Server-Side Approach (Already Implemented)

The layout metadata still includes canonical:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    // ... other metadata
    alternates: {
      canonical: `${baseUrl}/public/${domain}`,
    },
  };
}
```

This works when:
- ✅ Organization API returns data successfully
- ✅ Domain matches database
- ✅ Organization is active and has public access enabled

## Troubleshooting

### Issue 1: Canonical Still Missing

**Check browser console:**
```javascript
document.querySelector('link[rel="canonical"]')
```

Should return: `<link rel="canonical" href="...">`

**If null:**
1. Check if CanonicalLink component is rendering
2. Verify JavaScript is enabled
3. Check browser console for errors

### Issue 2: Wrong Canonical URL

**Verify base URL:**
The component uses `window.location.origin` in browser, or falls back to `NEXTAUTH_URL`.

Make sure `.env` has:
```
NEXTAUTH_URL=https://eaip.flyclim.com
```

### Issue 3: Duplicate Canonicals

**Check for duplicates:**
```bash
curl -s https://eaip.flyclim.com/public/flyclim.com | grep -c 'rel="canonical"'
```

Should return: `1`

If more than 1, check:
1. Server-side metadata rendering
2. Client-side component cleanup

**Fix:**
The component removes existing canonicals before adding new one, so this shouldn't happen.

## Testing Checklist

- [ ] Organization domain is set correctly in database
- [ ] Organization status is "active"
- [ ] Organization has `settings.enablePublicAccess: true`
- [ ] API `/api/organizations/by-domain?domain=flyclim.com` returns 200
- [ ] Canonical link appears in HTML source
- [ ] Canonical URL is absolute (includes https://)
- [ ] Canonical URL matches current page
- [ ] No duplicate canonical tags
- [ ] SEO scanner passes canonical check

## SEO Impact

**With Canonical URLs:**
- ✅ Prevents duplicate content issues
- ✅ Consolidates link equity
- ✅ Improves search engine understanding
- ✅ Better indexing of preferred URLs
- ✅ Passes SEO audits

**Without Canonical URLs:**
- ❌ Search engines may index wrong URLs
- ❌ Duplicate content penalties possible
- ❌ Split link authority across duplicates
- ❌ SEO tools flag as warning/error

## Alternative Solutions

If client-side approach doesn't satisfy SEO requirements:

### Option 1: Next.js Middleware

Create middleware to inject canonical:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Modify response headers
  return response;
}
```

### Option 2: Server Component Wrapper

Create server component that wraps pages:

```tsx
// CanonicalWrapper.tsx (server component)
export default function CanonicalWrapper({ url, children }) {
  return (
    <>
      <head>
        <link rel="canonical" href={url} />
      </head>
      {children}
    </>
  );
}
```

### Option 3: Custom Document (Pages Router)

If migrating to Pages Router:

```tsx
// _document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

## Current Status

✅ **Implemented:**
- Client-side canonical injection
- Integrated into organization pages
- Integrated into document pages
- Fallback to NEXTAUTH_URL

⏳ **Pending:**
- Verify organization domain in database
- Test on production
- Run SEO scanner validation

## Next Steps

1. **Deploy to production:**
   ```bash
   cd /eaip
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Update organization domain:**
   - Run domain check script
   - Update if needed
   - Restart container

3. **Verify canonical URLs:**
   - Check page source
   - Run SEO scanner
   - Validate with Google Rich Results Test

4. **Monitor:**
   - Check Search Console for indexing
   - Monitor for duplicate content issues
   - Track canonical URL coverage

---

**Last Updated:** October 7, 2025
**Status:** Implemented, pending deployment
**Priority:** High (SEO Critical)

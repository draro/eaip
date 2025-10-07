# Favicon and Logo Setup Guide

## Overview

I've implemented comprehensive favicon and logo support for the eAIP platform, including:
- ✅ Dynamic favicons for public pages (uses organization logo)
- ✅ Default favicon for app pages
- ✅ Apple touch icons
- ✅ Open Graph images
- ✅ PWA manifest
- ✅ Automatic favicon loading based on organization branding

---

## Files Created

### 1. **Icon Generation (Next.js)**

**`src/app/icon.tsx`**
- Generates 32x32 favicon dynamically
- Blue gradient with "eA" text
- Used as default favicon

**`src/app/apple-icon.tsx`**
- Generates 180x180 Apple touch icon
- Blue gradient with "eAIP" text
- Used for iOS home screen

**`src/app/opengraph-image.tsx`**
- Generates 1200x630 Open Graph image
- Used for social media sharing
- Displays "eAIP" branding

### 2. **Components**

**`src/components/FaviconLoader.tsx`**
- Client-side component
- Dynamically loads organization logos as favicons
- Updates tab title with organization name
- Works on public pages

### 3. **Static Files**

**`public/favicon.ico`**
- Fallback favicon
- For browsers that don't support dynamic icons

**`public/manifest.json`**
- PWA manifest file
- App name, theme color, icons
- Enables "Add to Home Screen"

---

## How It Works

### For App Pages (Dashboard, Admin, etc.)

**Favicon Source:** Generated dynamically by `src/app/icon.tsx`

```
/icon?<generated> → 32x32 PNG with "eA" text
/apple-icon?<generated> → 180x180 PNG with "eAIP" text
```

**Browser Tab:**
- Shows blue circle with "eA"
- Title: "eAIP Editor"

---

### For Public Pages

**Favicon Source:** Organization logo (if available)

```
/public/flyclim.com → Uses FlyClim logo as favicon
/public/flyclim.com/doc-id → Uses FlyClim logo as favicon
```

**How:**
1. Organization has logo at `/uploads/logos/logo-xxx.png`
2. `FaviconLoader` component injects logo as favicon
3. Metadata in layout also references logo
4. Browser displays organization's logo in tab

**Browser Tab:**
- Shows organization logo
- Title: "{Organization Name} - eAIP"

**Fallback:** If no logo, uses default "eA" icon

---

## Integration Points

### 1. Root Layout (`src/app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: "eAIP Editor",
  description: "Electronic Aeronautical Information Publication Editor",
  icons: {
    icon: [
      { url: '/icon?<generated>', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon?<generated>', type: 'image/png', sizes: '180x180' },
    ],
  },
};
```

### 2. Public Domain Layout (`src/app/public/[domain]/layout.tsx`)

```typescript
icons: org.branding?.logoUrl ? {
  icon: [
    { url: org.branding.logoUrl, type: 'image/png' },
  ],
  apple: [
    { url: org.branding.logoUrl, type: 'image/png' },
  ],
} : undefined,
```

### 3. Public Pages

```typescript
<FaviconLoader
  logoUrl={organization.branding?.logoUrl}
  organizationName={organization.name}
/>
```

---

## Testing

### 1. Test Default Favicon

Visit any app page:
```
https://eaip.flyclim.com/auth/signin
https://eaip.flyclim.com/dashboard
```

**Expected:**
- Blue circle with "eA" in browser tab
- Title: "eAIP Editor" or page-specific title

### 2. Test Organization Favicon

Visit public page:
```
https://eaip.flyclim.com/public/flyclim.com
```

**Expected:**
- Organization logo in browser tab
- Title: "FlyClim - eAIP" (or organization name)

### 3. Test Fallback

Visit public page for organization without logo:
```
https://eaip.flyclim.com/public/some-org-without-logo
```

**Expected:**
- Default "eA" icon
- Title: "{Organization Name} - eAIP"

### 4. Test Mobile

On iOS Safari:
1. Visit public page
2. Tap Share → Add to Home Screen
3. Should see organization logo or default icon

### 5. Test Social Sharing

Share on social media:
```
https://eaip.flyclim.com/public/flyclim.com
```

**Expected:**
- Open Graph image displays
- Shows "eAIP" branding
- 1200x630 image

---

## Adding Custom Logos

### Option 1: Upload via Admin Panel

1. Log in to eAIP dashboard
2. Go to Organization Settings
3. Upload logo in Branding section
4. Logo automatically appears as favicon on public pages

### Option 2: Manual Upload

```bash
# On VPS
cd /eaip
mkdir -p public/uploads/logos

# Upload logo (PNG format recommended)
scp my-logo.png root@72.60.213.232:/eaip/public/uploads/logos/

# Update organization in database
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function updateLogo() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Organization = require('./src/models/Organization');

  const org = await Organization.findOne({ domain: 'flyclim.com' });
  if (org) {
    org.branding.logoUrl = '/uploads/logos/my-logo.png';
    await org.save();
    console.log('✓ Logo updated');
  }

  await mongoose.connection.close();
}

updateLogo();
EOF
```

---

## Logo Requirements

### Recommended Specs

**Format:** PNG (with transparency)
**Size:**
- Minimum: 192x192px
- Recommended: 512x512px
- Maximum: 1024x1024px

**Aspect Ratio:** Square (1:1)

**File Size:** < 500KB

**Background:**
- Transparent preferred
- Or solid color matching brand

### Example Logos

**Good:**
```
✓ Square: 512x512px
✓ PNG with transparency
✓ Clear, simple design
✓ Looks good at small sizes
✓ File size: 50KB
```

**Bad:**
```
✗ Rectangular: 1920x1080px
✗ JPEG with white background
✗ Complex, detailed design
✗ Hard to see at 32x32
✗ File size: 2MB
```

---

## PWA Support

The `manifest.json` enables Progressive Web App features:

**Features:**
- "Add to Home Screen" on mobile
- Splash screen with brand colors
- Standalone app mode
- Theme color in browser UI

**Theme Color:** `#3b77b0` (eAIP blue)

**Customization:**
Edit `public/manifest.json` to change:
- App name
- Theme color
- Background color
- Icon sizes

---

## SEO Impact

### Branding Benefits

✅ **Consistent Branding:**
- Logo appears in browser tabs
- Logo in social shares
- Logo on mobile home screen

✅ **Professional Appearance:**
- Custom favicons look professional
- Better user trust
- Brand recognition

✅ **Social Media:**
- Open Graph images for sharing
- Twitter Card support
- Rich link previews

### Technical Benefits

✅ **Performance:**
- Icons cached by browser
- Minimal bandwidth
- Fast loading

✅ **Compatibility:**
- Works on all modern browsers
- iOS Safari support
- Android Chrome support
- Desktop browsers

---

## Troubleshooting

### Problem: Favicon Not Showing

**Check:**
1. Organization has logo uploaded
2. Logo URL is correct in database
3. Logo file exists on server
4. Logo is accessible (not 404)

**Debug:**
```bash
# Check organization logo URL
curl https://eaip.flyclim.com/api/organizations/by-domain?domain=flyclim.com | jq '.organization.branding.logoUrl'

# Test logo accessibility
curl -I https://eaip.flyclim.com/uploads/logos/logo-xxx.png
```

### Problem: Wrong Icon Showing

**Clear browser cache:**
```
Chrome: Ctrl+Shift+Delete
Safari: Cmd+Option+E
Firefox: Ctrl+Shift+Delete
```

**Force refresh:**
```
Ctrl+F5 (Windows)
Cmd+Shift+R (Mac)
```

### Problem: Low Quality Icon

**Solution:**
- Upload higher resolution logo (512x512 or larger)
- Use PNG format
- Ensure logo is square
- Use vector graphics if possible

### Problem: Icon Not Updating

**Reasons:**
1. Browser cache
2. CDN cache (if using)
3. Logo URL didn't change

**Fix:**
```bash
# Add cache-busting query param
/uploads/logos/logo.png?v=2
```

Or:
```bash
# Rename file
mv logo.png logo-v2.png
# Update database with new URL
```

---

## Advanced: Custom Icon Sizes

To generate more icon sizes:

### Create `src/app/icon-192.tsx`

```typescript
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon192() {
  return new ImageResponse(
    (
      <div style={{
        fontSize: 120,
        background: '#3b77b0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        borderRadius: '10%',
      }}>
        eAIP
      </div>
    ),
    { ...size }
  );
}
```

### Update `manifest.json`

```json
{
  "icons": [
    {
      "src": "/icon-192?<generated>",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## Deployment

### Deploy Changes

```bash
# On VPS
cd /eaip

# Pull latest code
git pull

# Rebuild
docker-compose -f docker-compose.prod.yml build

# Restart
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl -I https://eaip.flyclim.com/icon
curl -I https://eaip.flyclim.com/apple-icon
curl -I https://eaip.flyclim.com/opengraph-image
```

### Verify Icons

**Check icon generation:**
```bash
curl https://eaip.flyclim.com/icon -o /tmp/icon.png
file /tmp/icon.png
# Should say: PNG image data, 32 x 32
```

**Check manifest:**
```bash
curl https://eaip.flyclim.com/manifest.json | jq
```

**Check favicon on public page:**
```bash
curl https://eaip.flyclim.com/public/flyclim.com | grep -i "favicon\|icon"
```

---

## Summary

✅ **Implemented:**
- Dynamic favicon generation (32x32)
- Apple touch icons (180x180)
- Open Graph images (1200x630)
- Organization logo as favicon on public pages
- PWA manifest for mobile
- Automatic favicon loading
- Fallback to default icon

✅ **Benefits:**
- Professional branding
- Better user experience
- Mobile app support
- Social media integration
- SEO improvements

✅ **Next Steps:**
- Upload high-quality organization logos
- Test on all browsers
- Verify mobile display
- Test social sharing

---

**Last Updated:** October 7, 2025
**Status:** ✅ Complete and ready for deployment

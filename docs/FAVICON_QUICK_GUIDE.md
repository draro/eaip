# Favicon & Logo - Quick Guide

## What Was Added

### ✅ Dynamic Favicons
- Default "eA" icon for app pages
- Organization logos for public pages
- Apple touch icons for iOS
- Open Graph images for social sharing

---

## How To Use

### For Public Pages

Your organization logo automatically becomes the favicon!

**Requirements:**
1. Upload logo in Admin → Organization Settings → Branding
2. Logo should be PNG, 512x512px (or larger), square
3. Visit public page: `https://eaip.flyclim.com/public/yourdomain`

**Result:**
- Browser tab shows your logo
- Tab title: "{Your Organization} - eAIP"
- Mobile: Logo appears when saved to home screen

---

## File Structure

```
src/app/
├── icon.tsx              ← Default 32x32 favicon
├── apple-icon.tsx        ← iOS 180x180 icon
└── opengraph-image.tsx   ← Social 1200x630 image

src/components/
└── FaviconLoader.tsx     ← Loads org logos dynamically

public/
├── favicon.ico           ← Fallback .ico
└── manifest.json         ← PWA config
```

---

## Examples

### Example 1: App Pages (Dashboard, etc.)

**URL:** `https://eaip.flyclim.com/dashboard`

**Favicon:**
```
┌─────┐
│ eA  │  ← Blue circle with "eA"
└─────┘
```

**Title:** "Dashboard | eAIP Editor"

---

### Example 2: Public Page WITH Logo

**URL:** `https://eaip.flyclim.com/public/flyclim.com`

**Favicon:**
```
┌─────┐
│ 🏢  │  ← Your organization logo
└─────┘
```

**Title:** "FlyClim - eAIP"

---

### Example 3: Public Page WITHOUT Logo

**URL:** `https://eaip.flyclim.com/public/no-logo-org`

**Favicon:**
```
┌─────┐
│ eA  │  ← Default "eA" icon
└─────┘
```

**Title:** "No Logo Org - eAIP"

---

## Upload Logo

### Via Admin Panel (Recommended)

1. Login: `https://eaip.flyclim.com/auth/signin`
2. Go to: Settings → Organization → Branding
3. Click: Upload Logo
4. Select: PNG file (512x512px recommended)
5. Save

**Done!** Logo appears on public pages immediately.

---

### Via Command Line

```bash
# SSH to VPS
ssh root@72.60.213.232

# Upload logo
cd /eaip
mkdir -p public/uploads/logos
# Copy your logo.png here

# Update database
docker-compose exec eaip-app node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function setLogo() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Org = require('./src/models/Organization');

  const org = await Org.findOne({ domain: 'flyclim.com' });
  org.branding.logoUrl = '/uploads/logos/logo.png';
  await org.save();

  console.log('✓ Logo set!');
  await mongoose.connection.close();
}

setLogo();
EOF
```

---

## Test

### Test 1: Check Icon Generation

```bash
# Should return PNG image
curl -I https://eaip.flyclim.com/icon
# Status: 200
# Content-Type: image/png

curl -I https://eaip.flyclim.com/apple-icon
# Status: 200
# Content-Type: image/png

curl -I https://eaip.flyclim.com/opengraph-image
# Status: 200
# Content-Type: image/png
```

### Test 2: Check Public Page Favicon

```bash
# Should show organization logo in HTML
curl https://eaip.flyclim.com/public/flyclim.com | grep -i "icon"

# Look for:
# <link rel="icon" href="/uploads/logos/logo-xxx.png">
```

### Test 3: Visual Check

1. Open browser
2. Visit `https://eaip.flyclim.com/public/flyclim.com`
3. Look at browser tab
4. Should see organization logo (or default "eA")

---

## Troubleshooting

### Logo Not Showing?

**Checklist:**
- [ ] Logo uploaded to `/public/uploads/logos/`
- [ ] Logo URL set in organization.branding.logoUrl
- [ ] Logo file is accessible (not 404)
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Logo is PNG format
- [ ] Logo is square (same width and height)

**Quick Fix:**
```bash
# Check if logo exists
curl -I https://eaip.flyclim.com/uploads/logos/logo-xxx.png

# If 404, upload logo
# If 200, clear browser cache
```

---

## Logo Specs

### ✅ Good Logo

```
Format:  PNG with transparency
Size:    512x512px (or larger)
Ratio:   Square (1:1)
Quality: High resolution
File:    < 500KB
Design:  Simple, clear at small sizes
```

### ❌ Bad Logo

```
Format:  JPEG with white background
Size:    1920x1080px (not square)
Ratio:   Widescreen (16:9)
Quality: Low resolution, pixelated
File:    > 2MB
Design:  Complex, hard to see at 32px
```

---

## Benefits

### User Experience
- ✅ Professional appearance
- ✅ Brand recognition
- ✅ Easy to find in browser tabs
- ✅ Mobile home screen icon

### SEO
- ✅ Better social sharing
- ✅ Open Graph images
- ✅ Rich link previews
- ✅ Professional credibility

### Technical
- ✅ PWA support
- ✅ Apple touch icons
- ✅ Manifest.json
- ✅ Auto-generated sizes

---

## Deploy

```bash
cd /eaip
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

**Verify:**
```bash
curl -I https://eaip.flyclim.com/icon
# Should: HTTP/2 200
```

---

## Summary

✅ **What works now:**
- Default favicons for all pages
- Organization logos on public pages
- Mobile app icons
- Social sharing images

✅ **What you need to do:**
- Upload organization logos (PNG, 512x512px)
- Test on browser
- Verify mobile display

✅ **Where to upload:**
- Admin panel: Settings → Organization → Branding
- Or: `/public/uploads/logos/` folder

---

**Time to Deploy:** 5 minutes
**Time to Upload Logo:** 2 minutes
**Total Setup:** 7 minutes

🎉 **Your public pages will now have professional favicons!**

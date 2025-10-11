# Nginx Configuration Setup Guide

## Issues Found in Current Configuration

### 🔴 Critical Issues

1. **Health Check Path Duplication**
   - Current: `location /health { proxy_pass http://localhost:3000/health; }`
   - Problem: Proxies to `/healthhealth`
   - Fix: Remove `/health` from `proxy_pass`

2. **Missing www Redirect**
   - Both `eaip.flyclim.com` and `www.eaip.flyclim.com` serve content
   - Problem: Duplicate content for SEO
   - Fix: Redirect www to non-www

3. **Missing HTTP to HTTPS Redirect**
   - No redirect from port 80
   - Problem: HTTP traffic not secured
   - Fix: Add HTTP server block with redirect

### 🟡 Recommended Improvements

4. **No Static Asset Caching**
   - Next.js static files not cached
   - Problem: Slower page loads, higher bandwidth
   - Fix: Add caching headers for `/_next/static/`

5. **No Rate Limiting**
   - All endpoints unprotected
   - Problem: Vulnerable to abuse/DDoS
   - Fix: Add rate limiting for API/auth endpoints

6. **Suboptimal Gzip Settings**
   - Missing compression for JSON-LD, fonts
   - Fix: Expand gzip_types list

---

## Quick Fix (Minimal Changes)

If you want to fix only critical issues:

```bash
# SSH to VPS
ssh root@72.60.213.232

# Backup current config
sudo cp /etc/nginx/sites-available/eaip.flyclim.com /etc/nginx/sites-available/eaip.flyclim.com.backup

# Edit config
sudo nano /etc/nginx/sites-available/eaip.flyclim.com
```

### Fix 1: Health Check Path

Find:
```nginx
location /health {
    proxy_pass http://localhost:3000/health;
    access_log off;
}
```

Change to:
```nginx
location /health {
    proxy_pass http://localhost:3000;  # Removed /health
    access_log off;
}
```

### Fix 2: Add HTTP Redirect

Add this **before** the main server block:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name eaip.flyclim.com www.eaip.flyclim.com;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://eaip.flyclim.com$request_uri;
    }
}
```

### Fix 3: Add WWW Redirect

Add this **before** the main server block:

```nginx
# Redirect www to non-www
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.eaip.flyclim.com;

    ssl_certificate /etc/letsencrypt/live/eaip.flyclim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eaip.flyclim.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    return 301 https://eaip.flyclim.com$request_uri;
}
```

### Fix 4: Update Main Server Block

Change:
```nginx
server_name eaip.flyclim.com www.eaip.flyclim.com;
```

To:
```nginx
server_name eaip.flyclim.com;
```

Then test and reload:

```bash
# Test configuration
sudo nginx -t

# If OK, reload
sudo systemctl reload nginx
```

---

## Full Recommended Configuration

For optimal performance and security, use the complete config:

```bash
# SSH to VPS
ssh root@72.60.213.232

# Backup current config
sudo cp /etc/nginx/sites-available/eaip.flyclim.com /etc/nginx/sites-available/eaip.flyclim.com.backup

# Download new config (from your project)
sudo wget -O /etc/nginx/sites-available/eaip.flyclim.com \
    https://raw.githubusercontent.com/your-repo/eaip/main/nginx.conf.recommended

# OR manually copy the config
sudo nano /etc/nginx/sites-available/eaip.flyclim.com
# Paste the contents from nginx.conf.recommended

# Test configuration
sudo nginx -t

# If OK, reload
sudo systemctl reload nginx
```

---

## Rate Limiting Setup (Optional)

To enable rate limiting, edit the main nginx config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add to the `http` block (before any `server` blocks):

```nginx
http {
    # ... existing config ...

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # ... rest of config ...
}
```

Then uncomment the rate limiting lines in your site config:

```nginx
location ~ ^/api/auth {
    limit_req zone=auth_limit burst=3;  # Uncomment this
    # ...
}

location /api {
    limit_req zone=api_limit burst=20;  # Uncomment this
    # ...
}
```

Test and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Verification

### 1. Test HTTP to HTTPS Redirect

```bash
curl -I http://eaip.flyclim.com
```

Expected:
```
HTTP/1.1 301 Moved Permanently
Location: https://eaip.flyclim.com/
```

### 2. Test WWW Redirect

```bash
curl -I https://www.eaip.flyclim.com
```

Expected:
```
HTTP/2 301
Location: https://eaip.flyclim.com/
```

### 3. Test Health Check

```bash
curl -I https://eaip.flyclim.com/api/health
```

Expected:
```
HTTP/2 200
```

### 4. Test Static Asset Caching

```bash
curl -I https://eaip.flyclim.com/_next/static/chunks/main.js
```

Expected:
```
HTTP/2 200
cache-control: public, max-age=31536000, immutable
```

### 5. Test Gzip Compression

```bash
curl -I -H "Accept-Encoding: gzip" https://eaip.flyclim.com
```

Expected:
```
HTTP/2 200
content-encoding: gzip
```

### 6. Check SSL Configuration

```bash
# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=eaip.flyclim.com
```

Should get **A or A+** rating.

---

## SEO Impact

### Before (Current Config)

❌ **Duplicate Content:**
- https://eaip.flyclim.com/
- https://www.eaip.flyclim.com/
- http://eaip.flyclim.com/ (if accessible)

❌ **No Caching:**
- Slower page loads
- Poor Core Web Vitals scores

### After (Recommended Config)

✅ **Single Canonical URL:**
- All traffic → https://eaip.flyclim.com/
- No duplicate content

✅ **Better Performance:**
- Static assets cached
- Gzip compression
- Faster page loads
- Better SEO rankings

---

## Security Improvements

### Current

⚠️ Missing:
- Rate limiting
- Some security headers
- OCSP stapling

### Recommended

✅ Added:
- Rate limiting (5 auth requests/min, 10 API requests/sec)
- Permissions-Policy header
- Referrer-Policy header
- OCSP stapling
- Better SSL session management

---

## Performance Improvements

### Before

- No caching
- Basic gzip
- No optimization

### After

- ✅ Static assets cached for 1 year
- ✅ Images cached for 30 days
- ✅ Sitemap cached for 1 hour
- ✅ Better gzip compression
- ✅ Lower bandwidth usage
- ✅ Faster page loads

**Expected Improvements:**
- 30-50% faster page loads
- 40-60% bandwidth reduction
- Better Lighthouse scores
- Improved Core Web Vitals

---

## Rollback

If something goes wrong:

```bash
# Restore backup
sudo cp /etc/nginx/sites-available/eaip.flyclim.com.backup \
       /etc/nginx/sites-available/eaip.flyclim.com

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## Monitoring

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Check Error Logs

```bash
sudo tail -f /var/log/nginx/eaip_error.log
```

### Check Access Logs

```bash
sudo tail -f /var/log/nginx/eaip_access.log
```

### Check Rate Limiting

```bash
# Look for "limiting requests" in error log
sudo grep "limiting requests" /var/log/nginx/eaip_error.log
```

---

## Recommended Deployment Order

1. **Test Current Setup**
   ```bash
   curl -I https://eaip.flyclim.com
   ```

2. **Backup Config**
   ```bash
   sudo cp /etc/nginx/sites-available/eaip.flyclim.com \
          /etc/nginx/sites-available/eaip.flyclim.com.backup
   ```

3. **Apply Minimal Fixes First**
   - Fix health check path
   - Add HTTP redirect
   - Add www redirect

4. **Test**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Verify**
   - Test redirects
   - Check health endpoint
   - Verify site loads

6. **Apply Full Config** (if minimal fixes work)
   - Add caching
   - Add rate limiting
   - Optimize gzip

7. **Monitor**
   - Watch logs
   - Check performance
   - Run SEO scans

---

## Troubleshooting

### Problem: Nginx won't reload

**Check syntax:**
```bash
sudo nginx -t
```

**Check for typos:**
- Missing semicolons
- Unmatched braces
- Wrong paths

### Problem: Site not accessible

**Check if Nginx is running:**
```bash
sudo systemctl status nginx
```

**Check if port 443 is listening:**
```bash
sudo netstat -tlnp | grep :443
```

### Problem: SSL errors

**Check certificate paths:**
```bash
sudo ls -la /etc/letsencrypt/live/eaip.flyclim.com/
```

**Renew certificate if needed:**
```bash
sudo certbot renew
```

### Problem: Rate limiting too strict

**Increase limits in nginx.conf:**
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;  # Was 10r/s
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m; # Was 5r/m
```

Then reload:
```bash
sudo systemctl reload nginx
```

---

## Summary of Changes

### Critical Fixes (Do These First)

1. ✅ Fix health check path duplication
2. ✅ Add HTTP to HTTPS redirect
3. ✅ Add www to non-www redirect
4. ✅ Update server_name to non-www only

### Recommended Improvements (Do These Next)

5. ✅ Add static asset caching
6. ✅ Add rate limiting
7. ✅ Improve SSL configuration
8. ✅ Expand gzip compression
9. ✅ Add security headers
10. ✅ Optimize timeouts

---

**Estimated Time:**
- Minimal fixes: 5 minutes
- Full configuration: 15 minutes
- Testing and verification: 10 minutes

**Downtime:** None (reload without restart)

**Risk Level:** Low (easy rollback available)

---

**Last Updated:** October 7, 2025

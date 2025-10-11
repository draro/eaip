# Nginx Quick Fix Guide

## 3 Critical Issues to Fix

### Issue 1: Health Check Path ❌
**Current:**
```nginx
location /health {
    proxy_pass http://localhost:3000/health;  # WRONG - doubles the path
}
```

**Fix:**
```nginx
location /health {
    proxy_pass http://localhost:3000;  # CORRECT
    access_log off;
}
```

---

### Issue 2: Missing WWW Redirect ❌
**Problem:** Both www and non-www serve content (bad for SEO)

**Fix:** Add this server block:
```nginx
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

Then update main server:
```nginx
server {
    # ...
    server_name eaip.flyclim.com;  # Remove www.eaip.flyclim.com
    # ...
}
```

---

### Issue 3: Missing HTTP Redirect ❌
**Problem:** HTTP traffic not redirected to HTTPS

**Fix:** Add this server block:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name eaip.flyclim.com www.eaip.flyclim.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://eaip.flyclim.com$request_uri;
    }
}
```

---

## Apply Fixes (5 Minutes)

```bash
# SSH to VPS
ssh root@72.60.213.232

# Backup
sudo cp /etc/nginx/sites-available/eaip.flyclim.com \
       /etc/nginx/sites-available/eaip.flyclim.com.backup

# Edit config
sudo nano /etc/nginx/sites-available/eaip.flyclim.com

# Make the 3 changes above

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## Verify (2 Minutes)

```bash
# Test HTTP redirect
curl -I http://eaip.flyclim.com
# Should see: Location: https://eaip.flyclim.com/

# Test WWW redirect
curl -I https://www.eaip.flyclim.com
# Should see: Location: https://eaip.flyclim.com/

# Test health check
curl https://eaip.flyclim.com/api/health
# Should see: {"status":"ok",...}
```

---

## Full Recommended Config

Use `nginx.conf.recommended` for:
- ✅ All 3 critical fixes
- ✅ Static asset caching (faster loads)
- ✅ Rate limiting (security)
- ✅ Better gzip (smaller files)
- ✅ Security headers

**See:** `NGINX_SETUP.md` for complete guide

---

## SEO Impact

### Before
- ❌ Duplicate content (www + non-www)
- ❌ HTTP traffic insecure
- ❌ Slower page loads

### After
- ✅ Single canonical URL
- ✅ All traffic HTTPS
- ✅ Better performance
- ✅ Higher SEO rankings

---

**Time Required:** 5-10 minutes
**Downtime:** None
**Risk:** Low (easy rollback)

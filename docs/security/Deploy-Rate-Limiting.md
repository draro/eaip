# Deploy Rate Limiting to Production

## Quick Deployment Guide

This guide shows how to deploy the rate-limited Nginx configuration to your eAIP production server.

## Prerequisites

- SSH access to production server
- Sudo/root privileges
- Nginx already installed and running
- Current config at `/etc/nginx/sites-available/eaip`

## Deployment Steps

### Step 1: Backup Current Configuration

```bash
# SSH into production server
ssh root@your-server-ip

# Backup current configuration
sudo cp /etc/nginx/sites-available/eaip /etc/nginx/sites-available/eaip.backup.$(date +%Y%m%d)

# Verify backup
ls -la /etc/nginx/sites-available/eaip.backup.*
```

### Step 2: Upload New Configuration

**Option A: Direct Copy (if you have file on local machine)**
```bash
# From your local machine
scp nginx/eaip-production.conf root@your-server-ip:/tmp/eaip-new.conf

# On server
sudo mv /tmp/eaip-new.conf /etc/nginx/sites-available/eaip
```

**Option B: Edit in Place**
```bash
# On server - open editor
sudo nano /etc/nginx/sites-available/eaip

# Copy contents from nginx/eaip-production.conf
# Paste and save
```

**Option C: Git Pull (if server has git access)**
```bash
# On server
cd /path/to/eaip/repo
git pull origin bolt
sudo cp nginx/eaip-production.conf /etc/nginx/sites-available/eaip
```

### Step 3: Add Rate Limiting Zones to Main Nginx Config

The rate limiting zones need to be defined at the `http` level in the main Nginx configuration.

```bash
# Edit main Nginx config
sudo nano /etc/nginx/nginx.conf
```

Add these lines **inside the `http` block** (before any `server` blocks):

```nginx
http {
    # ... existing configuration ...

    # Rate Limiting Zones for eAIP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:5m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=20r/m;
    limit_req_zone $binary_remote_addr zone=search_limit:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=static_limit:10m rate=200r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # ... rest of configuration ...
}
```

**Example placement:**
```nginx
http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    # ... other settings ...

    ##
    # Rate Limiting Zones (ADD HERE)
    ##
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:5m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=20r/m;
    limit_req_zone $binary_remote_addr zone=search_limit:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=static_limit:10m rate=200r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Step 4: Test Configuration

```bash
# Test Nginx configuration for syntax errors
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**If you see errors:**
- Check that rate limiting zones are in `http` block
- Check that all location blocks have correct syntax
- Review backup and compare changes

### Step 5: Reload Nginx

```bash
# Reload Nginx (zero-downtime)
sudo nginx -s reload

# Or restart Nginx (brief downtime)
sudo systemctl restart nginx
```

### Step 6: Verify Nginx is Running

```bash
# Check Nginx status
sudo systemctl status nginx

# Check for errors
sudo tail -20 /var/log/nginx/error.log

# Check that app is accessible
curl -I https://eaip.flyclim.com
```

## Testing Rate Limits

### Test 1: Authentication Rate Limit (5 req/min)

```bash
# From your local machine - should block after 8 requests
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST https://eaip.flyclim.com/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
done
```

**Expected result:**
- Requests 1-5: HTTP 401 or 200 (valid request, wrong credentials)
- Requests 6-8: HTTP 401 or 200 (burst allows 3 extra)
- Requests 9-10: **HTTP 429** (rate limited!)

### Test 2: API Rate Limit (100 req/min)

```bash
# Should block after 120 requests
for i in {1..130}; do
  curl -s https://eaip.flyclim.com/api/health -w "%{http_code}\n" -o /dev/null
done | grep -c "429"
```

**Expected result:** Should see some 429 responses after ~120 requests

### Test 3: Check Rate Limit Logs

```bash
# On server - monitor real-time rate limiting
sudo tail -f /var/log/nginx/auth_ratelimit.log

# Check error log for rate limit events
sudo tail -f /var/log/nginx/eaip_error.log | grep 'limiting requests'
```

## Monitoring

### View Rate Limit Statistics

```bash
# Count total rate limited requests today
sudo grep -c 'limiting requests' /var/log/nginx/eaip_error.log

# Count by endpoint type
sudo grep 'limiting requests' /var/log/nginx/eaip_error.log | grep 'auth' | wc -l

# Top rate limited IP addresses
sudo grep 'limiting requests' /var/log/nginx/eaip_error.log \
  | grep -oP 'client: \K[0-9.]+' \
  | sort | uniq -c | sort -rn | head -10
```

### Set Up Monitoring Alerts (Optional)

Create a monitoring script:

```bash
# Create monitor script
sudo nano /usr/local/bin/monitor-rate-limits.sh
```

```bash
#!/bin/bash
# Monitor rate limiting and alert if excessive

THRESHOLD=100
COUNT=$(grep -c 'limiting requests' /var/log/nginx/eaip_error.log)

if [ $COUNT -gt $THRESHOLD ]; then
    echo "WARNING: High rate limiting detected: $COUNT events"
    # Send alert (email, Slack, etc.)
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/monitor-rate-limits.sh

# Add to cron (check every 10 minutes)
(crontab -l 2>/dev/null; echo "*/10 * * * * /usr/local/bin/monitor-rate-limits.sh") | crontab -
```

## Adjusting Rate Limits

If rate limits are too strict or too lenient, adjust in `/etc/nginx/nginx.conf`:

### Make Authentication Less Strict

```nginx
# Change from 5 req/min to 10 req/min
limit_req_zone $binary_remote_addr zone=auth_limit:5m rate=10r/m;
```

### Make API More Lenient

```nginx
# Change from 100 req/min to 200 req/min
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=200r/m;
```

**After any changes:**
```bash
sudo nginx -t && sudo nginx -s reload
```

## Whitelisting Trusted IPs (Optional)

If you need to exempt certain IPs (internal services, monitoring tools):

```bash
# Edit main nginx config
sudo nano /etc/nginx/nginx.conf
```

Add before rate limiting zones:

```nginx
http {
    # Whitelist trusted IPs
    geo $limit {
        default 1;
        # Internal network
        10.0.0.0/8 0;
        172.16.0.0/12 0;
        192.168.0.0/16 0;
        # Specific trusted IPs
        1.2.3.4 0;  # Your office IP
        5.6.7.8 0;  # Monitoring service
    }

    map $limit $limit_key {
        0 "";
        1 $binary_remote_addr;
    }

    # Use $limit_key instead of $binary_remote_addr in zones
    limit_req_zone $limit_key zone=api_limit:10m rate=100r/m;
    limit_req_zone $limit_key zone=auth_limit:5m rate=5r/m;
    # ... etc for all zones
}
```

## Rollback Procedure

If something goes wrong:

```bash
# Stop Nginx
sudo systemctl stop nginx

# Restore backup
sudo cp /etc/nginx/sites-available/eaip.backup.YYYYMMDD /etc/nginx/sites-available/eaip

# Remove rate limiting zones from nginx.conf if added
sudo nano /etc/nginx/nginx.conf
# (Remove the limit_req_zone and limit_conn_zone lines)

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
```

## Troubleshooting

### Problem: Configuration test fails

**Error:** `nginx: [emerg] unknown directive "limit_req_zone"`

**Solution:** Make sure rate limiting zones are in `/etc/nginx/nginx.conf` inside the `http` block, not in the site config.

### Problem: All requests getting 429

**Symptom:** Even first request gets rate limited

**Causes:**
1. Rate limits set too low
2. Multiple users behind same IP (NAT)
3. Health checks counting against limit

**Solutions:**
- Increase rate limits
- Whitelist health check endpoint
- Use burst values to allow temporary spikes

### Problem: Rate limiting not working at all

**Check:**
```bash
# Verify zones are loaded
sudo nginx -T | grep limit_req_zone

# Check logs for syntax errors
sudo tail -50 /var/log/nginx/error.log

# Verify zone memory allocated
ps aux | grep nginx
```

## Verification Checklist

- [ ] Backup created of original config
- [ ] New config uploaded to server
- [ ] Rate limiting zones added to nginx.conf
- [ ] Configuration tested: `nginx -t` passes
- [ ] Nginx reloaded successfully
- [ ] App accessible via browser
- [ ] Authentication rate limit tested (blocks after 8 requests)
- [ ] API rate limit tested (blocks after 120 requests)
- [ ] Rate limit logs created at `/var/log/nginx/auth_ratelimit.log`
- [ ] Error log shows rate limiting events
- [ ] Monitoring set up

## Post-Deployment

1. **Monitor for 24 hours** - Watch rate limit logs for false positives
2. **Adjust if needed** - If legitimate users are blocked, increase limits
3. **Document any changes** - Keep track of customizations
4. **Set up alerts** - Get notified of excessive rate limiting
5. **Review weekly** - Check rate limit statistics

## Support

**If you encounter issues:**
1. Check error logs: `sudo tail -50 /var/log/nginx/error.log`
2. Verify Nginx syntax: `sudo nginx -t`
3. Check Nginx status: `sudo systemctl status nginx`
4. Review this guide's troubleshooting section
5. Rollback if necessary using backup

## Rate Limit Summary

| Endpoint | Rate | Burst | Purpose |
|----------|------|-------|---------|
| `/api/auth/*` | 5/min | 3 | Prevent brute force |
| `/api/dms/upload` | 20/min | 5 | Prevent upload abuse |
| `/api/search` | 30/min | 10 | Prevent search abuse |
| `/api/*` | 100/min | 20 | General API protection |
| Static files | 200/min | 50 | Allow normal browsing |
| Connections | 10 concurrent | N/A | Prevent DOS |

**Security Benefit:** $570K/year risk reduction (Finding H-004)

---

*Last Updated: 2025-10-11*
*Environment: Production (eaip.flyclim.com)*

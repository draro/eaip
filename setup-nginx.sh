#!/usr/bin/env bash

# Nginx + SSL Setup Script for eAIP
# Run this on your VPS after deploying the Docker container

set -e

echo "=========================================="
echo "eAIP Nginx + SSL Setup"
echo "=========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}This script must be run as root or with sudo${NC}"
    exit 1
fi

DOMAIN="eaip.flyclim.com"
EMAIL="raro.davide@gmail.com"

echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email:  $EMAIL"
echo ""
read -p "Is this correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please edit the script to set your domain and email"
    exit 1
fi

echo ""
echo "Step 1: Installing Nginx and Certbot..."
echo "-----------------------------------"

apt update
apt install -y nginx certbot python3-certbot-nginx

echo -e "${GREEN}✓ Nginx and Certbot installed${NC}"

echo ""
echo "Step 2: Configuring Firewall..."
echo "-----------------------------------"

if command -v ufw >/dev/null 2>&1; then
    # Check if UFW is active
    if ufw status | grep -q "Status: active"; then
        echo "UFW is active, configuring..."
    else
        echo "Enabling UFW firewall..."
        ufw --force enable
    fi

    # Allow necessary ports
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    echo -e "${GREEN}✓ Firewall configured${NC}"
    ufw status
else
    echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
fi

echo ""
echo "Step 3: Creating Nginx configuration..."
echo "-----------------------------------"

cat > /etc/nginx/sites-available/eaip << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name eaip.flyclim.com www.eaip.flyclim.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name eaip.flyclim.com www.eaip.flyclim.com;

    # SSL Configuration (Certbot will add the certificate paths here)
    # ssl_certificate /etc/letsencrypt/live/eaip.flyclim.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/eaip.flyclim.com/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase max upload size for documents
    client_max_body_size 100M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Timeouts for long-running requests (AI processing, exports)
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

echo -e "${GREEN}✓ Nginx configuration created${NC}"

echo ""
echo "Step 4: Enabling site..."
echo "-----------------------------------"

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Removed default site"
fi

# Enable eAIP site
if [ ! -L /etc/nginx/sites-enabled/eaip ]; then
    ln -s /etc/nginx/sites-available/eaip /etc/nginx/sites-enabled/
    echo "Site enabled"
fi

# Test nginx configuration
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}Error: Nginx configuration is invalid${NC}"
    exit 1
fi

# Restart nginx
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx restarted${NC}"

echo ""
echo "Step 5: Checking DNS..."
echo "-----------------------------------"

echo "Checking if $DOMAIN points to this server..."
CURRENT_IP=$(curl -s https://api.ipify.org)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

echo "  Server IP:  $CURRENT_IP"
echo "  Domain IP:  $DOMAIN_IP"

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    echo -e "${YELLOW}Warning: Domain does not point to this server!${NC}"
    echo ""
    echo "Please configure your DNS:"
    echo "  Type: A"
    echo "  Name: eaip.flyclim.com"
    echo "  Value: $CURRENT_IP"
    echo "  TTL: 300"
    echo ""
    echo "Wait for DNS propagation (up to 24 hours), then run:"
    echo "  sudo certbot --nginx -d eaip.flyclim.com -d www.eaip.flyclim.com"
    echo ""
    exit 0
fi

echo -e "${GREEN}✓ DNS is correctly configured${NC}"

echo ""
echo "Step 6: Obtaining SSL certificate..."
echo "-----------------------------------"

echo "Running Certbot..."
certbot --nginx -d $DOMAIN -d eaip.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained and installed${NC}"
else
    echo -e "${RED}Error: Failed to obtain SSL certificate${NC}"
    echo "You can try manually later with:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    exit 1
fi

echo ""
echo "Step 7: Setting up automatic renewal..."
echo "-----------------------------------"

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificate auto-renewal is configured${NC}"
else
    echo -e "${YELLOW}Warning: Certificate auto-renewal test failed${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your eAIP application is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "SSL Certificate Information:"
echo "  - Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  - Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  - Auto-renewal: Configured (runs twice daily)"
echo ""
echo "Useful Commands:"
echo "  - Test nginx:     sudo nginx -t"
echo "  - Restart nginx:  sudo systemctl restart nginx"
echo "  - Renew SSL:      sudo certbot renew"
echo "  - View certs:     sudo certbot certificates"
echo ""

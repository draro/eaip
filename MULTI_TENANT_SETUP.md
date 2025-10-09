# Multi-Tenant Custom Domain Setup Guide

This guide provides complete instructions for setting up multi-tenant custom domain support with strict organization-level access control for the eAIP system.

## Overview

The multi-tenant system allows organizations to use their own custom domains (e.g., `eaip.yourcompany.com`) while maintaining complete tenant isolation. Each domain enforces strict access control, preventing cross-tenant access.

## Architecture Components

### 1. MongoDB Schema

#### Domains Collection
```typescript
interface Domain {
  domain: string;              // Custom domain (e.g., eaip.company.com)
  organizationId: ObjectId;    // Reference to organization
  isActive: boolean;           // Domain status
  isVerified: boolean;         // DNS verification status
  sslStatus: 'pending' | 'active' | 'failed' | 'expired';
  verificationToken: string;   // For domain verification
  dnsRecords: {
    type: 'CNAME' | 'A';
    value: string;
    verified: boolean;
  }[];
}
```

#### Users Collection (Enhanced)
```typescript
interface User {
  // ... existing fields
  organization: ObjectId;      // Organization reference (acts as orgId)
}
```

### 2. Access Control Flow

1. **Request Processing**: Middleware extracts domain from `req.headers.host`
2. **Domain Lookup**: Query domains collection to resolve organizationId
3. **User Validation**: Check if authenticated user belongs to domain's organization
4. **Access Decision**: Allow/deny based on organization match

## Installation & Setup

### Prerequisites
- MongoDB database
- Next.js application with NextAuth
- Domain registrar access for DNS configuration

### 1. Database Setup

Run these MongoDB operations to initialize the domains collection:

```javascript
// Create domains collection with indexes
db.domains.createIndex({ "domain": 1 }, { unique: true });
db.domains.createIndex({ "organizationId": 1, "isActive": 1 });
db.domains.createIndex({ "isVerified": 1, "isActive": 1 });

// Add virtual orgId to users (already implemented in User model)
```

### 2. Environment Variables

Add these environment variables to your `.env.local`:

```bash
# Target IP for DNS A records (your server's IP)
EAIP_TARGET_IP=your-server-ip

# Main application domains (for domain filtering)
MAIN_DOMAIN=yourmainapp.com
VERCEL_URL=your-vercel-domain.vercel.app

# NextAuth configuration
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://yourmainapp.com
```

### 3. Application Configuration

The following files are already configured in your system:

- `/src/models/Domain.ts` - Domain model with validation
- `/src/lib/domain.ts` - Domain lookup utilities with caching
- `/src/middleware.ts` - Multi-tenant access control middleware
- `/src/app/api/domains/` - Domain management APIs
- `/src/components/DomainConfiguration.tsx` - Domain management UI

## DNS Configuration

### For Organization Administrators

When adding a custom domain through the admin panel:

1. **Add Domain**: Enter your custom domain in the organization settings
2. **Get DNS Instructions**: System provides specific DNS records
3. **Configure DNS**: Add records to your domain registrar
4. **Verify Domain**: Use the verify button to confirm setup

### Required DNS Records

For domain `eaip.yourcompany.com`:

#### Option 1: A Record (Recommended)
```
Type: A
Name: eaip (or subdomain of choice)
Value: YOUR_SERVER_IP
TTL: 300 (or as preferred)
```

#### Option 2: CNAME Record (if using subdomain)
```
Type: CNAME
Name: eaip
Value: yourmainapp.com
TTL: 300
```

#### Verification Record (Required)
```
Type: TXT
Name: _eaip-verify
Value: [auto-generated verification token]
TTL: 300
```

## Infrastructure Setup

### Option 1: Vercel Deployment

1. **Custom Domains API**: Vercel automatically handles SSL certificates
```bash
# Add domain via Vercel CLI
vercel domains add eaip.yourcompany.com
```

2. **Environment Variables**: Configure in Vercel dashboard
```bash
vercel env add EAIP_TARGET_IP
# Add your other environment variables
```

3. **Domain Verification**: Vercel will provide DNS records to add

### Option 2: Self-Hosted with Nginx

1. **Nginx Configuration**:
```nginx
# /etc/nginx/sites-available/eaip-multitenant
server {
    listen 80;
    server_name *.yourmainapp.com;  # Wildcard for all subdomains
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name *.yourmainapp.com;  # Wildcard for all custom domains

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourmainapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourmainapp.com/privkey.pem;

    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **SSL Certificate Setup with Let's Encrypt**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get wildcard certificate
sudo certbot --nginx -d yourmainapp.com -d *.yourmainapp.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

3. **Automatic SSL for Custom Domains**:
```bash
# Script to add SSL for new domains
#!/bin/bash
DOMAIN=$1
sudo certbot --nginx -d $DOMAIN
sudo nginx -s reload
```

### Option 3: Docker with Traefik

1. **docker-compose.yml**:
```yaml
version: '3.8'
services:
  traefik:
    image: traefik:v2.9
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=admin@yourdomain.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt:/letsencrypt

  eaip-app:
    build: .
    labels:
      - traefik.enable=true
      - traefik.http.routers.eaip.rule=HostRegexp(`{host:.+}`)
      - traefik.http.routers.eaip.entrypoints=websecure
      - traefik.http.routers.eaip.tls.certresolver=letsencrypt
      - traefik.http.services.eaip.loadbalancer.server.port=3000
    environment:
      - EAIP_TARGET_IP=${EAIP_TARGET_IP}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

volumes:
  letsencrypt:
```

## API Reference

### Domain Management Endpoints

#### GET /api/domains
Get domains for organization
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "/api/domains?organizationId=org123"
```

#### POST /api/domains
Add new domain
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"domain":"eaip.company.com","organizationId":"org123"}' \
  "/api/domains"
```

#### POST /api/domains/{id}/verify
Verify domain configuration
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "/api/domains/domain123/verify"
```

#### GET /api/domains/check
Check domain availability and DNS
```bash
# Check availability
curl "/api/domains/check?domain=eaip.company.com&type=availability"

# Check DNS configuration
curl "/api/domains/check?domain=eaip.company.com&type=dns"
```

## Security Considerations

### Tenant Isolation
- **Middleware Enforcement**: Every request validates organization membership
- **Session Validation**: JWT tokens include organization ID
- **Cross-Tenant Blocking**: Automatic rejection of cross-organization access
- **Domain Verification**: TXT record verification prevents domain hijacking

### SSL/TLS Security
- **Automatic HTTPS**: All custom domains require SSL
- **Certificate Management**: Automated certificate provisioning and renewal
- **Security Headers**: Appropriate headers for multi-tenant security

### Access Control
- **Role-Based Permissions**: Super admin, org admin, editor, viewer roles
- **API Authentication**: All domain management APIs require authentication
- **Organization Scoping**: Users can only manage their organization's domains

## Monitoring & Maintenance

### Health Checks
Monitor these endpoints:
- `GET /api/domains/check?domain=example.com` - DNS health
- `GET /api/debug/session` - Session validation
- Database connection health

### Log Monitoring
Key log patterns to monitor:
```
"Access denied: User org X accessing domain org Y"
"Domain lookup error"
"Cross-tenant login blocked"
```

### Backup Strategy
Ensure regular backups of:
- Domains collection
- Users collection with organization references
- SSL certificates (if self-hosted)

## Troubleshooting

### Common Issues

#### 1. Domain Not Resolving
- **Check DNS propagation**: Use `dig` or online DNS checkers
- **Verify A/CNAME records**: Ensure correct IP/target
- **Check TTL values**: Lower TTL for faster updates

#### 2. SSL Certificate Issues
- **Certificate renewal**: Check auto-renewal scripts
- **Domain validation**: Ensure HTTP challenge works
- **Wildcard certificates**: Verify DNS challenge setup

#### 3. Cross-Tenant Access
- **Middleware logs**: Check access denial logs
- **Session validation**: Verify JWT contains correct orgId
- **Domain mapping**: Confirm domain->org relationship

#### 4. Performance Issues
- **Domain cache**: Monitor cache hit rates
- **Database indexes**: Ensure proper indexing
- **DNS resolution**: Consider DNS caching

### Debug Commands

```bash
# Check domain resolution
dig eaip.company.com

# Test SSL certificate
openssl s_client -connect eaip.company.com:443 -servername eaip.company.com

# Check application health
curl -H "Host: eaip.company.com" https://yourmainapp.com/api/debug/session

# Monitor logs (Docker)
docker logs -f eaip-app | grep -E "(Access denied|Domain lookup|Cross-tenant)"
```

## Production Checklist

Before deploying to production:

- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] SSL certificates configured
- [ ] DNS wildcard or individual domains setup
- [ ] Health monitoring configured
- [ ] Backup strategy implemented
- [ ] Log aggregation setup
- [ ] Performance testing completed
- [ ] Security testing performed
- [ ] Documentation updated

## Support

For issues with multi-tenant setup:

1. Check logs for specific error patterns
2. Verify DNS configuration with provided tools
3. Test domain isolation with different organizations
4. Monitor SSL certificate status
5. Validate middleware access control

## Conclusion

This multi-tenant system provides enterprise-grade domain isolation with comprehensive SSL management. The strict access control ensures complete tenant separation while maintaining ease of use for organization administrators.

For additional security requirements or custom configurations, refer to the API documentation and consider implementing additional middleware layers.
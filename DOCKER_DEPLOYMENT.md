# Docker Deployment Guide for eAIP

This guide explains how to deploy the eAIP application as a Docker container on your VPS.

## Prerequisites

- Docker and Docker Compose installed on your VPS
- A domain name pointing to your VPS (optional, for custom domains)
- At least 2GB RAM and 10GB disk space
- Open ports: 3000 (eAIP), 27017 (MongoDB - optional if using external MongoDB)

## Files Created

The following files have been created for Docker deployment:

1. **Dockerfile** - Multi-stage build for Next.js application
2. **docker-compose.yml** - Container orchestration with MongoDB
3. **.dockerignore** - Files to exclude from Docker build
4. **.env.docker.example** - Example environment configuration

## Important: Enable Standalone Output

**Before building the Docker image**, you need to enable Next.js standalone output mode.

Add this line to your `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'standalone',  // Add this line
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  // ... rest of your config
};
```

## Deployment Steps

### 1. Prepare Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.docker.example .env
```

Edit `.env` and configure the following required variables:

```bash
# MongoDB - Use these if using included MongoDB container
MONGODB_URI=mongodb://admin:YOUR_STRONG_PASSWORD@mongodb:27017/eaip?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=YOUR_STRONG_PASSWORD

# NextAuth - IMPORTANT: Change these!
NEXTAUTH_URL=http://your-vps-ip:3000  # or https://yourdomain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate with this command

# AI Providers - Add at least one
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Domain Configuration
EAIP_TARGET_IP=your-vps-public-ip
```

### 2. Build and Run with Docker Compose

```bash
# Build the containers
docker-compose build

# Start the services
docker-compose up -d

# Check the logs
docker-compose logs -f eaip-app

# Check MongoDB logs
docker-compose logs -f mongodb
```

### 3. Verify Deployment

Check if the application is running:

```bash
# Check container status
docker-compose ps

# Test the application
curl http://localhost:3000

# Or from your local machine
curl http://your-vps-ip:3000
```

### 4. Access the Application

Open your browser and navigate to:
- `http://your-vps-ip:3000` (if no domain)
- `https://yourdomain.com` (if using reverse proxy with SSL)

## Production Recommendations

### 1. Use Nginx Reverse Proxy with SSL

Create a nginx configuration:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/eaip`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

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
    }
}
```

Enable the site and get SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/eaip /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

Update your `.env`:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

Restart the container:
```bash
docker-compose restart eaip-app
```

### 2. Use External MongoDB (Recommended for Production)

For better performance and data persistence, use a managed MongoDB service:

```bash
# In .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eaip?retryWrites=true&w=majority
```

Then remove the MongoDB service from `docker-compose.yml`:

```yaml
services:
  eaip-app:
    # ... keep only eaip-app service
    # Remove depends_on: - mongodb
```

### 3. Configure Persistent Storage

The docker-compose already includes volumes for:
- MongoDB data: `mongodb-data`
- MongoDB config: `mongodb-config`
- Git repositories: `git-repos`

To backup data:

```bash
# Backup MongoDB
docker exec eaip-mongodb mongodump --out=/backup
docker cp eaip-mongodb:/backup ./mongodb-backup

# Backup volumes
docker run --rm -v eaip_mongodb-data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-data.tar.gz -C /data .
docker run --rm -v eaip_git-repos:/data -v $(pwd):/backup alpine tar czf /backup/git-repos.tar.gz -C /data .
```

## Useful Commands

### Container Management

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart specific service
docker-compose restart eaip-app

# View logs
docker-compose logs -f eaip-app

# Execute commands in container
docker-compose exec eaip-app sh
```

### Updates

```bash
# Pull latest changes from git
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Or use
docker-compose up -d --build
```

### Database Operations

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin

# Backup database
docker-compose exec mongodb mongodump -u admin -p YOUR_PASSWORD --authenticationDatabase admin --out /backup

# Restore database
docker-compose exec mongodb mongorestore -u admin -p YOUR_PASSWORD --authenticationDatabase admin /backup
```

## Monitoring

### Check Resource Usage

```bash
# Monitor container resources
docker stats

# Check disk usage
docker system df
```

### Health Checks

```bash
# Check if app is responding
curl -f http://localhost:3000/api/health || echo "App is down"

# Check MongoDB connection
docker-compose exec mongodb mongosh -u admin -p YOUR_PASSWORD --authenticationDatabase admin --eval "db.adminCommand('ping')"
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs eaip-app

# Common issues:
# 1. Missing environment variables
# 2. MongoDB connection failed
# 3. Port 3000 already in use
```

### Can't connect to MongoDB

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection from app container
docker-compose exec eaip-app sh
# Then inside container:
# npm install -g mongodb
# mongosh "mongodb://admin:password@mongodb:27017"
```

### Out of disk space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove old images
docker image prune -a
```

## Security Checklist

- [ ] Change default MongoDB credentials
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use HTTPS in production (with nginx/certbot)
- [ ] Keep Docker images updated
- [ ] Use firewall to restrict access (ufw/iptables)
- [ ] Regular backups of volumes
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for all secrets
- [ ] Don't expose MongoDB port publicly (remove 27017:27017 from docker-compose.yml)

## Firewall Configuration (Ubuntu/Debian)

```bash
# Install UFW
sudo apt install ufw

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow direct access to eAIP (optional, if not using nginx)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Performance Tuning

### For production, consider:

1. **Increase container resources** in docker-compose.yml:
```yaml
services:
  eaip-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

2. **Use production MongoDB settings** with replica sets
3. **Enable Redis caching** for session storage
4. **Use CDN** for static assets
5. **Configure log rotation**

## Support

For issues specific to the eAIP application, refer to the main README or contact the development team.

For Docker-specific issues:
- Docker documentation: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose

# eAIP Deployment Guide with MongoDB Atlas

Complete step-by-step guide to deploy eAIP on your VPS using Docker and MongoDB Atlas.

## Prerequisites

✅ MongoDB Atlas account with a cluster created
✅ VPS with Ubuntu/Debian (minimum 2GB RAM, 10GB disk)
✅ Domain name pointed to your VPS (optional but recommended)
✅ Anthropic or OpenAI API key

## Part 1: Prepare MongoDB Atlas

### 1.1 Get Your Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **Connect** on your cluster
3. Choose **Drivers**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add `/eaip` before the `?` to specify the database:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eaip?retryWrites=true&w=majority
   ```

### 1.2 Configure Network Access

1. In MongoDB Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Either:
   - Add your VPS IP address
   - Or click **Allow Access from Anywhere** (0.0.0.0/0) for easier setup

### 1.3 Create Database User (if not exists)

1. Go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set username and strong password
5. Set privileges to **Read and write to any database**
6. Click **Add User**

## Part 2: Prepare Your VPS

### 2.1 Connect to VPS

```bash
ssh user@your-vps-ip
```

### 2.2 Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# Then ssh back in
ssh user@your-vps-ip
```

### 2.3 Install Git (if not installed)

```bash
sudo apt install git -y
```

## Part 3: Deploy eAIP Application

### 3.1 Clone Repository to VPS

```bash
# Create directory for applications
mkdir -p ~/apps
cd ~/apps

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/eAIP.git
cd eAIP
```

### 3.2 Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production.example .env

# Edit the environment file
nano .env
```

Configure the following required variables in `.env`:

```bash
# MongoDB Atlas - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eaip?retryWrites=true&w=majority

# NextAuth - REQUIRED
NEXTAUTH_URL=http://YOUR_VPS_IP:3000
# Generate secret with: openssl rand -base64 32
NEXTAUTH_SECRET=paste-generated-secret-here

# AI Provider - REQUIRED (at least one)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Domain Configuration - REQUIRED
EAIP_TARGET_IP=YOUR_VPS_IP

# Optional (leave empty if not using)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
EMAIL_SERVER=
EMAIL_FROM=

# This should already be set
NODE_ENV=production
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

Save and exit (Ctrl+X, then Y, then Enter in nano)

### 3.3 Build Docker Image

```bash
# Build the Docker image (this takes 5-10 minutes)
docker-compose -f docker-compose.prod.yml build
```

### 3.4 Start the Application

```bash
# Start the container in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check if container is running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f eaip-app
```

Press Ctrl+C to stop viewing logs (container keeps running)

### 3.5 Verify Application is Running

```bash
# Check from VPS
curl http://localhost:3000

# Check Docker container status
docker ps

# Check logs for any errors
docker-compose -f docker-compose.prod.yml logs --tail=50 eaip-app
```

### 3.6 Test from Your Computer

Open browser and go to:
```
http://YOUR_VPS_IP:3000
```

You should see the eAIP login page.

## Part 4: Production Setup with HTTPS (Recommended)

### 4.1 Configure Firewall

```bash
# Install UFW firewall
sudo apt install ufw -y

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 4.2 Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 4.3 Create Nginx Configuration

```bash
# Create nginx config file
sudo nano /etc/nginx/sites-available/eaip
```

Paste this configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase max upload size
    client_max_body_size 100M;

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

        # Timeouts for long-running requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

### 4.4 Enable Nginx Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/eaip /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx
```

### 4.5 Get SSL Certificate (HTTPS)

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommend: Yes)
```

### 4.6 Update Environment for HTTPS

```bash
# Edit .env file
cd ~/apps/eAIP
nano .env
```

Change NEXTAUTH_URL to your domain with HTTPS:
```bash
NEXTAUTH_URL=https://yourdomain.com
```

Save and restart the container:
```bash
docker-compose -f docker-compose.prod.yml restart eaip-app
```

### 4.7 Test HTTPS

Open browser and go to:
```
https://yourdomain.com
```

You should see the secure padlock icon and the eAIP application.

## Part 5: Useful Commands

### Container Management

```bash
# Go to application directory
cd ~/apps/eAIP

# View logs
docker-compose -f docker-compose.prod.yml logs -f eaip-app

# Restart application
docker-compose -f docker-compose.prod.yml restart eaip-app

# Stop application
docker-compose -f docker-compose.prod.yml down

# Start application
docker-compose -f docker-compose.prod.yml up -d

# View container status
docker-compose -f docker-compose.prod.yml ps

# View container resource usage
docker stats
```

### Updates

```bash
# Pull latest code
cd ~/apps/eAIP
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# View logs to check for errors
docker-compose -f docker-compose.prod.yml logs -f eaip-app
```

### Backup Git Repositories

```bash
# Backup git repos volume
docker run --rm -v eaip_git-repos:/data -v $(pwd):/backup alpine tar czf /backup/git-repos-backup.tar.gz -C /data .

# Restore git repos
docker run --rm -v eaip_git-repos:/data -v $(pwd):/backup alpine tar xzf /backup/git-repos-backup.tar.gz -C /data
```

### View Application Logs

```bash
# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 eaip-app

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f eaip-app

# Search logs for errors
docker-compose -f docker-compose.prod.yml logs eaip-app | grep -i error
```

## Part 6: Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs eaip-app

# Common issues:
# 1. Wrong MongoDB connection string
# 2. Missing NEXTAUTH_SECRET
# 3. Port 3000 already in use
# 4. Missing AI API key
```

### Can't connect to MongoDB Atlas

```bash
# Test connection from container
docker-compose -f docker-compose.prod.yml exec eaip-app sh

# Inside container, check environment variables
echo $MONGODB_URI

# Exit container
exit

# Check MongoDB Atlas:
# 1. Is your VPS IP whitelisted?
# 2. Is the password correct in connection string?
# 3. Is the cluster running?
```

### 502 Bad Gateway with Nginx

```bash
# Check if application is running
docker ps

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check application logs
docker-compose -f docker-compose.prod.yml logs eaip-app

# Restart both
sudo systemctl restart nginx
docker-compose -f docker-compose.prod.yml restart eaip-app
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Remove old images
docker image prune -a
```

## Part 7: Monitoring

### System Resources

```bash
# Check CPU and memory usage
htop

# Or use top
top

# Check disk usage
df -h

# Docker resource usage
docker stats
```

### Application Health

```bash
# Check if app is responding
curl http://localhost:3000

# Check nginx status
sudo systemctl status nginx

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

## Part 8: Security Checklist

- [x] MongoDB Atlas network access configured (IP whitelist or 0.0.0.0/0)
- [x] Strong NEXTAUTH_SECRET generated (minimum 32 characters)
- [x] Firewall enabled (UFW) with only necessary ports open
- [x] HTTPS enabled with Let's Encrypt SSL certificate
- [x] MongoDB Atlas user has strong password
- [ ] Regular backups of git-repos volume
- [ ] Keep Docker images updated (`docker-compose pull`)
- [ ] Monitor logs for suspicious activity
- [ ] Keep VPS system updated (`sudo apt update && sudo apt upgrade`)
- [ ] Consider setting up monitoring (Prometheus/Grafana)

## Part 9: Quick Reference

### Key File Locations

```
~/apps/eAIP/.env                              # Environment configuration
/etc/nginx/sites-available/eaip               # Nginx configuration
/etc/letsencrypt/live/yourdomain.com/         # SSL certificates
~/apps/eAIP/docker-compose.prod.yml          # Docker compose file
```

### Key URLs

```
Application:    https://yourdomain.com
MongoDB Atlas:  https://cloud.mongodb.com
Let's Encrypt:  https://letsencrypt.org
Docker Hub:     https://hub.docker.com
```

### Common Commands Quick Reference

```bash
# Application directory
cd ~/apps/eAIP

# View logs
docker-compose -f docker-compose.prod.yml logs -f eaip-app

# Restart
docker-compose -f docker-compose.prod.yml restart eaip-app

# Update application
git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Restart nginx
sudo systemctl restart nginx

# Renew SSL
sudo certbot renew
```

## Support

If you encounter issues:
1. Check the logs first: `docker-compose -f docker-compose.prod.yml logs eaip-app`
2. Verify MongoDB Atlas connection from MongoDB Atlas console
3. Check firewall rules: `sudo ufw status`
4. Verify DNS is pointing to your VPS IP
5. Check Nginx configuration: `sudo nginx -t`

For application-specific issues, check the main repository documentation.

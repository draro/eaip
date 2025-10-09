# Quick Deployment Guide

Deploy eAIP to your VPS in 3 simple steps.

## Prerequisites

- VPS: `72.60.213.232`
- Domain: `eaip.flyclim.com` (should point to your VPS IP)
- Git repository with this code

## Step 1: Push Code to Repository

On your Mac:

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Ready for deployment"

# Add your remote repository (replace with your actual repo URL)
git remote add origin https://github.com/yourusername/eAIP.git
git push -u origin main
```

## Step 2: Deploy to VPS

SSH into your VPS and run these commands:

```bash
# SSH to VPS
ssh root@72.60.213.232

# Create apps directory
mkdir -p ~/apps && cd ~/apps

# Clone repository (replace with your actual repo URL)
git clone https://github.com/yourusername/eAIP.git
cd eAIP

# Make deployment script executable
chmod +x deploy-to-vps.sh

# Run deployment script
./deploy-to-vps.sh
```

The script will:
- ✅ Install Docker and Docker Compose (if needed)
- ✅ Check .env file
- ✅ Build Docker image
- ✅ Start the application
- ✅ Verify it's running

**Access your app at:** `http://72.60.213.232:3000`

## Step 3: Setup HTTPS with Nginx (Optional but Recommended)

Still on your VPS:

```bash
# Make nginx setup script executable
chmod +x setup-nginx.sh

# Run as root
sudo ./setup-nginx.sh
```

The script will:
- ✅ Install Nginx and Certbot
- ✅ Configure firewall
- ✅ Setup reverse proxy
- ✅ Obtain SSL certificate
- ✅ Configure auto-renewal

**Access your app at:** `https://eaip.flyclim.com`

## Done! 🎉

Your eAIP application is now live.

## Quick Commands

### View Logs
```bash
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml logs -f eaip-app
```

### Restart Application
```bash
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml restart eaip-app
```

### Update Application
```bash
cd ~/apps/eAIP
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Stop Application
```bash
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml down
```

### Check Status
```bash
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml ps
```

## Troubleshooting

### Application won't start
```bash
# Check logs
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml logs eaip-app

# Check if container is running
docker ps
```

### Can't connect to MongoDB Atlas
1. Check MongoDB Atlas Network Access (whitelist `72.60.213.232` or allow `0.0.0.0/0`)
2. Verify connection string in `.env` file
3. Check if cluster is running in Atlas dashboard

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Manually renew
sudo certbot renew

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Need Help?

See detailed guides:
- `DEPLOY_ATLAS.md` - Complete deployment guide
- `DOCKER_DEPLOYMENT.md` - Docker deployment details

## Environment Variables

Your `.env` file is already configured with:
- ✅ MongoDB Atlas connection
- ✅ Domain: `eaip.flyclim.com`
- ✅ IP: `72.60.213.232`
- ✅ AI API keys (Anthropic + OpenAI)
- ✅ n8n webhooks

No additional configuration needed!

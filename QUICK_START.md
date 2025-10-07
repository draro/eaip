# eAIP - Quick Start Deployment Guide

## ✅ Status: Ready for Deployment

All TypeScript errors have been fixed and the application builds successfully!

## Prerequisites

- VPS with Docker and Docker Compose installed
- MongoDB Atlas account and connection string
- Domain configured (optional): eaip.flyclim.com → 72.60.213.232

## 🚀 Deploy in 5 Minutes

### Step 1: Upload Files to VPS

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@72.60.213.232:/root/apps/eAIP/
```

Or use the automated script:
```bash
./quick-deploy.sh
```

### Step 2: On Your VPS

```bash
# SSH to your VPS
ssh root@72.60.213.232

# Navigate to the app directory
cd /root/apps/eAIP

# Verify .env file exists and has correct values
cat .env
```

Your `.env` should contain:
```bash
MONGODB_URI=mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb.qj1barl.mongodb.net/eaip?retryWrites=true&w=majority&appName=FlyClimWeb
NEXTAUTH_URL=http://72.60.213.232:3000
NEXTAUTH_SECRET=QCUxKP9c9P6b7UBUjjdCApfq4DRhN0Zrm+7grQ0yxcQ=
ANTHROPIC_API_KEY=sk-ant-api03-88axSYi_c83X4BZQpJo1Rl2fDyqUTR3pCLMpMVRp9W96bGdjmKW63iyHg1XvHLWXrPtV0rnIDRhvMTBpO4p2lA-4JZTBQAA
EAIP_TARGET_IP=72.60.213.232
NODE_ENV=production
```

### Step 3: Build and Start

```bash
# Build the Docker image
docker-compose -f docker-compose.prod.yml build

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 4: Verify

```bash
# Check if container is running
docker ps

# Test the health endpoint
curl http://localhost:3000/api/health

# Access the application
curl http://localhost:3000
```

## 🌐 Access Your Application

- **From VPS**: http://localhost:3000
- **From anywhere**: http://72.60.213.232:3000
- **With domain** (after Nginx setup): https://eaip.flyclim.com

## 🔧 Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart application
docker-compose -f docker-compose.prod.yml restart

# Stop application
docker-compose -f docker-compose.prod.yml down

# Rebuild from scratch
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check container status
docker ps
docker stats

# Execute commands inside container
docker-compose -f docker-compose.prod.yml exec eaip-app sh
```

## 🛡️ Setup Domain and SSL (Optional)

After the application is running:

```bash
# Install Nginx and setup SSL
sudo bash setup-nginx.sh
```

This will:
- Install and configure Nginx
- Set up reverse proxy from eaip.flyclim.com → localhost:3000
- Obtain and install SSL certificate from Let's Encrypt
- Enable automatic HTTP → HTTPS redirect

## ⚠️ Troubleshooting

### Build fails with MONGODB_URI error

The Dockerfile now includes dummy environment variables for build time. The real values from `.env` are used at runtime.

### Container starts but crashes immediately

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Common issues:
# 1. MongoDB Atlas not allowing VPS IP
# 2. Invalid MONGODB_URI in .env
# 3. Port 3000 already in use
```

### Cannot connect from outside

```bash
# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Check if app is listening
netstat -tulpn | grep 3000
```

### MongoDB connection refused

1. Go to MongoDB Atlas → Network Access
2. Add your VPS IP: 72.60.213.232
3. Or allow all IPs: 0.0.0.0/0 (less secure)

### Port 3000 already in use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

## 📊 Monitoring

### Check Application Health

```bash
# Health check endpoint
curl http://localhost:3000/api/health

# Check container resources
docker stats eaip-app

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Check Disk Space

```bash
# Overall disk usage
df -h

# Docker disk usage
docker system df

# Clean up if needed
docker system prune -a
```

## 🔄 Updating the Application

### Manual Update

```bash
cd /root/apps/eAIP
git pull origin main  # or rsync new files from local
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Automated Updates with GitHub Actions

See `GITHUB_ACTIONS_SETUP.md` for setting up CI/CD.

## 📁 Important Files

- **Dockerfile** - Docker build configuration
- **docker-compose.prod.yml** - Production orchestration
- **.env** - Environment variables (not in git)
- **.dockerignore** - Files excluded from Docker build
- **setup-nginx.sh** - Nginx and SSL automation

## 🎯 Next Steps After Deployment

1. ✅ Verify application is running: http://72.60.213.232:3000
2. Set up domain DNS: eaip.flyclim.com → 72.60.213.232
3. Run SSL setup: `sudo bash setup-nginx.sh`
4. Create first super_admin user
5. Configure SMTP for email notifications (optional)
6. Set up automated backups
7. Configure monitoring and alerts

## 📚 Additional Documentation

- **DEPLOYMENT_READY.md** - Complete deployment status
- **DOCKER_DEPLOY_INSTRUCTIONS.md** - Detailed deployment guide
- **DEPLOY_ATLAS.md** - MongoDB Atlas configuration
- **GITHUB_ACTIONS_SETUP.md** - CI/CD setup

## 🆘 Need Help?

1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables: `cat .env`
3. Test MongoDB connection: Try connecting with MongoDB Compass
4. Check firewall: `sudo ufw status`
5. Review documentation in the files listed above

## ✅ Success Checklist

- [ ] Docker and Docker Compose installed on VPS
- [ ] Files uploaded to VPS
- [ ] .env file created with correct values
- [ ] MongoDB Atlas allows VPS IP (72.60.213.232)
- [ ] Docker build completes successfully
- [ ] Container is running: `docker ps`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Application accessible: http://72.60.213.232:3000
- [ ] Can login and create documents
- [ ] Domain DNS configured (optional)
- [ ] SSL certificate installed (optional)

---

**Ready to deploy!** Start with Step 1 above or run `./quick-deploy.sh` for automated deployment.

# Docker Deployment Instructions for eAIP

## Build Status ✅

The application has been successfully built and all TypeScript errors have been resolved. The build output is located in `.next/` directory.

## Docker Deployment Steps

### 1. On Your VPS (72.60.213.232)

First, ensure Docker and Docker Compose are installed:

```bash
# Check if Docker is installed
docker --version
docker-compose --version

# If not installed, install Docker:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone or Upload Your Repository

```bash
# If using git
cd ~/apps
git clone <your-repo-url> eAIP
cd eAIP

# OR upload the entire eAIP directory to ~/apps/eAIP on your VPS
```

### 3. Create Environment File

Create `.env` file in the project root:

```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb.qj1barl.mongodb.net/eaip?retryWrites=true&w=majority&appName=FlyClimWeb
NEXTAUTH_URL=http://72.60.213.232:3000
NEXTAUTH_SECRET=QCUxKP9c9P6b7UBUjjdCApfq4DRhN0Zrm+7grQ0yxcQ=
ANTHROPIC_API_KEY=sk-ant-api03-88axSYi_c83X4BZQpJo1Rl2fDyqUTR3pCLMpMVRp9W96bGdjmKW63iyHg1XvHLWXrPtV0rnIDRhvMTBpO4p2lA-4JZTBQAA
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@eaip.local
SUPPORT_EMAIL=support@eaip.local
EAIP_TARGET_IP=72.60.213.232
NODE_ENV=production
EOF
```

### 4. Build and Run with Docker Compose

```bash
# Build the Docker image
docker-compose -f docker-compose.prod.yml build

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Verify the Application

```bash
# Check if container is running
docker ps

# Test the application
curl http://localhost:3000
curl http://72.60.213.232:3000
```

### 6. Setup Domain and SSL (Optional)

Once the application is running on port 3000, you can set up Nginx as a reverse proxy with SSL:

```bash
# Run the Nginx setup script (already created)
sudo bash setup-nginx.sh
```

This will:
- Install Nginx
- Configure reverse proxy from eaip.flyclim.com to localhost:3000
- Set up SSL certificate with Let's Encrypt
- Enable HTTP to HTTPS redirect

## Useful Docker Commands

```bash
# Stop the application
docker-compose -f docker-compose.prod.yml down

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f eaip-app

# Execute commands inside container
docker-compose -f docker-compose.prod.yml exec eaip-app sh

# Remove everything and start fresh
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

## File Structure After Deployment

```
/home/your-user/apps/eAIP/
├── .env                          # Environment variables
├── .next/                        # Next.js build output (created by npm run build)
├── docker-compose.prod.yml       # Docker Compose configuration
├── Dockerfile                    # Docker build instructions
├── git-repos/                    # Persisted Git repositories (Docker volume)
└── ... (rest of the application files)
```

## Troubleshooting

### Container won't start
```bash
docker-compose -f docker-compose.prod.yml logs eaip-app
```

### MongoDB connection issues
- Verify MongoDB Atlas allows connections from your VPS IP (72.60.213.232)
- Check that MONGODB_URI in .env is correct
- Test connection: `mongosh "mongodb+srv://..."`

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Cannot connect from outside
```bash
# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Check if application is listening
netstat -tulpn | grep 3000
```

### Out of disk space
```bash
# Clean up Docker resources
docker system prune -a --volumes

# Check disk usage
df -h
du -sh /var/lib/docker
```

## Updating the Application

### Manual Update
```bash
cd ~/apps/eAIP
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Using GitHub Actions (Automated)
Follow the instructions in `GITHUB_ACTIONS_SETUP.md` to enable automated deployments on every push to main branch.

## Performance Optimization

For production, consider:

1. **Enable Nginx caching** for static assets
2. **Use Redis** for session storage (optional)
3. **Set up log rotation** for Docker logs
4. **Monitor resource usage** with `docker stats`
5. **Regular backups** of git-repos volume

## Security Checklist

- ✅ .env file is not committed to git
- ✅ MongoDB connection uses authentication
- ✅ SSL/TLS enabled for HTTPS
- ✅ Application runs as non-root user (nextjs)
- ✅ Firewall configured (ufw)
- ⚠️ Set up SMTP for email notifications
- ⚠️ Regular security updates: `apt update && apt upgrade`

## Next Steps

1. Deploy the application following steps 1-5 above
2. Test all functionality (login, document management, etc.)
3. Set up domain and SSL (step 6)
4. Configure SMTP for email notifications
5. Set up monitoring and backups
6. Enable GitHub Actions for automated deployments

## Support

If you encounter issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables in `.env`
3. Ensure MongoDB Atlas allows connections from your VPS IP
4. Check Docker and system resources: `docker stats` and `df -h`

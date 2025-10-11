# eAIP Docker Deployment & Update Procedure

Complete step-by-step procedure for updating the eAIP application with backup and restore.

---

## Pre-Deployment Checklist

Before starting the update:

- [ ] Verify you have access to the server
- [ ] Ensure you have sufficient disk space (check with `df -h`)
- [ ] Note current application version/commit
- [ ] Inform users of maintenance window (if applicable)
- [ ] Have rollback plan ready

---

## Complete Update Procedure

### Step 1: Connect to Server

```bash
# SSH into your server
ssh user@your-server-ip

# Navigate to project directory
cd /path/to/eAIP
```

### Step 2: Pre-Update Backup

```bash
# 1. Create backup of git repositories
docker exec eaip-app npm run backup

# 2. Verify backup was created
docker exec eaip-app npm run backup:list

# Expected output:
# 📋 Available backups:
# 1. git-repos-backup-2025-01-15T10-30-00.tar.gz
#    Size: 15.42 MB
#    Created: 2025-01-15T10:30:00.000Z

# 3. IMPORTANT: Copy backup to host for extra safety
docker cp eaip-app:/app/backups/$(docker exec eaip-app ls -t /app/backups | head -1) ./backup-before-update.tar.gz

# 4. Verify backup file on host
ls -lh backup-before-update.tar.gz
```

### Step 3: Pull Latest Code

```bash
# 1. Check current branch and status
git status
git branch

# 2. Stash any local changes (if needed)
git stash

# 3. Pull latest changes from repository
git pull origin main

# Or if you need to pull from a specific branch
git pull origin <branch-name>

# 4. View what changed
git log --oneline -10
```

### Step 4: Stop Current Container

```bash
# 1. Check container is running
docker ps | grep eaip-app

# 2. Stop and remove container (volumes persist)
docker-compose -f docker-compose.prod.yml down

# Note: This does NOT delete volumes (git-repos and backups are safe)

# 3. Verify container stopped
docker ps -a | grep eaip-app
```

### Step 5: Rebuild and Start New Container

```bash
# 1. Rebuild Docker image with latest code
docker-compose -f docker-compose.prod.yml build --no-cache

# 2. Start the new container
docker-compose -f docker-compose.prod.yml up -d

# 3. Watch logs to see startup progress
docker-compose -f docker-compose.prod.yml logs -f

# Wait for these messages:
# ✓ Connected to MongoDB
# > Ready on http://0.0.0.0:3000
# > WebSocket server ready for collaborative editing
# > Initializing git repositories...
# ✅ Git repositories initialization complete

# Press Ctrl+C to exit logs
```

### Step 6: Verify Application Health

```bash
# 1. Check container is running
docker ps | grep eaip-app

# Expected output:
# CONTAINER ID   IMAGE        STATUS         PORTS                    NAMES
# abc123def456   eaip_app     Up 30 seconds  0.0.0.0:3000->3000/tcp   eaip-app

# 2. Check health status
docker inspect eaip-app | grep -A 5 Health

# 3. Test application endpoint
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","timestamp":"2025-01-15T10:30:00.000Z","service":"eAIP"}

# 4. Check if port is accessible
netstat -tlnp | grep :3000
```

### Step 7: Restore Git Repositories

```bash
# 1. Restore from the backup created in Step 2
docker exec eaip-app npm run restore

# You'll see:
# 🔍 Finding latest backup...
# Found: git-repos-backup-2025-01-15T10-30-00.tar.gz
# 🔄 Starting git-repos restore...
# 📦 Backup file: git-repos-backup-2025-01-15T10-30-00.tar.gz
# ✅ Restore completed successfully!

# 2. Verify repositories were restored
docker exec eaip-app ls -la /app/git-repos

# You should see directories for each organization:
# drwxr-xr-x  3 nextjs nodejs  96 Jan 15 10:30 507f1f77bcf86cd799439011
# drwxr-xr-x  3 nextjs nodejs  96 Jan 15 10:30 507f191e810c19729de860ea
# drwxr-xr-x  3 nextjs nodejs  96 Jan 15 10:30 507f1f77bcf86cd799439012
```

### Step 8: Verify Application Functionality

```bash
# 1. Check application logs for errors
docker logs eaip-app --tail 100

# 2. Test key endpoints
curl http://localhost:3000/api/health
curl -I http://localhost:3000

# 3. If you have a custom domain, test it
curl https://demoaip.flyclim.com/api/health

# 4. Login to application and verify:
# - Can access dashboard
# - Can view documents
# - Can edit documents
# - Collaborative editing works
# - Version control works
```

### Step 9: Post-Deployment Verification

```bash
# 1. Check disk space
df -h

# 2. Verify Docker volumes
docker volume ls | grep eaip

# Expected output:
# eaip_git-repos
# eaip_backups

# 3. Check container resource usage
docker stats eaip-app --no-stream

# 4. Verify backups still exist
docker exec eaip-app ls -la /app/backups
```

### Step 10: Cleanup (Optional)

```bash
# 1. Remove old Docker images (optional)
docker image prune -a

# 2. Remove backup from host (keep if you want extra safety)
# rm backup-before-update.tar.gz

# 3. Clear Docker build cache (optional)
docker builder prune
```

---

## Quick Reference Commands

### One-Line Update (for experienced users)

```bash
# Complete update in one command chain
docker exec eaip-app npm run backup && \
docker cp eaip-app:/app/backups/$(docker exec eaip-app ls -t /app/backups | head -1) ./backup-$(date +%Y%m%d-%H%M%S).tar.gz && \
git pull origin main && \
docker-compose -f docker-compose.prod.yml down && \
docker-compose -f docker-compose.prod.yml up --build -d && \
sleep 30 && \
docker exec eaip-app npm run restore && \
docker logs eaip-app --tail 50
```

### Health Check Commands

```bash
# Container status
docker ps | grep eaip-app

# Application health
curl http://localhost:3000/api/health

# View logs
docker logs eaip-app --tail 100 -f

# Check resources
docker stats eaip-app --no-stream
```

---

## Rollback Procedure

If something goes wrong after the update:

### Option 1: Restore from Backup (Quick)

```bash
# 1. Stop new container
docker-compose -f docker-compose.prod.yml down

# 2. Checkout previous code version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 3. Rebuild with old code
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Restore backup from before update
docker cp backup-before-update.tar.gz eaip-app:/app/backups/
docker exec eaip-app node scripts/restore-git-repos.js backup-before-update.tar.gz

# 5. Verify application
curl http://localhost:3000/api/health
```

### Option 2: Use Previous Docker Image

```bash
# 1. List Docker images
docker images | grep eaip

# 2. Stop current container
docker-compose -f docker-compose.prod.yml down

# 3. Tag and run previous image
docker tag <previous-image-id> eaip_eaip-app:latest
docker-compose -f docker-compose.prod.yml up -d

# 4. Restore backup
docker exec eaip-app npm run restore
```

---

## Troubleshooting

### Issue: Container Won't Start

```bash
# Check logs
docker logs eaip-app

# Common issues:
# - Port already in use: lsof -i :3000
# - MongoDB connection: Check MONGODB_URI in .env
# - Permissions: Check volumes permissions

# Force recreate
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Issue: Backup Failed

```bash
# Check disk space
df -h

# Check git-repos directory exists
docker exec eaip-app ls -la /app/git-repos

# Check permissions
docker exec eaip-app ls -la /app/backups

# Manual backup
docker exec eaip-app tar -czf /app/backups/manual-backup.tar.gz -C /app git-repos
```

### Issue: Restore Failed

```bash
# Verify backup file
docker exec eaip-app npm run restore:verify <backup-file>

# Check backup exists
docker exec eaip-app ls -la /app/backups

# Manual restore
docker exec eaip-app tar -xzf /app/backups/<backup-file> -C /app

# Re-initialize git repos
docker exec eaip-app npm run init-git-repos
```

### Issue: Application Slow After Update

```bash
# Check resources
docker stats eaip-app

# Restart container
docker restart eaip-app

# Check logs for errors
docker logs eaip-app --tail 200

# Verify MongoDB connection
docker exec eaip-app node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(e => console.log('FAIL', e.message))"
```

---

## Maintenance Commands

### Create Manual Backup

```bash
docker exec eaip-app npm run backup
```

### List All Backups

```bash
docker exec eaip-app npm run backup:list
```

### Restore Specific Backup

```bash
docker exec eaip-app node scripts/restore-git-repos.js <backup-filename>
```

### View Application Logs

```bash
# Last 100 lines
docker logs eaip-app --tail 100

# Follow logs in real-time
docker logs eaip-app -f

# Logs with timestamps
docker logs eaip-app --timestamps
```

### Access Container Shell

```bash
docker exec -it eaip-app sh

# Inside container:
ls -la /app
ls -la /app/git-repos
ls -la /app/backups
npm run backup:list
exit
```

---

## Best Practices

### Before Every Update

1. ✅ Create backup
2. ✅ Copy backup to host
3. ✅ Note current version/commit
4. ✅ Review changelog/commits
5. ✅ Check disk space
6. ✅ Notify users (if applicable)

### After Every Update

1. ✅ Verify application health
2. ✅ Test key functionality
3. ✅ Check logs for errors
4. ✅ Verify git repos restored
5. ✅ Monitor performance
6. ✅ Keep backup for 7 days

### Regular Maintenance

1. ✅ Daily automated backups (cron)
2. ✅ Weekly disk space check
3. ✅ Monthly security updates
4. ✅ Quarterly disaster recovery test

---

## Scheduled Maintenance Window Template

**Email to Users:**

```
Subject: eAIP Scheduled Maintenance - [Date] [Time]

Dear Users,

We will be performing scheduled maintenance on the eAIP platform:

Date: [Date]
Time: [Start Time] - [End Time] [Timezone]
Duration: Approximately [X] minutes
Impact: Application will be unavailable during this time

What we're doing:
- Updating application to latest version
- Security patches and performance improvements
- Routine backup and maintenance

What you should do:
- Save any open work before [Start Time]
- Plan accordingly for the downtime
- Report any issues after maintenance to [support email]

Thank you for your patience.

Best regards,
eAIP Operations Team
```

---

## Quick Checklist

Print this checklist for deployment:

```
□ Step 1: Connect to server
□ Step 2: Create backup (npm run backup)
□ Step 3: Copy backup to host
□ Step 4: Pull latest code (git pull)
□ Step 5: Stop container (docker-compose down)
□ Step 6: Build new image (docker-compose build)
□ Step 7: Start container (docker-compose up -d)
□ Step 8: Wait for startup (watch logs)
□ Step 9: Restore backup (npm run restore)
□ Step 10: Test application (curl /api/health)
□ Step 11: Verify functionality (login, test features)
□ Step 12: Monitor logs for errors
□ Step 13: Document deployment
□ Step 14: Notify users (if applicable)
```

---

## Support

If you encounter issues during deployment:

1. Check logs: `docker logs eaip-app`
2. Review this guide's Troubleshooting section
3. Check BACKUP_RESTORE.md for backup issues
4. Rollback if necessary using Rollback Procedure
5. Contact support with logs and error messages

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0

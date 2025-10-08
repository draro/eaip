# Git Repositories Backup & Restore Guide

Complete guide for backing up and restoring git repositories in the eAIP platform.

## Overview

The eAIP platform uses git repositories to track document versions for each organization. This guide explains how to:
- Create backups before deployments
- Restore backups after rebuilding containers
- Manage backup files
- Handle disaster recovery

---

## Quick Start

### Create a Backup

```bash
# Using npm script
npm run backup

# Or directly with Docker
docker exec eaip-app npm run backup
```

### Restore Latest Backup

```bash
# Before building new container
npm run restore

# Or with Docker
docker exec eaip-app npm run restore
```

---

## Backup Operations

### 1. Create Backup

Creates a timestamped `.tar.gz` archive of all git repositories.

```bash
# Local
npm run backup

# Docker
docker exec eaip-app npm run backup

# Manual
node scripts/backup-git-repos.js
```

**Output:**
```
🔄 Starting git-repos backup...

📦 Creating backup: git-repos-backup-2025-01-15T10-30-00.tar.gz
✅ Backup created successfully!
   File: /app/backups/git-repos-backup-2025-01-15T10-30-00.tar.gz
   Size: 15.42 MB
   Organizations: 3
     - 507f1f77bcf86cd799439011
     - 507f191e810c19729de860ea
     - 507f1f77bcf86cd799439012
```

### 2. List All Backups

```bash
# List all available backups
npm run backup:list

# Docker
docker exec eaip-app npm run backup:list
```

**Output:**
```
📋 Available backups:

1. git-repos-backup-2025-01-15T10-30-00.tar.gz
   Size: 15.42 MB
   Created: 2025-01-15T10:30:00.000Z

2. git-repos-backup-2025-01-14T09-15-00.tar.gz
   Size: 14.89 MB
   Created: 2025-01-14T09:15:00.000Z
```

### 3. Backup Retention

- Automatically keeps the **last 10 backups**
- Older backups are automatically deleted
- Sorted by creation date (newest first)

---

## Restore Operations

### 1. Restore Latest Backup

Automatically finds and restores the most recent backup.

```bash
# Local
npm run restore

# Docker
docker exec eaip-app npm run restore

# Manual
node scripts/restore-git-repos.js latest
```

**Safety Features:**
- Creates a safety backup of existing repos before restore
- 5-second confirmation delay (can be skipped with `SKIP_CONFIRMATION=true`)
- Lists all organizations being restored

### 2. Restore Specific Backup

```bash
# Restore specific backup file
node scripts/restore-git-repos.js git-repos-backup-2025-01-15T10-30-00.tar.gz

# Docker
docker exec eaip-app node scripts/restore-git-repos.js git-repos-backup-2025-01-15T10-30-00.tar.gz
```

### 3. Verify Backup

Check backup integrity before restoring.

```bash
# Verify backup file
npm run restore:verify git-repos-backup-2025-01-15T10-30-00.tar.gz

# Docker
docker exec eaip-app npm run restore:verify git-repos-backup-2025-01-15T10-30-00.tar.gz
```

**Output:**
```
🔍 Verifying backup...

✅ Backup is valid
   Total files: 1247
   Organizations: 3
     - 507f1f77bcf86cd799439011
     - 507f191e810c19729de860ea
     - 507f1f77bcf86cd799439012
```

---

## Docker Workflows

### Scenario 1: Rebuild Container with Same Data

```bash
# 1. Create backup before stopping container
docker exec eaip-app npm run backup

# 2. Copy backup to host (optional, for safety)
docker cp eaip-app:/app/backups ./backups

# 3. Stop and remove container
docker-compose -f docker-compose.prod.yml down

# 4. Rebuild and start new container
docker-compose -f docker-compose.prod.yml up --build -d

# 5. Wait for container to be ready
docker-compose -f docker-compose.prod.yml logs -f

# 6. Restore backup
docker exec eaip-app npm run restore
```

### Scenario 2: New Deployment on Different Server

```bash
# On OLD server:
# 1. Create backup
docker exec eaip-app npm run backup

# 2. Copy backup to host
docker cp eaip-app:/app/backups/git-repos-backup-2025-01-15T10-30-00.tar.gz ./

# 3. Transfer file to NEW server
scp git-repos-backup-2025-01-15T10-30-00.tar.gz user@new-server:/path/

# On NEW server:
# 1. Start container
docker-compose -f docker-compose.prod.yml up -d

# 2. Copy backup into container
docker cp git-repos-backup-2025-01-15T10-30-00.tar.gz eaip-app:/app/backups/

# 3. Restore backup
docker exec eaip-app npm run restore
```

### Scenario 3: Using Docker Volumes

The recommended approach is to use Docker volumes for backups:

```bash
# backups are automatically persisted in Docker volume
# No need to manually copy files

# After rebuilding container:
docker-compose -f docker-compose.prod.yml up --build -d
docker exec eaip-app npm run restore
```

---

## Volume Management

### Docker Volumes

The platform uses two persistent volumes:

```yaml
volumes:
  git-repos:   # Git repositories
  backups:     # Backup archives
```

### Inspect Volumes

```bash
# List volumes
docker volume ls

# Inspect git-repos volume
docker volume inspect eaip_git-repos

# Inspect backups volume
docker volume inspect eaip_backups
```

### Backup Volumes to Host

```bash
# Backup git-repos volume
docker run --rm -v eaip_git-repos:/data -v $(pwd):/backup \
  alpine tar czf /backup/git-repos-volume-backup.tar.gz -C /data .

# Backup backups volume
docker run --rm -v eaip_backups:/data -v $(pwd):/backup \
  alpine tar czf /backup/backups-volume-backup.tar.gz -C /data .
```

### Restore Volumes from Host

```bash
# Restore git-repos volume
docker run --rm -v eaip_git-repos:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/git-repos-volume-backup.tar.gz"

# Restore backups volume
docker run --rm -v eaip_backups:/data -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/backups-volume-backup.tar.gz"
```

---

## Automated Backups

### Using Cron (Local/VM)

```bash
# Add to crontab
crontab -e

# Backup every day at 2 AM
0 2 * * * cd /path/to/eaip && npm run backup >> /var/log/eaip-backup.log 2>&1

# Docker version
0 2 * * * docker exec eaip-app npm run backup >> /var/log/eaip-backup.log 2>&1
```

### Using systemd Timer

Create `/etc/systemd/system/eaip-backup.service`:

```ini
[Unit]
Description=eAIP Git Repos Backup

[Service]
Type=oneshot
ExecStart=docker exec eaip-app npm run backup
```

Create `/etc/systemd/system/eaip-backup.timer`:

```ini
[Unit]
Description=Daily eAIP backup

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl enable eaip-backup.timer
sudo systemctl start eaip-backup.timer
sudo systemctl status eaip-backup.timer
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Backup Before Deploy

on:
  workflow_dispatch:

jobs:
  backup-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Create Backup
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} \
            "docker exec eaip-app npm run backup"

      - name: Copy Backup to Artifacts
        run: |
          ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} \
            "docker cp eaip-app:/app/backups/$(docker exec eaip-app ls -t /app/backups | head -1) ./backup.tar.gz"
          scp ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }}:~/backup.tar.gz .

      - name: Upload Backup Artifact
        uses: actions/upload-artifact@v3
        with:
          name: git-repos-backup
          path: backup.tar.gz
          retention-days: 30

      - name: Deploy New Version
        run: |
          # Your deployment commands here
```

---

## Troubleshooting

### Backup Failed

```bash
# Check disk space
df -h

# Check permissions
docker exec eaip-app ls -la /app/git-repos
docker exec eaip-app ls -la /app/backups

# Check logs
docker logs eaip-app
```

### Restore Failed

```bash
# Verify backup file
docker exec eaip-app npm run restore:verify <backup-file>

# Check if backup exists
docker exec eaip-app ls -la /app/backups

# Manual restore with verbose output
docker exec eaip-app sh -c "tar -xzvf /app/backups/<backup-file> -C /app"
```

### Missing Backups After Rebuild

**Problem:** Backups disappeared after container rebuild.

**Solution:** Use Docker volumes (already configured) or mount local directory:

```yaml
# docker-compose.prod.yml
volumes:
  - ./backups:/app/backups  # Mount local directory
```

---

## Best Practices

### 1. Backup Schedule
- ✅ Before every deployment
- ✅ Daily automated backups
- ✅ Before major updates
- ✅ Before data migrations

### 2. Backup Storage
- ✅ Keep backups in Docker volume for quick restore
- ✅ Copy critical backups to external storage (S3, NAS, etc.)
- ✅ Test restore process regularly
- ✅ Maintain at least 30 days of backups

### 3. Disaster Recovery
- ✅ Document restore procedures
- ✅ Store credentials securely
- ✅ Test full recovery on staging environment
- ✅ Keep backups in multiple locations

### 4. Security
- ✅ Encrypt backups for off-site storage
- ✅ Restrict access to backup files
- ✅ Verify backup integrity regularly
- ✅ Secure backup transfer channels

---

## FAQ

**Q: How long does a backup take?**
A: Typically 1-5 seconds for small repos, up to 30 seconds for large repos with extensive history.

**Q: How much disk space do backups use?**
A: Approximately the same size as git-repos directory. Compression reduces size by ~60-70%.

**Q: Can I schedule backups automatically?**
A: Yes, use cron, systemd timers, or your CI/CD pipeline. See "Automated Backups" section.

**Q: What happens if I restore over existing repos?**
A: A safety backup is created first, then existing repos are replaced.

**Q: Can I restore to a different server?**
A: Yes, copy the backup file to the new server and run restore. See "Scenario 2" above.

**Q: Are backups created automatically?**
A: No, you must create them manually or set up automation.

---

## Support

For issues or questions:
1. Check logs: `docker logs eaip-app`
2. Verify volumes: `docker volume ls`
3. Check disk space: `df -h`
4. Review scripts: `/app/scripts/`

# eAIP Scripts

Utility scripts for the eAIP platform.

## init-git-repos.js

Initializes git repositories for all active organizations in the system.

### Purpose
- Creates `git-repos/{organizationId}` directories for each active organization
- Initializes git repositories for version control
- Runs automatically on production server startup
- Can be run manually when needed

### Usage

**Automatic (Production):**
The script runs automatically when the server starts in production mode (NODE_ENV=production).

**Manual:**
```bash
npm run init-git-repos
```

Or directly:
```bash
node scripts/init-git-repos.js
```

### Requirements
- MongoDB connection (uses MONGODB_URI environment variable)
- Git installed in the environment
- Write permissions to `git-repos/` directory

### What it does
1. Connects to MongoDB
2. Finds all active organizations
3. For each organization:
   - Creates `git-repos/{orgId}` directory if it doesn't exist
   - Initializes a git repository
   - Configures git user (eAIP System)
   - Creates an initial commit with README

### Error Handling
- If a repository already exists, it skips initialization
- Logs errors but continues processing other organizations
- In production startup, warnings are logged but the server continues to run

### Docker/Kubernetes
In containerized deployments:
- The script runs on container startup
- `git-repos/` should be mounted as a persistent volume
- Ensures git repositories are available even after container restarts

---

## backup-git-repos.js

Creates compressed backup archives of all git repositories.

### Purpose
- Backup all organization git repositories
- Create timestamped archives for version tracking
- Maintain backup history (keeps last 10)
- Enable disaster recovery

### Usage

```bash
# Create backup
npm run backup

# List all backups
npm run backup:list

# Docker
docker exec eaip-app npm run backup
```

### Features
- Creates `.tar.gz` archives in `backups/` directory
- Automatic timestamping: `git-repos-backup-2025-01-15T10-30-00.tar.gz`
- Shows backup size and organization count
- Automatically cleans up old backups (keeps 10 most recent)

### Output Example
```
🔄 Starting git-repos backup...
📦 Creating backup: git-repos-backup-2025-01-15T10-30-00.tar.gz
✅ Backup created successfully!
   File: /app/backups/git-repos-backup-2025-01-15T10-30-00.tar.gz
   Size: 15.42 MB
   Organizations: 3
```

---

## restore-git-repos.js

Restores git repositories from backup archives.

### Purpose
- Restore git repositories after container rebuild
- Recover from data loss or corruption
- Migrate data between servers
- Test disaster recovery procedures

### Usage

```bash
# Restore latest backup
npm run restore

# Restore specific backup
node scripts/restore-git-repos.js git-repos-backup-2025-01-15T10-30-00.tar.gz

# Verify backup integrity
npm run restore:verify <backup-file>

# Docker
docker exec eaip-app npm run restore
```

### Safety Features
- Creates safety backup before restore
- 5-second confirmation delay
- Verifies backup file exists
- Lists all organizations being restored

### Commands
- `latest` - Restore most recent backup (default)
- `verify <file>` - Check backup integrity
- `<backup-file>` - Restore specific backup

---

## Complete Backup & Restore Workflow

See [BACKUP_RESTORE.md](../BACKUP_RESTORE.md) for comprehensive guide including:
- Docker workflows
- Automated backups
- CI/CD integration
- Disaster recovery procedures
- Volume management
- Best practices

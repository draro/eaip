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

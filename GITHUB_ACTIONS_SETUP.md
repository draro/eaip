# GitHub Actions Setup Guide

This guide explains how to set up automated deployment using GitHub Actions.

## Overview

Two workflows are configured:

1. **CI Workflow** (`ci.yml`) - Runs on pull requests and non-main branches
   - Type checking
   - Linting
   - Build verification

2. **Deploy Workflow** (`deploy.yml`) - Runs on push to main branch
   - Pulls latest code on VPS
   - Rebuilds Docker image
   - Restarts containers
   - Verifies deployment

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

On your VPS:

```bash
# Generate a new SSH key pair specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions@eaip" -f ~/.ssh/github-actions -N ""

# Add the public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Display the private key (you'll need this for GitHub)
cat ~/.ssh/github-actions
```

Copy the entire private key output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `72.60.213.232` | Your VPS IP address |
| `VPS_USERNAME` | `root` | SSH username (usually `root`) |
| `VPS_SSH_KEY` | *paste private key* | The private key from Step 1 |
| `VPS_PORT` | `22` | SSH port (default is 22) |

**Adding a secret:**
- Name: Enter the secret name (e.g., `VPS_HOST`)
- Secret: Enter the value
- Click **Add secret**

### Step 3: Prepare VPS

Make sure your VPS has the repository cloned:

```bash
# SSH to VPS
ssh root@72.60.213.232

# Create apps directory and clone repository
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/yourusername/eAIP.git
cd eAIP

# Create .env file
cp .env.production.example .env
nano .env
# Configure all required variables

# Do initial deployment
bash deploy-to-vps.sh
```

### Step 4: Configure Git on VPS

Ensure git is properly configured on your VPS:

```bash
# On VPS
cd ~/apps/eAIP

# Set git to allow pulls without merge conflicts
git config pull.rebase false

# Verify git remote
git remote -v
```

### Step 5: Test GitHub Actions

1. Make a small change to your code
2. Commit and push to a feature branch:
   ```bash
   git checkout -b test-deployment
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin test-deployment
   ```
3. Check the **Actions** tab in GitHub - CI workflow should run
4. Create a pull request and merge to main
5. Check the **Actions** tab again - Deploy workflow should run

### Step 6: Monitor Deployment

1. Go to GitHub repository → **Actions** tab
2. Click on the running workflow
3. Click on the "Deploy eAIP to VPS" job
4. Expand "Deploy to VPS via SSH" to see live logs

## Workflow Behavior

### CI Workflow (ci.yml)
- **Triggers**: Pull requests, pushes to non-main branches
- **Actions**:
  - Installs dependencies
  - Runs type checking
  - Runs linting
  - Builds the application
- **Purpose**: Catch errors before merging to main

### Deploy Workflow (deploy.yml)
- **Triggers**: Push to main branch, manual trigger
- **Actions**:
  - Connects to VPS via SSH
  - Pulls latest code
  - Rebuilds Docker image
  - Restarts containers
  - Verifies deployment
- **Duration**: ~5-10 minutes

## Manual Deployment Trigger

You can manually trigger a deployment without pushing code:

1. Go to **Actions** tab in GitHub
2. Click **Deploy to VPS** workflow
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

## Troubleshooting

### SSH Connection Failed

**Error**: `Permission denied (publickey)`

**Solution**:
```bash
# On VPS, verify authorized_keys
cat ~/.ssh/authorized_keys

# Ensure permissions are correct
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify the public key is present
grep "github-actions" ~/.ssh/authorized_keys
```

### Git Pull Fails

**Error**: `error: Your local changes to the following files would be overwritten by merge`

**Solution**:
```bash
# On VPS
cd ~/apps/eAIP

# Stash local changes
git stash

# Or hard reset (WARNING: loses local changes)
git reset --hard origin/main
```

### Docker Build Fails

**Error**: Build or deployment steps fail

**Solutions**:
1. Check logs in GitHub Actions
2. SSH to VPS and check Docker logs:
   ```bash
   cd ~/apps/eAIP
   docker-compose -f docker-compose.prod.yml logs eaip-app
   ```
3. Verify .env file exists and has correct values
4. Check disk space: `df -h`

### Container Won't Start

**Error**: Container exits immediately after starting

**Solution**:
```bash
# On VPS, check logs
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml logs --tail=100 eaip-app

# Common issues:
# 1. MongoDB connection - check MONGODB_URI
# 2. Missing environment variables - verify .env file
# 3. Port already in use - check: netstat -tlnp | grep 3000
```

## Security Best Practices

✅ **DO:**
- Use a dedicated SSH key for GitHub Actions
- Store all secrets in GitHub Secrets (never in code)
- Regularly rotate SSH keys
- Monitor deployment logs for suspicious activity
- Use branch protection rules to prevent direct pushes to main

❌ **DON'T:**
- Commit .env files to the repository
- Share SSH private keys
- Use the same SSH key for multiple purposes
- Disable SSH key authentication

## Deployment Flow

```
Local Machine                 GitHub                       VPS
     |                           |                          |
     |--[git push]-------------->|                          |
     |                           |                          |
     |                      [CI Tests]                      |
     |                           |                          |
     |                    [Merge to main]                   |
     |                           |                          |
     |                     [Deploy Action]                  |
     |                           |                          |
     |                           |--[SSH Connection]------->|
     |                           |                          |
     |                           |         [git pull]       |
     |                           |         [docker build]   |
     |                           |         [docker up -d]   |
     |                           |                          |
     |                           |<--[Deployment Status]----|
     |<--[Notification]----------|                          |
```

## Advanced Configuration

### Add Slack/Discord Notifications

Add to end of `deploy.yml`:

```yaml
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to VPS ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy to Multiple Environments

Create separate workflow files:
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

Use different secrets for each environment:
- `STAGING_VPS_HOST`, `STAGING_VPS_SSH_KEY`
- `PRODUCTION_VPS_HOST`, `PRODUCTION_VPS_SSH_KEY`

### Run Tests Before Deploy

Add to `deploy.yml` before deploy step:

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

### Rollback on Failure

Add to `deploy.yml`:

```yaml
      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd ~/apps/eAIP
            git reset --hard HEAD~1
            docker-compose -f docker-compose.prod.yml up -d --build
```

## Useful Commands

### View Workflow Runs
```bash
# Install GitHub CLI
brew install gh

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch a running workflow
gh run watch
```

### Test SSH Connection
```bash
# From your local machine
ssh -i path/to/github-actions root@72.60.213.232
```

### Monitor Deployment
```bash
# SSH to VPS
ssh root@72.60.213.232

# Watch logs in real-time
cd ~/apps/eAIP
docker-compose -f docker-compose.prod.yml logs -f eaip-app
```

## Deployment Checklist

Before enabling GitHub Actions:

- [ ] SSH key generated and added to VPS authorized_keys
- [ ] All GitHub secrets configured correctly
- [ ] Repository cloned on VPS in correct location
- [ ] .env file created and configured on VPS
- [ ] Initial manual deployment successful
- [ ] Docker and docker-compose installed on VPS
- [ ] Port 3000 accessible (or Nginx configured)
- [ ] Git configured on VPS
- [ ] Branch protection rules set (optional)

## Need Help?

Common resources:
- GitHub Actions documentation: https://docs.github.com/en/actions
- SSH Action docs: https://github.com/appleboy/ssh-action
- Docker Compose: https://docs.docker.com/compose/

Check the Actions tab in GitHub for detailed logs and error messages.

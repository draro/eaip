# Git Integration Setup Guide

## Quick Start

The eAIP system now includes built-in Git version control for tracking all document changes. Each organization gets its own private Git repository.

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env.local
```

Add Git configuration:
```bash
# Required
GIT_STORAGE_PATH=./git-repos

# Optional (for remote backup)
GIT_REMOTE_URL=git@github.com:your-org/eaip-repos.git
```

### 2. Create Storage Directory

```bash
mkdir -p git-repos
chmod 755 git-repos
```

### 3. Verify Git Installation

```bash
git --version
# Should show: git version 2.x.x or higher
```

### 4. Test the Integration

Create a test organization through the UI or API:
```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Aviation Authority",
    "domain": "test.aero",
    "country": "IT",
    "contact": {
      "email": "admin@test.aero",
      "phone": "+39 123 456 7890",
      "address": "Via Test, Rome, Italy"
    },
    "settings": {
      "publicUrl": "https://test.aero",
      "airacStartDate": "2024-01-01"
    }
  }'
```

Check that the Git repository was created:
```bash
ls -la git-repos/
# Should show a directory with the organization ID
```

### 5. Verify Repository Structure

```bash
cd git-repos/{org-id}
git log
# Should show: "Initial repository setup"
```

## Features Overview

### Automatic Versioning
- ✅ Every document save creates a Git commit
- ✅ Full author attribution (user name + email)
- ✅ Descriptive commit messages with document details
- ✅ Separate metadata tracking

### Change Visualization
- ✅ Visual diff viewer with highlighted changes
- ✅ Word-level change detection
- ✅ Compare any two versions
- ✅ Timeline view of all changes

### History & Recovery
- ✅ Complete commit history
- ✅ Restore any previous version
- ✅ Branch support for workflows
- ✅ Tag support for releases

## Usage

### View Document History

Navigate to any document and click the "History" tab to see:
- All commits for that document
- Who made changes and when
- Commit messages
- Quick compare buttons

### Compare Versions

1. Click "Compare" next to any commit
2. See highlighted differences
3. View additions (green) and deletions (red)
4. Examine detailed JSON changes

### Restore Previous Version

```bash
# Via API
POST /api/documents/{id}/restore
{
  "commitHash": "abc123def456"
}
```

Or use the UI restore button in the history view.

## Advanced Configuration

### Remote Git Server

To backup repositories to a remote Git server:

1. Set up SSH authentication:
```bash
ssh-keygen -t ed25519 -C "eaip-git-backup"
# Add public key to your Git server (GitHub/GitLab/etc.)
```

2. Configure in `.env.local`:
```bash
GIT_REMOTE_URL=git@github.com:your-org/eaip-backup.git
GIT_REMOTE_KEY_PATH=/path/to/id_ed25519
```

3. Push will happen automatically after each commit

### Branch Workflows

Create feature branches for draft documents:

```bash
# Via API
POST /api/git/branch
{
  "orgId": "...",
  "branchName": "draft-2024-Q2",
  "fromBranch": "main"
}
```

Merge when approved:
```bash
POST /api/git/merge
{
  "orgId": "...",
  "sourceBranch": "draft-2024-Q2",
  "targetBranch": "main"
}
```

### Tagging Releases

Tag published AIRAC cycles:

```bash
POST /api/git/tag
{
  "orgId": "...",
  "tagName": "AIRAC-2024-13",
  "message": "AIRAC Cycle 2024-13 - Effective 2024-10-15"
}
```

## Troubleshooting

### Repository Not Created

**Problem**: Organization created but no Git repo

**Solution**:
```bash
# Check logs
tail -f logs/application.log | grep -i git

# Verify Git is installed
which git

# Check permissions
ls -ld git-repos
# Should be: drwxr-xr-x

# Manually initialize (if needed)
# This will be a future API endpoint
```

### Commit Failures

**Problem**: Document saves but Git commit fails

**Causes**:
1. Disk space full
2. Git not configured
3. Permission issues

**Solutions**:
```bash
# Check disk space
df -h

# Check Git configuration
cd git-repos/{org-id}
git config user.name
git config user.email

# Fix permissions
chmod -R 755 git-repos/{org-id}
```

### History Not Showing

**Problem**: No commits appear in history

**Debug Steps**:
```bash
# Check if commits exist
cd git-repos/{org-id}
git log documents/{doc-id}.json

# Verify API response
curl http://localhost:3000/api/documents/{doc-id}/history
```

### Diff Not Working

**Problem**: Diff shows "no changes" when there are changes

**Check**:
1. Verify commit hashes are correct
2. Ensure documents exist at both commits
3. Check API logs for errors

## Performance Tips

### Large Repositories

If repository gets large (>1GB):

```bash
# Garbage collect
cd git-repos/{org-id}
git gc --aggressive --prune=now

# Archive old history (keep last 100 commits)
git checkout --orphan temp-branch
git commit -m "Archived history"
git branch -D main
git branch -m main
```

### Many Organizations

For systems with 100+ organizations:

1. Use separate disk/volume for `git-repos`
2. Configure SSD for better performance
3. Set up periodic cleanup cron job
4. Consider remote storage for cold data

## Security

### File Permissions

```bash
# Owner: Application user
# Group: Application group
# Others: No access
chmod 750 git-repos
chmod -R 750 git-repos/*
```

### Sensitive Data

Never commit:
- API keys
- Passwords
- SSH private keys
- Personal data

These are automatically excluded by the Git service.

### Access Control

- Each organization has isolated repository
- No cross-organization access
- File system enforced isolation
- Admin users can access all org repos

## Backup & Recovery

### Backup Strategy

1. **Local Backup** (daily):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf backups/git-repos-$DATE.tar.gz git-repos/
find backups/ -name "git-repos-*.tar.gz" -mtime +30 -delete
```

2. **Remote Backup** (continuous):
- Automatic push to remote Git server
- Configured via `GIT_REMOTE_URL`
- Happens after each commit

3. **MongoDB Backup** (hourly):
- Documents stored in MongoDB
- Git is secondary version control
- Both should be backed up

### Recovery

**From Local Backup**:
```bash
tar -xzf backups/git-repos-20241005.tar.gz
```

**From Remote**:
```bash
cd git-repos
git clone git@github.com:org/eaip-backup.git {org-id}
```

**From MongoDB**:
Documents can be restored even without Git history.

## Monitoring

### Health Checks

```bash
# Check all repositories
for repo in git-repos/*; do
  cd $repo
  git fsck --full
  cd -
done
```

### Metrics to Track

1. **Repository Size**: Alert if >5GB
2. **Commit Rate**: Monitor for anomalies
3. **Failed Commits**: Should be <1%
4. **API Response Time**: Diff should be <500ms

### Alerting

Set up alerts for:
- Disk space <10%
- Failed commits >10/hour
- Repository corruption
- Backup failures

## Migration

### From Existing System

If migrating from another system:

1. Export existing documents to JSON
2. Create organizations via API
3. Import documents (will auto-commit)
4. Verify history is intact

### To New System

1. Clone all Git repositories
2. Export MongoDB
3. Transfer to new server
4. Update paths in `.env.local`
5. Restart application

## Development

### Testing Git Integration

```bash
# Run integration tests
npm run test:git

# Test single organization
npm run test:git -- --org-id=123456

# Test diff generation
npm run test:diff
```

### Adding New Features

When adding Git features:

1. Update `gitService.ts`
2. Add API endpoint
3. Update UI components
4. Add tests
5. Update documentation

## Support

### Common Issues

1. **"Git not found"**: Install Git
2. **"Permission denied"**: Fix file permissions
3. **"Repository not initialized"**: Check organization creation
4. **"Commit failed"**: Check disk space and Git config

### Getting Help

- Check `GIT_INTEGRATION.md` for detailed docs
- Review application logs
- Check Git repository directly
- Contact system administrator

### Useful Commands

```bash
# List all repositories
ls -1 git-repos/

# Check repository status
cd git-repos/{org-id} && git status

# View commit history
cd git-repos/{org-id} && git log --oneline

# Show specific file history
cd git-repos/{org-id} && git log documents/{doc-id}.json

# View file at specific commit
cd git-repos/{org-id} && git show abc123:documents/{doc-id}.json

# Compare two commits
cd git-repos/{org-id} && git diff abc123 def456

# List all branches
cd git-repos/{org-id} && git branch -a

# List all tags
cd git-repos/{org-id} && git tag
```

## Future Enhancements

Planned features:
- [ ] Automatic remote push
- [ ] Pull request workflow
- [ ] Code review integration
- [ ] Conflict resolution UI
- [ ] Advanced merge strategies
- [ ] Git LFS for large files
- [ ] Multi-remote support
- [ ] Automated cleanup
- [ ] Archive old versions
- [ ] Compression optimization

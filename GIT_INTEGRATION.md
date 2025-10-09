# Git Integration for eAIP System

## Overview
This document describes the Git-based version control integration for the eAIP (electronic Aeronautical Information Publication) system. Every organization gets a private Git repository that tracks all AIP document changes with full history.

## Architecture

### Storage Structure
```
git-repos/
└── {organization-id}/
    ├── .git/
    ├── README.md
    ├── documents/
    │   └── {document-id}.json
    └── metadata/
        └── {document-id}.meta.json
```

### Key Components

1. **GitService** (`/src/lib/gitService.ts`)
   - Repository initialization
   - Document commit tracking
   - Diff generation
   - History retrieval
   - Branch and tag management

2. **API Endpoints**
   - `POST /api/organizations` - Creates org + initializes Git repo
   - `PUT /api/documents/[id]` - Saves document + commits to Git
   - `GET /api/documents/[id]/history` - Retrieves commit history
   - `GET /api/documents/[id]/diff` - Shows differences between versions

3. **UI Components**
   - `DocumentHistory` - Shows commit timeline
   - `DocumentDiff` - Visual diff viewer with highlighting

## Features

### 1. Automatic Repository Creation
When a new organization is created:
- Git repository is automatically initialized
- Configured with organization details
- Initial README is committed
- Repository path: `git-repos/{org-id}`

### 2. Document Versioning
Every document save:
- Commits document JSON to Git
- Stores metadata separately
- Includes author information
- Generates descriptive commit messages

### 3. Change Tracking
- Full diff support between any two versions
- Word-level change highlighting
- Addition/deletion/modification tracking
- JSON structure-aware diffing

### 4. History Visualization
- Complete commit timeline
- Author and timestamp tracking
- Commit message display
- One-click comparison between versions

### 5. Branch & Tag Support
- Create branches for drafts/reviews
- Merge branches on approval
- Tag published versions (AIRAC cycles)
- Branch-based workflow support

## Edge Cases Handled

### Organization Creation
1. **Repository Already Exists**
   - Checks for existing repo before creation
   - Returns existing repo path if found
   - No error, continues normally

2. **Git Initialization Failure**
   - Logs error but doesn't fail organization creation
   - Allows retry via separate endpoint
   - Organization still functional without Git

3. **File System Permissions**
   - Creates directories with proper permissions
   - Handles permission errors gracefully
   - Provides clear error messages

### Document Commits

1. **No Changes to Commit**
   - Checks git status before committing
   - Returns success with "No changes" message
   - Doesn't create empty commits

2. **Git Commit Failure**
   - Document save still succeeds in MongoDB
   - Error logged for debugging
   - User notified of Git sync issue
   - Can retry commit separately

3. **Large Documents**
   - JSON files handle large content
   - No size limits on commits
   - Git efficiently stores deltas

4. **Concurrent Commits**
   - Each organization has isolated repo
   - No conflicts between orgs
   - Sequential commits within org

5. **Missing User Information**
   - Falls back to system user
   - Uses default email if missing
   - Commit still succeeds

### Diff & History

1. **No Previous Version**
   - Returns appropriate message
   - Doesn't error
   - Diff shows only additions

2. **Corrupted Commits**
   - Try/catch around Git operations
   - Returns partial history if available
   - Logs corruption for admin review

3. **Binary Files**
   - Handles if images added later
   - Shows "binary file changed" message
   - Doesn't attempt text diff

4. **Deleted Documents**
   - History preserved in Git
   - Can restore from any commit
   - Shows deletion in timeline

### Restore Operations

1. **Invalid Commit Hash**
   - Validates hash format
   - Returns error if not found
   - Suggests recent commits

2. **Partial Document Restore**
   - Can restore specific versions
   - Maintains referential integrity
   - Updates MongoDB after restore

3. **Cross-Version Compatibility**
   - Handles schema changes
   - Migrates old versions if needed
   - Validates before restore

### Branch Operations

1. **Branch Already Exists**
   - Checks before creation
   - Returns existing branch
   - Or creates with suffix

2. **Merge Conflicts**
   - Uses `--no-ff` for clean history
   - Auto-merge when possible
   - Manual resolution if needed

3. **Orphaned Branches**
   - Lists all branches
   - Allows cleanup
   - Warns before deletion

### Tag Operations

1. **Duplicate Tags**
   - Checks before creating
   - Returns error if exists
   - Suggests alternate name

2. **Invalid Tag Names**
   - Validates format
   - Sanitizes input
   - Uses AIRAC cycle format

### System Failures

1. **Git Not Installed**
   - Graceful degradation
   - Works without Git (MongoDB only)
   - Admin warning displayed

2. **Disk Space Issues**
   - Checks available space
   - Prevents commits if low
   - Alerts administrators

3. **Network Failures** (for remote Git)
   - Local commits always work
   - Queue for remote sync
   - Retry mechanism

4. **Repository Corruption**
   - Attempts auto-repair
   - Can reinitialize if needed
   - Preserves documents in MongoDB

## Performance Optimizations

1. **Git Instance Caching**
   - Reuses Git instances per org
   - Reduces initialization overhead
   - Memory-efficient

2. **Lazy Loading**
   - History loaded on demand
   - Pagination for large histories
   - Limit commits retrieved

3. **Async Operations**
   - Git commits don't block saves
   - Background processing
   - Non-blocking diffs

## Security Considerations

1. **Access Control**
   - Each org has isolated repo
   - No cross-org access
   - File system permissions

2. **Sensitive Data**
   - API keys not committed
   - User passwords excluded
   - PII handled separately

3. **Audit Trail**
   - All changes tracked
   - Author attribution
   - Timestamp verification

## Configuration

### Environment Variables
```bash
# Git storage location
GIT_STORAGE_PATH=/path/to/git-repos

# Optional: Remote Git server
GIT_REMOTE_URL=git@github.com:org/repos.git
GIT_REMOTE_USER=git
GIT_REMOTE_KEY=/path/to/ssh/key
```

### MongoDB Collections
- Organizations: Stores org metadata
- AIPDocuments: Stores current document state
- Git repos: Stores complete version history

## API Usage Examples

### Get Document History
```bash
GET /api/documents/{id}/history
```

Response:
```json
{
  "success": true,
  "data": {
    "documentId": "...",
    "documentTitle": "Italy AIP",
    "history": [
      {
        "hash": "a1b2c3d",
        "date": "2024-10-05T10:30:00Z",
        "message": "Update document: Italy AIP",
        "author": "John Doe",
        "email": "john@example.com"
      }
    ]
  }
}
```

### Get Document Diff
```bash
GET /api/documents/{id}/diff?from=a1b2c3d&to=e4f5g6h
```

Response:
```json
{
  "success": true,
  "data": {
    "documentId": "...",
    "diff": {
      "additions": 42,
      "deletions": 15,
      "changes": [
        {
          "type": "modified",
          "path": "documents/123.json",
          "oldContent": "...",
          "newContent": "..."
        }
      ]
    }
  }
}
```

### Compare with Previous
```bash
GET /api/documents/{id}/diff?comparePrevious=true
```

## UI Integration

### Show History in Document View
```tsx
import DocumentHistory from '@/components/DocumentHistory';

<DocumentHistory documentId={documentId} />
```

### Show Diff Modal
```tsx
import DocumentDiff from '@/components/DocumentDiff';

<DocumentDiff
  documentId={documentId}
  fromCommit="abc123"
  toCommit="def456"
  onClose={() => setShowDiff(false)}
/>
```

## Future Enhancements

1. **Remote Git Integration**
   - Push to GitHub/GitLab/Bitbucket
   - Pull request workflows
   - Code review integration

2. **Advanced Diff**
   - Side-by-side view
   - Inline annotations
   - Comment on changes

3. **Branching Workflow**
   - Draft branches
   - Review branches
   - Approval workflow

4. **Automated Testing**
   - Pre-commit hooks
   - Validation checks
   - Compliance testing

5. **Export/Import**
   - Export repo as archive
   - Import from other systems
   - Migration tools

## Troubleshooting

### Repository Not Initialized
```bash
# Check logs
tail -f logs/git-service.log

# Manually initialize
POST /api/organizations/{id}/init-git
```

### Commit Failed
```bash
# Check document exists
GET /api/documents/{id}

# Retry commit
POST /api/documents/{id}/git-commit
```

### Diff Not Showing
```bash
# Verify commits exist
GET /api/documents/{id}/history

# Check commit hashes
git log --oneline
```

## Maintenance

### Cleanup Old Versions
```bash
# Archive old commits (keep last 100)
git gc --prune=all

# Remove old branches
git branch -D old-branch
```

### Backup Repositories
```bash
# Clone all org repos
for org in git-repos/*; do
  git clone --mirror $org backups/$(basename $org)
done
```

### Monitor Disk Usage
```bash
# Check repo sizes
du -sh git-repos/*

# Alert if over threshold
df -h | grep git-repos
```

## Support

For issues or questions:
- Check logs in `/var/log/eaip/`
- Review Git service status
- Contact system administrator

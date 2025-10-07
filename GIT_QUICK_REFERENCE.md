# Git Integration - Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup
npm install
cp .env.example .env.local
mkdir -p git-repos

# 2. Add to .env.local
echo "GIT_STORAGE_PATH=./git-repos" >> .env.local

# 3. Start app
npm run dev

# 4. Create organization → Git repo auto-created!
# 5. Edit document → Auto-committed!
```

## 📚 API Endpoints

### Get History
```bash
GET /api/documents/{id}/history

Response:
{
  "success": true,
  "data": {
    "history": [
      {
        "hash": "abc123",
        "date": "2024-10-05T10:30:00Z",
        "message": "Update document",
        "author": "John Doe"
      }
    ]
  }
}
```

### Get Diff
```bash
# Compare two commits
GET /api/documents/{id}/diff?from=abc123&to=def456

# Compare with previous
GET /api/documents/{id}/diff?comparePrevious=true

Response:
{
  "success": true,
  "data": {
    "diff": {
      "additions": 10,
      "deletions": 5,
      "changes": [...]
    }
  }
}
```

## 🎨 UI Components

### Show History
```tsx
import DocumentHistory from '@/components/DocumentHistory';

<DocumentHistory documentId={documentId} />
```

### Show Diff
```tsx
import DocumentDiff from '@/components/DocumentDiff';

<DocumentDiff
  documentId={documentId}
  fromCommit="abc123"
  toCommit="def456"
  onClose={() => setShowDiff(false)}
}
/>
```

## 💻 GitService API

```typescript
import { gitService } from '@/lib/gitService';

// Initialize repo (automatic on org creation)
await gitService.initializeOrgRepository(orgId, orgName, orgSlug);

// Commit document (automatic on save)
await gitService.commitDocument(orgId, document, userId, userName, userEmail);

// Get history
const history = await gitService.getDocumentHistory(orgId, documentId, 50);

// Get diff
const diff = await gitService.getDiff(orgId, fromCommit, toCommit);

// Compare with previous
const diff = await gitService.compareWithPrevious(orgId, documentId);

// Restore version
const result = await gitService.restoreDocument(orgId, documentId, commitHash);

// Branch operations
await gitService.createBranch(orgId, 'feature-branch', 'main');
await gitService.mergeBranch(orgId, 'feature-branch', 'main', userName, userEmail);

// Tag operations
await gitService.tagVersion(orgId, 'v1.0.0', 'Release 1.0.0');
const tags = await gitService.getTags(orgId);
```

## 🗂️ File Structure

```
git-repos/
└── {org-id}/
    ├── .git/                    # Git internals
    ├── README.md                # Org info
    ├── documents/
    │   └── {doc-id}.json       # Document content
    └── metadata/
        └── {doc-id}.meta.json  # Document metadata
```

## 🔍 Troubleshooting

### Check Git Status
```bash
cd git-repos/{org-id}
git status
git log --oneline
```

### View Document History
```bash
cd git-repos/{org-id}
git log documents/{doc-id}.json
```

### Show File at Commit
```bash
cd git-repos/{org-id}
git show abc123:documents/{doc-id}.json
```

### Compare Commits
```bash
cd git-repos/{org-id}
git diff abc123 def456
```

## ⚙️ Environment Variables

```bash
# Required
GIT_STORAGE_PATH=./git-repos

# Optional
GIT_REMOTE_URL=git@github.com:org/repos.git
GIT_REMOTE_USER=git
GIT_REMOTE_KEY_PATH=/path/to/key
```

## 🚨 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No history showing | Git not initialized | Check `git-repos/{org-id}` exists |
| Commit failed | Disk full | Check `df -h` |
| Permission denied | Wrong permissions | Run `chmod 755 git-repos` |
| Diff not working | Invalid commit hash | Verify with `git log` |

## 📦 Dependencies

```json
{
  "simple-git": "Latest",
  "isomorphic-git": "^1.25.0",
  "diff": "^5.1.0",
  "@types/diff": "^5.0.9"
}
```

## 🎯 Key Features

- ✅ Automatic repo creation
- ✅ Auto-commit on save
- ✅ Full history tracking
- ✅ Visual diff viewer
- ✅ Author attribution
- ✅ Branch & tag support
- ✅ Restore functionality
- ✅ Edge case handling

## 📖 Full Documentation

- **GIT_INTEGRATION.md** - Complete technical docs
- **docs/GIT_SETUP.md** - Setup guide
- **GIT_IMPLEMENTATION_SUMMARY.md** - Implementation details

## 🎉 That's It!

Create an organization → Edit a document → See the history!

Everything is automatic. Zero configuration per document. 🚀

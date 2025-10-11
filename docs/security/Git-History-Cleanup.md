# Git History Cleanup - Removing Credentials from Repository History

## Overview

This document provides step-by-step instructions for removing `.env` files and other sensitive files from your git repository history using BFG Repo-Cleaner.

**Security Finding Reference:** C-001 (CRITICAL - CVSS 9.8)

## ⚠️ IMPORTANT WARNINGS

1. **This operation rewrites git history** - All commit SHAs will change
2. **All team members must re-clone** the repository after this operation
3. **Create a backup** before proceeding
4. **Rotate all credentials** that were exposed in the removed files
5. **Coordinate with your team** - this affects everyone

## Prerequisites

- [ ] Repository backup created
- [ ] Team notified of upcoming history rewrite
- [ ] BFG Repo-Cleaner installed
- [ ] Credential rotation plan prepared

## Installation

### macOS
```bash
brew install bfg
```

### Linux
```bash
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar ~/bfg-1.14.0.jar'
```

### Verify Installation
```bash
bfg --version
```

## Step-by-Step Cleanup Procedure

### Step 1: Create a Fresh Clone

Create a fresh bare clone of your repository in a separate location:

```bash
cd /tmp
git clone --mirror git@github.com:your-org/eAIP.git eaip-cleanup
cd eaip-cleanup
```

### Step 2: Run Automated Cleanup Script

```bash
cd /path/to/your/eaip
./scripts/cleanup-git-history.sh
```

Or follow manual steps below:

### Step 3: Remove .env Files (Manual Method)

```bash
# Remove all .env files from history
bfg --delete-files '.env*' --no-blob-protection .

# Alternative: Delete specific files
bfg --delete-files '.env' .
bfg --delete-files '.env.local' .
bfg --delete-files '.env.production' .
```

### Step 4: Clean Up Repository

```bash
# Expire reflog
git reflog expire --expire=now --all

# Garbage collect
git gc --prune=now --aggressive
```

### Step 5: Review Changes

```bash
# Check that .env files are gone
git log --all --oneline --grep=".env"

# Verify no .env files in any commit
git rev-list --all | xargs git grep -l "MONGODB_URI" || echo "All clear!"
```

### Step 6: Push Changes

```bash
# Push to remote (force required due to history rewrite)
git push --force --all

# Push tags
git push --force --tags
```

### Step 7: Team Coordination

Send this message to all team members:

```
⚠️ URGENT: Repository History Rewritten

The eAIP repository history has been rewritten to remove sensitive credentials.

ACTION REQUIRED:
1. Commit and push any local changes BEFORE proceeding
2. Delete your local repository clone
3. Re-clone from remote: git clone git@github.com:your-org/eAIP.git
4. Do NOT attempt to merge or pull - you must re-clone

If you have already pulled after this change and see merge conflicts,
contact the team immediately. Do NOT attempt to resolve them yourself.
```

## Credential Rotation Checklist

After removing credentials from history, you MUST rotate all exposed credentials:

### MongoDB
- [ ] Log into MongoDB Atlas
- [ ] Navigate to Database Access → Users
- [ ] Edit user password
- [ ] Generate new strong password
- [ ] Update `.env` file (not committed to git)
- [ ] Restart application

### Anthropic API Key
- [ ] Log into Anthropic Console
- [ ] Navigate to API Keys
- [ ] Revoke old key
- [ ] Create new key
- [ ] Update `.env` file
- [ ] Test API connection

### NextAuth Secret
```bash
# Generate new secret
openssl rand -base64 32
```
- [ ] Update `NEXTAUTH_SECRET` in `.env`
- [ ] Note: This will invalidate all existing sessions

### Google Cloud Storage
- [ ] Log into Google Cloud Console
- [ ] Navigate to IAM & Admin → Service Accounts
- [ ] Delete old service account key
- [ ] Create new key
- [ ] Download JSON
- [ ] Update `GCS_CREDENTIALS_JSON` in `.env`
- [ ] Test file uploads

### Encryption Keys
```bash
# Generate new encryption key
openssl rand -hex 32
```
- [ ] Update `ENCRYPTION_KEY` in `.env`
- [ ] Note: Existing encrypted data will need migration

### Digital Signature Keys
```bash
# Generate new RSA key pair
openssl genrsa -out private.pem 4096
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

# Get single-line format for .env
cat private.pem | tr '\n' '|'
cat public.pem | tr '\n' '|'
```
- [ ] Update `SIGNATURE_PRIVATE_KEY` in `.env`
- [ ] Update `SIGNATURE_PUBLIC_KEY` in `.env`
- [ ] Note: Existing signatures will need re-signing

## Verification

After rotation, verify the application works correctly:

```bash
# Check database connection
npm run test:db

# Check API authentication
curl http://localhost:3000/api/health

# Check GCS connection
npm run test:gcs
```

## Prevention

To prevent future credential commits:

1. **Install git-secrets:**
```bash
./scripts/setup-git-secrets.sh
```

2. **Use .env.example only:**
   - Never commit actual `.env` files
   - Only commit `.env.example` with placeholder values

3. **Add CI/CD secret scanning:**
   - GitHub: Enable GitHub Advanced Security
   - GitLab: Enable Secret Detection
   - Alternative: GitGuardian, TruffleHog

4. **Regular audits:**
```bash
# Scan for potential secrets in current codebase
git grep -E "(password|secret|api[_-]?key)" -- ':!.env.example' ':!docs/'
```

## Troubleshooting

### Error: "BFG not found"
Install BFG Repo-Cleaner (see Installation section above)

### Error: "Protected commits"
Add `--no-blob-protection` flag to BFG command

### Error: "Remote rejected"
Ensure you have force push permissions:
```bash
git push --force-with-lease
```

### Team Member: "Merge conflicts after re-cloning"
They pulled instead of re-cloning. They must:
1. Delete local repository
2. Fresh clone from remote
3. Do NOT attempt to merge

## Cost of Not Fixing

**Risk Level:** CRITICAL (CVSS 9.8)

**Potential Impact:**
- Complete database compromise: $500K+
- Customer data breach: $150K+ (GDPR fines)
- Service disruption: $100K+
- Reputation damage: $100K+
- **Total Annual Risk:** $850K

## References

- [BFG Repo-Cleaner Documentation](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-secrets](https://github.com/awslabs/git-secrets)
- Security Audit Report: Finding C-001

## Support

If you encounter issues during this process:
1. Stop immediately
2. Do NOT push any changes
3. Contact the security team
4. Restore from backup if needed

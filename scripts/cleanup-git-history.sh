#!/bin/bash
# Clean .env files from git history using BFG Repo-Cleaner
# WARNING: This rewrites git history. Only run on a backup/clone of your repository!

set -e

echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  Only run this on a fresh clone of your repository."
echo "⚠️  All team members will need to re-clone after this operation."
echo ""
read -p "Have you created a backup and informed your team? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. Please create a backup first."
    exit 1
fi

echo ""
echo "🧹 Starting git history cleanup..."

# Check if BFG is installed
if ! command -v bfg &> /dev/null; then
    echo "❌ BFG Repo-Cleaner is not installed."
    echo ""
    echo "Install BFG:"
    echo "  macOS: brew install bfg"
    echo "  Linux: Download from https://rtyley.github.io/bfg-repo-cleaner/"
    echo ""
    exit 1
fi

echo "✓ BFG Repo-Cleaner is installed"

# Create patterns file for files to remove
echo "📝 Creating patterns file..."
cat > /tmp/bfg-patterns.txt << 'EOF'
.env
.env.local
.env.development
.env.production
.env.test
.env.staging
EOF

echo "✓ Patterns file created"

# Run BFG to remove files
echo "🔥 Removing .env files from history..."
echo "   This may take several minutes depending on repository size..."
bfg --delete-files .env* --no-blob-protection .

# Clean up repository
echo "🧹 Cleaning up repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes: git log --all --oneline"
echo "2. Force push to remote: git push --force --all"
echo "3. Force push tags: git push --force --tags"
echo "4. Notify all team members to re-clone the repository"
echo "5. Rotate ALL credentials that were in the removed .env files"
echo ""
echo "⚠️  CRITICAL: You MUST rotate all exposed credentials!"
echo "   See docs/security/Credential-Rotation-Checklist.md"
echo ""

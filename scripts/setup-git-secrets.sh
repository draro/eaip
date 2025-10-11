#!/bin/bash
# Setup git-secrets pre-commit hooks for credential protection
# This script installs and configures git-secrets to prevent accidental credential commits

set -e

echo "🔐 Setting up git-secrets for credential protection..."

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo "❌ git-secrets is not installed."
    echo ""
    echo "Please install git-secrets first:"
    echo ""
    echo "macOS:"
    echo "  brew install git-secrets"
    echo ""
    echo "Linux:"
    echo "  git clone https://github.com/awslabs/git-secrets.git"
    echo "  cd git-secrets"
    echo "  sudo make install"
    echo ""
    exit 1
fi

echo "✓ git-secrets is installed"

# Install git-secrets hooks in the repository
echo "📦 Installing git-secrets hooks..."
git secrets --install --force

# Register AWS patterns (catches AWS keys, tokens)
echo "🔍 Registering AWS credential patterns..."
git secrets --register-aws

# Add custom patterns for common credential types
echo "🔍 Adding custom credential patterns..."

# MongoDB connection strings
git secrets --add 'mongodb(\+srv)?:\/\/[^\s]+'

# Generic API keys and tokens
git secrets --add '(?i)(api[_-]?key|apikey|api[_-]?token)["\'\s:=]+[a-zA-Z0-9_\-]{20,}'

# Private keys
git secrets --add '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'

# Generic secrets in env format
git secrets --add '(?i)(secret|password|passwd|pwd)["\'\s:=]+[^\s]{8,}'

# JWT tokens
git secrets --add 'ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}'

# Google Cloud credentials
git secrets --add '(?i)(google|gcp)[_-]?(api[_-]?key|key|secret)["\'\s:=]+[a-zA-Z0-9_\-]{20,}'

# Generic tokens
git secrets --add '(?i)token["\'\s:=]+[a-zA-Z0-9_\-]{20,}'

# Email/password combinations (often test credentials)
git secrets --add '(?i)(email|username)["\'\s:=]+[^\s]+@[^\s]+.*password["\'\s:=]+[^\s]+'

echo "✓ Credential patterns registered"

# Create .env.example file if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example template..."
    cat > .env.example << 'EOF'
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eaip
DATABASE_URL=mongodb://localhost:27017/eaip

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# Claude API
ANTHROPIC_API_KEY=your-anthropic-api-key

# Google Cloud Storage
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS_JSON={"your":"credentials","json":"here"}

# Encryption Keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Digital Signature Keys (generate with: openssl genrsa 4096)
SIGNATURE_PRIVATE_KEY=your-private-key-pem
SIGNATURE_PUBLIC_KEY=your-public-key-pem

# Session Configuration
SESSION_MAX_AGE=28800
EOF
    echo "✓ .env.example created"
fi

echo ""
echo "✅ git-secrets setup complete!"
echo ""
echo "🔒 Your repository is now protected against accidental credential commits."
echo ""
echo "⚠️  IMPORTANT: This only protects NEW commits. See docs/security/Git-History-Cleanup.md"
echo "    for instructions on cleaning existing .env files from git history."
echo ""
echo "Test the protection:"
echo "  echo 'MONGODB_URI=mongodb://user:password@host' > test.txt"
echo "  git add test.txt"
echo "  git commit -m 'test'"
echo "  # Should be blocked!"
echo ""

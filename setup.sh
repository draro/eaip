#!/bin/bash

echo "🚀 Setting up eAIP Editor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create uploads directory
echo "📁 Creating upload directories..."
mkdir -p public/uploads
mkdir -p public/exports

echo "✅ Upload directories created"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
MONGODB_URI=mongodb://localhost:27017/eaip
NEXTAUTH_SECRET=your-secret-key-here-$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/eaip
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=eaip-uploads
EOF
    echo "✅ .env.local created with default values"
    echo "⚠️  Please update MongoDB URI and other settings in .env.local"
else
    echo "✅ .env.local already exists"
fi

# Check if MongoDB is running (optional)
if command -v mongosh &> /dev/null; then
    echo "🔍 Checking MongoDB connection..."
    if mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
        echo "✅ MongoDB is running and accessible"
    else
        echo "⚠️  MongoDB is not running or not accessible"
        echo "   Please start MongoDB or update MONGODB_URI in .env.local"
    fi
else
    echo "ℹ️  MongoDB CLI not found. Please ensure MongoDB is running."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure MongoDB is running (local or cloud)"
echo "2. Update .env.local with your MongoDB URI"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "📚 Documentation: See README.md for detailed instructions"
echo "🔗 n8n Examples: See n8n-examples.json for workflow integrations"
echo ""
echo "🚀 Ready to create your first eAIP document!"
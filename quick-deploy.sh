#!/bin/bash

# Quick Deploy Script for eAIP Application
# This script helps deploy the application to VPS

set -e

echo "=========================================="
echo "eAIP Quick Deployment Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="72.60.213.232"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/root/apps/eAIP}"

echo -e "${YELLOW}Configuration:${NC}"
echo "VPS IP: $VPS_IP"
echo "VPS User: $VPS_USER"
echo "VPS Path: $VPS_PATH"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo "Please create .env file with your configuration."
    exit 1
fi
print_status ".env file found"

# Check if build exists
if [ ! -d ".next" ]; then
    print_warning ".next directory not found. Running build..."
    npm run build
    if [ $? -eq 0 ]; then
        print_status "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
else
    print_status ".next build directory exists"
fi

# Ask for deployment method
echo ""
echo "Choose deployment method:"
echo "1) Copy files to VPS (rsync)"
echo "2) Deploy via Git (if repo is set up)"
echo "3) Cancel"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        print_warning "This will sync files to $VPS_USER@$VPS_IP:$VPS_PATH"
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Cancelled"
            exit 0
        fi

        echo ""
        print_status "Starting rsync..."

        rsync -avz --progress \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude '.next/cache' \
            --exclude 'git-repos' \
            ./ "$VPS_USER@$VPS_IP:$VPS_PATH/"

        if [ $? -eq 0 ]; then
            print_status "Files synced successfully"
        else
            print_error "Rsync failed"
            exit 1
        fi

        echo ""
        print_status "Connecting to VPS to start application..."

        ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
cd /root/apps/eAIP

echo "========================================"
echo "Building Docker image..."
echo "========================================"
docker-compose -f docker-compose.prod.yml build

if [ $? -ne 0 ]; then
    echo "Error: Docker build failed"
    exit 1
fi

echo ""
echo "========================================"
echo "Starting application..."
echo "========================================"
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "Waiting for application to start..."
sleep 10

echo ""
echo "========================================"
echo "Container Status"
echo "========================================"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================"
echo "Health Check"
echo "========================================"
curl -s http://localhost:3000/api/health | python3 -m json.tool || echo "Health check endpoint not responding yet"

echo ""
echo "========================================"
echo "Application Test"
echo "========================================"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "✓ Application is responding"
else
    echo "⚠ Application may not be ready yet (Status: $HTTP_STATUS)"
fi

echo ""
echo "========================================"
echo "Recent Logs"
echo "========================================"
docker-compose -f docker-compose.prod.yml logs --tail=30

echo ""
echo "========================================"
echo "Resource Usage"
echo "========================================"
docker stats --no-stream eaip-app
ENDSSH

        if [ $? -eq 0 ]; then
            print_status "Deployment completed successfully!"
            echo ""
            echo "Application is running at:"
            echo "  http://$VPS_IP:3000"
            echo ""
            echo "To view logs:"
            echo "  ssh $VPS_USER@$VPS_IP"
            echo "  cd $VPS_PATH"
            echo "  docker-compose -f docker-compose.prod.yml logs -f"
        else
            print_error "Deployment failed"
            exit 1
        fi
        ;;

    2)
        echo ""
        print_status "Git deployment selected"
        print_warning "Make sure your changes are committed and pushed to the repository"

        read -p "Git repository URL: " git_repo
        if [ -z "$git_repo" ]; then
            print_error "Repository URL is required"
            exit 1
        fi

        ssh "$VPS_USER@$VPS_IP" << EOF
if [ -d "$VPS_PATH" ]; then
    cd $VPS_PATH
    git pull origin main
else
    git clone $git_repo $VPS_PATH
    cd $VPS_PATH
fi

echo "Building and starting application..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo "Checking status..."
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=20
EOF

        if [ $? -eq 0 ]; then
            print_status "Git deployment completed successfully!"
        else
            print_error "Git deployment failed"
            exit 1
        fi
        ;;

    3)
        echo "Cancelled"
        exit 0
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
print_status "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test the application: http://$VPS_IP:3000"
echo "2. Set up domain and SSL: sudo bash setup-nginx.sh (on VPS)"
echo "3. Configure SMTP for emails"
echo "4. Create your first super admin user"
echo ""

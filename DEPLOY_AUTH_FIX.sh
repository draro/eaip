#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  eAIP Authentication Fix - Deployment"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "This script will:"
echo "  1. Deploy the domain tenancy fix"
echo "  2. Rebuild the Docker container"
echo "  3. Restart the application"
echo "  4. Verify the fix is working"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "Step 1: Deploying to VPS..."
echo "──────────────────────────────────────────────────────────"

ssh root@72.60.213.232 << 'ENDSSH'
cd /eaip

echo "Pulling latest code..."
git pull origin main

echo ""
echo "Step 2: Rebuilding Docker container..."
echo "──────────────────────────────────────────────────────────"
docker-compose -f docker-compose.prod.yml build

echo ""
echo "Step 3: Restarting application..."
echo "──────────────────────────────────────────────────────────"
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "Waiting for application to start..."
sleep 5

echo ""
echo "Step 4: Verifying deployment..."
echo "──────────────────────────────────────────────────────────"

# Check if container is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Container is running"
else
    echo "❌ Container is not running"
    docker-compose ps
    exit 1
fi

# Check logs for auth fix
echo ""
echo "Checking for domain validation logs..."
docker-compose logs eaip-app --tail=20 | grep -i "domain validation" || echo "(No recent auth attempts)"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "  1. Try logging in at: https://eaip.flyclim.com/auth/signin"
echo "  2. Email: raro.davide@gmail.com"
echo "  3. Password: eAIP2025"
echo ""
echo "To view logs:"
echo "  docker-compose logs eaip-app --tail=100 -f"
echo ""
echo "To check auth attempts:"
echo "  docker-compose logs eaip-app | grep -E '(Domain validation|User found|Password valid)'"
echo ""
ENDSSH

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Deployment script completed!"
echo "════════════════════════════════════════════════════════════"

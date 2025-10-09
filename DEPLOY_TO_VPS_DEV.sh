#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "  Deploy Auth Fix to VPS (Dev Mode)"
echo "════════════════════════════════════════════════════════════"
echo ""

# First, commit changes locally
echo "Step 1: Committing changes locally..."
echo "──────────────────────────────────────────────────────────"
cd /Users/davideraro/eAIP

git add src/app/api/auth/\[...nextauth\]/route.ts
git commit -m "Fix: Skip domain validation for main app domain (eaip.flyclim.com)" || echo "Already committed"

echo ""
echo "Step 2: Pushing to repository..."
echo "──────────────────────────────────────────────────────────"
git push origin main

echo ""
echo "Step 3: Deploying to VPS..."
echo "──────────────────────────────────────────────────────────"

ssh root@72.60.213.232 << 'ENDSSH'
cd /eaip

echo "Pulling latest code..."
git pull origin main

echo ""
echo "Checking if dev server is running..."
if pgrep -f "next dev" > /dev/null; then
    echo "Dev server is running. Restarting..."
    pkill -f "next dev"
    sleep 2
fi

echo ""
echo "Code updated! You can now restart dev server with:"
echo "  cd /eaip && npm run dev"
echo ""
ENDSSH

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Code Deployed to VPS!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps (on VPS):"
echo "  1. SSH to VPS: ssh root@72.60.213.232"
echo "  2. Go to project: cd /eaip"
echo "  3. Start dev server: npm run dev"
echo "  4. Try login with:"
echo "     - Email: raro.davide@gmail.com"
echo "     - Password: eAIP2025"
echo ""
echo "You should now see in logs:"
echo "  'Domain validation: { ... isMainAppDomain: true ... }'"
echo "  'Skipping domain validation - logging in to main app domain'"
echo ""

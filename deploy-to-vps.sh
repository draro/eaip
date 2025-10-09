#!/usr/bin/env bash

# eAIP VPS Deployment Script
# This script should be run on your VPS (72.60.213.232)

set -e  # Exit on error

echo "=========================================="
echo "eAIP Docker Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Note: Some commands may require sudo privileges${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"

# Check Docker
if ! command_exists docker; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully${NC}"
    echo -e "${YELLOW}Please log out and log back in for group changes to take effect${NC}"
    exit 0
else
    echo -e "${GREEN}✓ Docker is installed${NC}"
    docker --version
fi

# Check Docker Compose
if ! command_exists docker-compose; then
    echo -e "${YELLOW}docker-compose not found, installing...${NC}"
    sudo apt update
    sudo apt install -y docker-compose
    echo -e "${GREEN}✓ docker-compose installed${NC}"
else
    echo -e "${GREEN}✓ docker-compose is installed${NC}"
    docker-compose --version
fi

echo ""
echo "Step 2: Checking .env file..."
echo "-----------------------------------"

if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file from .env.production.example"
    echo "cp .env.production.example .env"
    exit 1
else
    echo -e "${GREEN}✓ .env file found${NC}"

    # Check for required variables
    missing_vars=""

    for var in MONGODB_URI NEXTAUTH_URL NEXTAUTH_SECRET EAIP_TARGET_IP; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            missing_vars="$missing_vars $var"
        fi
    done

    if [ -n "$missing_vars" ]; then
        echo -e "${RED}Error: Missing or empty required variables:${NC}"
        echo "$missing_vars"
        exit 1
    fi

    echo -e "${GREEN}✓ All required environment variables are set${NC}"
fi

echo ""
echo "Step 3: Stopping existing containers..."
echo "-----------------------------------"

if docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
    echo "Stopping running containers..."
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✓ Containers stopped${NC}"
else
    echo "No running containers found"
fi

echo ""
echo "Step 4: Building Docker image..."
echo "-----------------------------------"
echo "This may take 5-10 minutes..."

docker-compose -f docker-compose.prod.yml build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker image built successfully${NC}"
else
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi

echo ""
echo "Step 5: Starting containers..."
echo "-----------------------------------"

docker-compose -f docker-compose.prod.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started successfully${NC}"
else
    echo -e "${RED}Error: Failed to start containers${NC}"
    exit 1
fi

echo ""
echo "Step 6: Waiting for application to start..."
echo "-----------------------------------"

sleep 5

# Check if container is running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Container is running${NC}"
else
    echo -e "${RED}Error: Container is not running${NC}"
    echo "Showing logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi

echo ""
echo "Step 7: Testing application..."
echo "-----------------------------------"

# Test if app responds
if curl -f -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}Warning: Application might not be ready yet${NC}"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs -f eaip-app"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Application Information:"
echo "  - Status: docker-compose -f docker-compose.prod.yml ps"
echo "  - Logs:   docker-compose -f docker-compose.prod.yml logs -f eaip-app"
echo "  - Stop:   docker-compose -f docker-compose.prod.yml down"
echo ""
echo "Access your application:"
echo "  - Local:  http://localhost:3000"
echo "  - Remote: http://72.60.213.232:3000"
echo "  - Domain: https://eaip.flyclim.com (after DNS setup)"
echo ""
echo "View logs now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    docker-compose -f docker-compose.prod.yml logs -f eaip-app
fi

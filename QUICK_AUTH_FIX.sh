#!/bin/bash

# Quick Authentication Fix Script
# This script helps diagnose and fix authentication issues

set -e

echo "============================================================"
echo "eAIP Authentication Quick Fix"
echo "============================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in container or on host
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    DOCKER_EXEC=""
else
    echo "Running on host - will use docker-compose exec"
    DOCKER_EXEC="docker-compose exec -T eaip-app"
fi

echo ""
echo "1. Checking MongoDB connection..."
echo "------------------------------------------------------------"

$DOCKER_EXEC node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function checkMongo() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not set in environment');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connection successful');
    console.log('   Database:', mongoose.connection.name);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

checkMongo();
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}MongoDB connection failed. Check:${NC}"
    echo "  1. MONGODB_URI in .env file"
    echo "  2. MongoDB Atlas network access (whitelist VPS IP)"
    echo "  3. MongoDB credentials"
    exit 1
fi

echo ""
echo "2. Listing users in database..."
echo "------------------------------------------------------------"

$DOCKER_EXEC node << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');

    const users = await User.find({}).select('email name role status organization').lean();

    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Status: ${user.status || 'N/A'}`);
        console.log(`      Org: ${user.organization || 'None'}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error listing users:', error.message);
    process.exit(1);
  }
}

listUsers();
EOF

echo ""
echo "3. Password Reset"
echo "------------------------------------------------------------"
echo ""

# Interactive password reset
read -p "Enter email address to reset password (or press Enter to skip): " EMAIL

if [ -z "$EMAIL" ]; then
    echo "Skipped password reset"
    echo ""
    echo "============================================================"
    echo "Diagnostic complete!"
    echo "============================================================"
    exit 0
fi

read -sp "Enter new password: " PASSWORD
echo ""
read -sp "Confirm new password: " PASSWORD2
echo ""

if [ "$PASSWORD" != "$PASSWORD2" ]; then
    echo "❌ Passwords don't match"
    exit 1
fi

echo ""
echo "Resetting password for $EMAIL..."

$DOCKER_EXEC node << EOF
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');

    const user = await User.findOne({ email: '$EMAIL'.toLowerCase() });

    if (!user) {
      console.log('❌ User not found: $EMAIL');
      await mongoose.connection.close();
      process.exit(1);
    }

    const hashedPassword = crypto
      .createHash('sha256')
      .update('$PASSWORD' + 'eAIP_salt_2025')
      .digest('hex');

    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: $EMAIL');
    console.log('  Password: $PASSWORD');

    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error resetting password:', error.message);
    process.exit(1);
  }
}

resetPassword();
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✅ All done! You can now log in with the new credentials."
    echo "============================================================"
    echo ""
    echo "Login at: https://eaip.flyclim.com/auth/signin"
    echo ""
else
    echo ""
    echo "============================================================"
    echo "❌ Password reset failed. Check the error messages above."
    echo "============================================================"
    exit 1
fi
EOF

chmod +x /Users/davideraro/eAIP/QUICK_AUTH_FIX.sh

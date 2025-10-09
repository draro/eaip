#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  eAIP Authentication Complete Fix"
echo "════════════════════════════════════════════════"
echo ""

cat << 'SCRIPT' | ssh root@72.60.213.232 "cd /eaip && docker-compose exec -T eaip-app node"
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function fixAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');

    // 1. Get user
    const user = await User.findOne({ email: 'raro.davide@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    // 2. Get org
    const org = await Organization.findById(user.organization);
    if (!org) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('Current Configuration:');
    console.log('─────────────────────────────────────');
    console.log('User email:', user.email);
    console.log('User org ID:', user.organization.toString());
    console.log('Org name:', org.name);
    console.log('Org domain:', org.domain);
    console.log('Org status:', org.status);
    console.log('');

    // 3. Fix organization domain
    let orgUpdated = false;
    if (org.domain !== 'eaip.flyclim.com') {
      console.log('📝 Fixing organization domain...');
      org.domain = 'eaip.flyclim.com';
      org.status = 'active';
      if (!org.settings) org.settings = {};
      org.settings.enablePublicAccess = true;
      await org.save();
      orgUpdated = true;
      console.log('✅ Organization domain updated to: eaip.flyclim.com');
    } else {
      console.log('✅ Organization domain is correct');
    }

    // 4. Fix password
    const testPassword = 'eAIP2025';
    const hashedPassword = crypto
      .createHash('sha256')
      .update(testPassword + 'eAIP_salt_2025')
      .digest('hex');

    let passwordUpdated = false;
    if (user.password !== hashedPassword) {
      console.log('📝 Fixing user password...');
      user.password = hashedPassword;
      user.isTemporaryPassword = false;
      user.mustChangePassword = false;
      user.failedLoginAttempts = 0;
      await user.save();
      passwordUpdated = true;
      console.log('✅ Password reset successfully');
    } else {
      console.log('✅ Password is already correct');
    }

    console.log('');
    console.log('════════════════════════════════════════════════');
    console.log('  ✅ AUTHENTICATION FIXED');
    console.log('════════════════════════════════════════════════');
    console.log('');
    console.log('Login Credentials:');
    console.log('  URL:      https://eaip.flyclim.com/auth/signin');
    console.log('  Email:    raro.davide@gmail.com');
    console.log('  Password: eAIP2025');
    console.log('');
    console.log('Changes Made:');
    if (orgUpdated) {
      console.log('  ✓ Organization domain → eaip.flyclim.com');
    }
    if (passwordUpdated) {
      console.log('  ✓ Password → eAIP2025');
    }
    if (!orgUpdated && !passwordUpdated) {
      console.log('  ℹ No changes needed - already configured correctly');
    }
    console.log('');
    console.log('You should now be able to log in!');
    console.log('════════════════════════════════════════════════');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixAuth();
SCRIPT

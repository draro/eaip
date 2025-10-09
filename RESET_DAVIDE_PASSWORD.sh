#!/bin/bash

# Quick password reset for davide's account
# Run this on VPS

cat << 'SCRIPT' | docker-compose exec -T eaip-app node
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');

    const email = 'raro.davide@gmail.com';
    const newPassword = 'eAIP2025!Admin';  // Your new password

    // SHA256 hash with salt (matching NextAuth)
    const hashedPassword = crypto
      .createHash('sha256')
      .update(newPassword + 'eAIP_salt_2025')
      .digest('hex');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('Current password hash:', user.password);
    console.log('New password hash:', hashedPassword);
    console.log('');

    user.password = hashedPassword;
    user.isTemporaryPassword = false;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    await user.save();

    console.log('✅ Password reset successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('  Email:    raro.davide@gmail.com');
    console.log('  Password: eAIP2025!Admin');
    console.log('');
    console.log('  URL: https://eaip.flyclim.com/auth/signin');
    console.log('');
    console.log('═══════════════════════════════════════════════');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
SCRIPT

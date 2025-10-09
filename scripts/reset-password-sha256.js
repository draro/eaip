/**
 * Password Reset Script (SHA256 Version)
 *
 * This script resets a user's password using the SHA256 hash function
 * that matches the NextAuth configuration.
 *
 * Usage: node scripts/reset-password-sha256.js <email> <new-password>
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import models
const User = require('../src/models/User');

// Hash function matching NextAuth configuration
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');
}

async function resetPassword(email, newPassword) {
  try {
    console.log('='.repeat(60));
    console.log('Password Reset Tool (SHA256)');
    console.log('='.repeat(60));
    console.log();

    // Check MongoDB URI
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGODB_URI not found in environment');
      console.error('Make sure .env file exists and contains MONGODB_URI');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log();

    // Find user
    console.log('Looking up user:', email);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('✗ User not found:', email);
      console.log('\nAvailable users:');
      const allUsers = await User.find({}).select('email name role').lean();
      if (allUsers.length === 0) {
        console.log('  (No users found in database)');
      } else {
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.name}) - ${u.role}`));
      }
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ User found');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Organization:', user.organization || 'None');
    console.log();

    // Hash new password using SHA256
    console.log('Hashing new password (SHA256 with salt)...');
    const hashedPassword = hashPassword(newPassword);
    console.log('✓ Password hashed');
    console.log('Hash (first 20 chars):', hashedPassword.substring(0, 20) + '...');
    console.log();

    // Update user
    console.log('Updating user password...');
    user.password = hashedPassword;
    await user.save();
    console.log('✓ Password updated successfully in database');
    console.log();

    // Verify the password works
    console.log('Verifying new password...');
    const testHash = hashPassword(newPassword);
    const isValid = testHash === user.password;
    if (isValid) {
      console.log('✓ Password verification successful');
    } else {
      console.log('✗ Password verification failed - something went wrong');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Password reset complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Login Credentials:');
    console.log('-'.repeat(60));
    console.log('Email:', user.email);
    console.log('Password:', newPassword);
    console.log();
    console.log('You can now log in at:');
    console.log('- https://eaip.flyclim.com/auth/signin');
    console.log('- http://localhost:3000/auth/signin (development)');
    console.log();

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error resetting password:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get arguments from command line
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Password Reset Tool (SHA256 Version)');
  console.log('='.repeat(60));
  console.log();
  console.log('Usage: node scripts/reset-password-sha256.js <email> <new-password>');
  console.log();
  console.log('Example:');
  console.log('  node scripts/reset-password-sha256.js user@example.com MyNewPassword123');
  console.log();
  console.log('Note: This script uses SHA256 hashing to match the NextAuth configuration.');
  console.log();
  process.exit(1);
}

resetPassword(email, newPassword);

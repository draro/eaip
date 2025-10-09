/**
 * Password Reset Script
 *
 * This script resets a user's password
 *
 * Usage: node scripts/reset-password.js <email> <new-password>
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../src/models/User');

async function resetPassword(email, newPassword) {
  try {
    console.log('='.repeat(60));
    console.log('Password Reset Tool');
    console.log('='.repeat(60));
    console.log();

    // Check MongoDB URI
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGODB_URI not found in environment');
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
      const allUsers = await User.find({}).select('email name').lean();
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ User found');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log();

    // Hash new password
    console.log('Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✓ Password hashed');
    console.log();

    // Update user
    console.log('Updating user password...');
    user.password = hashedPassword;
    await user.save();
    console.log('✓ Password updated successfully');
    console.log();

    // Verify the password works
    console.log('Verifying new password...');
    const isValid = await bcrypt.compare(newPassword, user.password);
    if (isValid) {
      console.log('✓ Password verification successful');
    } else {
      console.log('✗ Password verification failed - something went wrong');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Password reset complete!');
    console.log('='.repeat(60));
    console.log();
    console.log(`You can now log in with:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);
    console.log();

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error resetting password:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get arguments from command line
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.js <email> <new-password>');
  console.log('Example: node scripts/reset-password.js user@example.com MyNewPassword123');
  process.exit(1);
}

resetPassword(email, newPassword);

/**
 * Authentication Diagnostic Script
 *
 * This script checks:
 * 1. MongoDB connection
 * 2. User existence
 * 3. Password verification
 * 4. NextAuth configuration
 *
 * Usage: node scripts/diagnose-auth.js <email>
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../src/models/User');

async function diagnoseAuth(email) {
  try {
    console.log('='.repeat(60));
    console.log('Authentication Diagnostics');
    console.log('='.repeat(60));
    console.log();

    // 1. Check environment variables
    console.log('1. Environment Variables Check');
    console.log('-'.repeat(60));
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Set' : '✗ NOT SET');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '✗ NOT SET');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ NOT SET');
    console.log();

    // 2. Test MongoDB connection
    console.log('2. MongoDB Connection Test');
    console.log('-'.repeat(60));

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGODB_URI not found in environment');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log();

    // 3. Check user existence
    console.log('3. User Lookup');
    console.log('-'.repeat(60));

    if (!email) {
      console.log('Usage: node scripts/diagnose-auth.js <email>');
      console.log('\nListing all users instead:');
      const users = await User.find({}).select('email name role status createdAt').lean();
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}, Status: ${user.status}`);
      });
      await mongoose.connection.close();
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('✗ User not found:', email);
      console.log('\nAvailable users:');
      const allUsers = await User.find({}).select('email').lean();
      allUsers.forEach(u => console.log(`  - ${u.email}`));
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ User found');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Organization:', user.organization);
    console.log('Created:', user.createdAt);
    console.log();

    // 4. Check password
    console.log('4. Password Check');
    console.log('-'.repeat(60));

    if (!user.password) {
      console.log('✗ User has no password set');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ Password hash exists');
    console.log('Hash length:', user.password.length);
    console.log('Hash format:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$') ? '✓ bcrypt' : '✗ Unknown');
    console.log();

    // 5. Test password verification
    console.log('5. Password Verification Test');
    console.log('-'.repeat(60));

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Enter password to test (or press Enter to skip): ', async (testPassword) => {
      if (testPassword) {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(isValid ? '✓ Password matches!' : '✗ Password does not match');
      } else {
        console.log('Skipped password test');
      }

      console.log();
      console.log('='.repeat(60));
      console.log('Diagnostic complete');
      console.log('='.repeat(60));

      readline.close();
      await mongoose.connection.close();
    });

  } catch (error) {
    console.error('✗ Error during diagnostics:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];
diagnoseAuth(email);

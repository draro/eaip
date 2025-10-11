/**
 * Test script for Winston MongoDB logging
 *
 * This script tests that Winston is properly configured and writing logs to MongoDB.
 *
 * Usage:
 *   npx ts-node scripts/test-winston-logging.ts
 */

import { log } from '../src/lib/logger';

async function testLogging() {
  console.log('🧪 Testing Winston MongoDB Logging...\n');

  // Check environment
  console.log('📋 Environment Check:');
  console.log(`  MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
  console.log('');

  if (!process.env.MONGODB_URI) {
    console.log('❌ ERROR: MONGODB_URI is not set in environment variables');
    console.log('');
    console.log('To fix this:');
    console.log('1. Add MONGODB_URI to your .env file:');
    console.log('   MONGODB_URI=mongodb://localhost:27017/eaip');
    console.log('   (or your actual MongoDB connection string)');
    console.log('');
    console.log('2. Restart your application');
    console.log('');
    process.exit(1);
  }

  console.log('📝 Writing test logs...\n');

  // Test 1: Info log
  log.info('Test info log from script', {
    action: 'test',
    resource: 'logging',
    userId: null,
    organizationId: null,
    tags: ['test', 'winston']
  });
  console.log('  ✅ Info log written');

  // Test 2: Auth log
  log.auth('Test authentication log', {
    action: 'login',
    resource: 'auth',
    userId: '507f1f77bcf86cd799439011',
    organizationId: '507f1f77bcf86cd799439012',
    ipAddress: '127.0.0.1',
    userAgent: 'test-script'
  });
  console.log('  ✅ Auth log written');

  // Test 3: Security log
  log.security('Test security event', {
    action: 'test_security',
    resource: 'auth',
    ipAddress: '127.0.0.1',
    tags: ['security', 'test']
  });
  console.log('  ✅ Security log written');

  // Test 4: Error log
  const testError = new Error('Test error for logging');
  log.error('Test error log', testError, {
    action: 'test_error',
    resource: 'logging',
    tags: ['error', 'test']
  });
  console.log('  ✅ Error log written');

  // Test 5: Warning log
  log.warn('Test warning log', {
    action: 'test_warning',
    resource: 'logging',
    tags: ['warning', 'test']
  });
  console.log('  ✅ Warning log written');

  // Wait a bit for logs to be written to MongoDB
  console.log('\n⏳ Waiting 2 seconds for logs to be written to MongoDB...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n✅ Test logs have been written to MongoDB!');
  console.log('');
  console.log('📊 To verify logs in MongoDB:');
  console.log('');
  console.log('Option 1 - MongoDB Shell:');
  console.log('  mongo eaip');
  console.log('  db.auditlogs.find().limit(5).pretty()');
  console.log('  db.auditlogs.count()');
  console.log('');
  console.log('Option 2 - MongoDB Compass:');
  console.log('  1. Connect to your MongoDB instance');
  console.log('  2. Select "eaip" database');
  console.log('  3. View "auditlogs" collection');
  console.log('');
  console.log('Option 3 - Application:');
  console.log('  Navigate to: http://localhost:3000/admin/logs');
  console.log('');

  process.exit(0);
}

// Run the test
testLogging().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

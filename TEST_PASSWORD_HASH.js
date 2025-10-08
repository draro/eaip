/**
 * Test what password creates the existing hash
 */

const crypto = require('crypto');

const existingHash = 'e19c7fdc8a1a6f4c47491343e6e5721389dc1a844fdc6268bd7a2bba9784277c';

// Function from NextAuth
function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');
}

// Test common passwords
const testPasswords = [
  'password',
  'admin',
  'admin123',
  'eAIP2024',
  'eAIP2025',
  'FlyClim123',
  'TempPassword123',
  'TempPassword123!',
  'OrganizationAdmin',
  'Davide123',
  'davide',
  '123456',
  'eaip',
  'EAIP',
];

console.log('Testing passwords against hash:', existingHash);
console.log('');

let found = false;

testPasswords.forEach(password => {
  const hash = hashPassword(password);
  const match = hash === existingHash;

  if (match) {
    console.log(`✅ MATCH FOUND: "${password}"`);
    console.log(`   Hash: ${hash}`);
    found = true;
  }
});

if (!found) {
  console.log('❌ No match found in common passwords');
  console.log('');
  console.log('The password is likely custom or randomly generated.');
  console.log('Please use the reset script to set a new password.');
}

console.log('');
console.log('To test a specific password:');
console.log('  node TEST_PASSWORD_HASH.js "YourPasswordHere"');

// If password provided as argument
if (process.argv[2]) {
  console.log('');
  console.log('Testing provided password:', process.argv[2]);
  const testHash = hashPassword(process.argv[2]);
  console.log('Generated hash:', testHash);
  console.log('Expected hash: ', existingHash);
  console.log('Match:', testHash === existingHash ? '✅ YES' : '❌ NO');
}

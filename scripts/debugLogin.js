const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (error) {
    console.log('Could not load .env.local file, using system environment variables');
  }
}

// Connect to MongoDB
async function connectDB() {
  try {
    loadEnv();
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eaip';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Hash function (must match the one used)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'eAIP_salt_2025').digest('hex');
}

async function debugLogin() {
  try {
    console.log('🔍 Debugging login for admin@eaip.system...');

    // Get all collections to see what exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available collections:', collections.map(c => c.name));

    // Try to find the user with different possible schema names
    const possibleCollections = ['users', 'Users', 'user'];

    for (const collectionName of possibleCollections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n📊 Collection "${collectionName}" has ${count} documents`);

        if (count > 0) {
          const users = await collection.find({}).toArray();
          console.log(`\n👥 Users in "${collectionName}":`);
          users.forEach(user => {
            console.log(`  - ${user.email} (${user.role}) - Password: ${user.password ? 'Set' : 'Missing'}`);
          });

          // Look for the admin user specifically
          const adminUser = await collection.findOne({ email: 'admin@eaip.system' });
          if (adminUser) {
            console.log(`\n🔍 Found admin user in "${collectionName}":`);
            console.log('  - Email:', adminUser.email);
            console.log('  - Name:', adminUser.name);
            console.log('  - Role:', adminUser.role);
            console.log('  - Password hash:', adminUser.password);
            console.log('  - Active:', adminUser.isActive);

            // Test password verification
            const testPassword = 'eAIP2025';
            const expectedHash = hashPassword(testPassword);
            console.log(`\n🔐 Password verification:`);
            console.log('  - Test password:', testPassword);
            console.log('  - Expected hash:', expectedHash);
            console.log('  - Stored hash:', adminUser.password);
            console.log('  - Match:', expectedHash === adminUser.password ? '✅ YES' : '❌ NO');

            if (expectedHash !== adminUser.password) {
              console.log('\n🔧 Fixing password hash...');
              await collection.updateOne(
                { email: 'admin@eaip.system' },
                { $set: { password: expectedHash } }
              );
              console.log('✅ Password hash updated!');
            }
          }
        }
      } catch (err) {
        console.log(`❌ Could not access collection "${collectionName}": ${err.message}`);
      }
    }

    // Test the hash function directly
    console.log('\n🧪 Testing hash function:');
    const testPasswords = ['eAIP2025', 'eaip2025', 'EAIP2025'];
    testPasswords.forEach(pwd => {
      const hash = hashPassword(pwd);
      console.log(`  - "${pwd}" -> ${hash}`);
    });

  } catch (error) {
    console.error('❌ Error debugging login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the debug
connectDB().then(() => {
  debugLogin();
});
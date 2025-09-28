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

// User Schema (simplified)
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  firstName: String,
  lastName: String,
  password: String,
  role: String,
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  isActive: { type: Boolean, default: true },
  permissions: [String],
  preferences: Object
}, { timestamps: true });

// Add password verification method
UserSchema.methods.verifyPassword = function(password) {
  const hashedPassword = crypto.createHash('sha256').update(password + 'eAIP_salt_2025').digest('hex');
  return this.password === hashedPassword;
};

const User = mongoose.model('User', UserSchema);

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...');

    // Test credentials
    const testUsers = [
      { email: 'admin@eaip.system', password: 'eAIP2025', role: 'super_admin' },
      { email: 'orgadmin@default.local', password: 'eAIP2025', role: 'org_admin' },
      { email: 'editor@default.local', password: 'eAIP2025', role: 'editor' },
      { email: 'viewer@default.local', password: 'eAIP2025', role: 'viewer' }
    ];

    for (const testUser of testUsers) {
      console.log(`\n📧 Testing ${testUser.email}...`);

      // Find user
      const user = await User.findOne({ email: testUser.email });

      if (!user) {
        console.log(`❌ User not found: ${testUser.email}`);
        continue;
      }

      console.log(`✅ User found: ${user.name} (${user.role})`);

      // Test password verification
      const isPasswordValid = user.verifyPassword(testUser.password);

      if (isPasswordValid) {
        console.log(`✅ Password verification successful`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Active: ${user.isActive}`);
        console.log(`   - Organization: ${user.organization || 'None'}`);
      } else {
        console.log(`❌ Password verification failed`);
      }

      // Test wrong password
      const wrongPasswordTest = user.verifyPassword('wrongpassword');
      if (!wrongPasswordTest) {
        console.log(`✅ Correctly rejected wrong password`);
      } else {
        console.log(`❌ Incorrectly accepted wrong password`);
      }
    }

    console.log('\n🎉 Login test complete!');

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
connectDB().then(() => {
  testLogin();
});
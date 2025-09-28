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
    console.log('Connected to MongoDB:', mongoUri);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Simple password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'eAIP_salt_2025').digest('hex');
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
  preferences: {
    theme: String,
    language: String,
    timezone: String,
    notifications: {
      email: Boolean,
      browser: Boolean,
      slack: Boolean,
    },
    editor: {
      autoSave: Boolean,
      spellCheck: Boolean,
      wordWrap: Boolean,
    }
  }
}, { timestamps: true });

// Organization Schema (simplified)
const OrganizationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  domain: String,
  country: String,
  status: { type: String, default: 'active' },
  branding: {
    primaryColor: { type: String, default: '#1f2937' },
    secondaryColor: { type: String, default: '#3b82f6' }
  },
  contact: {
    email: String,
    phone: String,
    address: String
  },
  settings: {
    publicUrl: String,
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    enablePublicAccess: { type: Boolean, default: true },
    airacStartDate: Date
  },
  subscription: {
    plan: { type: String, default: 'basic' },
    maxUsers: { type: Number, default: 5 },
    maxDocuments: { type: Number, default: 10 },
    features: [String]
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);

async function resetDatabase() {
  try {
    console.log('🧹 Cleaning user database...');

    // Clear existing users and organizations
    await User.deleteMany({});
    await Organization.deleteMany({});

    console.log('✅ Cleared existing users and organizations');

    // Create a default organization
    const defaultOrg = new Organization({
      name: 'Default Organization',
      slug: 'default-org',
      domain: 'default.local',
      country: 'US',
      contact: {
        email: 'contact@default.local',
        phone: '+1-555-0100',
        address: '123 Default Street, Default City, DC 12345'
      },
      settings: {
        publicUrl: 'eaip.default.local',
        airacStartDate: new Date('2024-01-01')
      }
    });

    await defaultOrg.save();
    console.log('✅ Created default organization');

    // Create Super Admin user
    const superAdmin = new User({
      email: 'admin@eaip.system',
      name: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashPassword('eAIP2025'),
      role: 'super_admin',
      permissions: ['*'],
      preferences: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          slack: false
        },
        editor: {
          autoSave: true,
          spellCheck: true,
          wordWrap: true
        }
      }
    });

    await superAdmin.save();
    console.log('✅ Created Super Admin user');

    // Create Organization Admin user
    const orgAdmin = new User({
      email: 'orgadmin@default.local',
      name: 'Organization Admin',
      firstName: 'Organization',
      lastName: 'Admin',
      password: hashPassword('eAIP2025'),
      role: 'org_admin',
      organization: defaultOrg._id,
      permissions: ['org_manage', 'user_manage', 'document_edit'],
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          slack: false
        },
        editor: {
          autoSave: true,
          spellCheck: true,
          wordWrap: true
        }
      }
    });

    await orgAdmin.save();
    console.log('✅ Created Organization Admin user');

    // Create Editor user
    const editor = new User({
      email: 'editor@default.local',
      name: 'Document Editor',
      firstName: 'Document',
      lastName: 'Editor',
      password: hashPassword('eAIP2025'),
      role: 'editor',
      organization: defaultOrg._id,
      permissions: ['document_edit', 'document_create'],
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          slack: false
        },
        editor: {
          autoSave: true,
          spellCheck: true,
          wordWrap: true
        }
      }
    });

    await editor.save();
    console.log('✅ Created Editor user');

    // Create Viewer user
    const viewer = new User({
      email: 'viewer@default.local',
      name: 'Document Viewer',
      firstName: 'Document',
      lastName: 'Viewer',
      password: hashPassword('eAIP2025'),
      role: 'viewer',
      organization: defaultOrg._id,
      permissions: ['document_read'],
      preferences: {
        theme: 'auto',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: false,
          browser: true,
          slack: false
        },
        editor: {
          autoSave: true,
          spellCheck: true,
          wordWrap: true
        }
      }
    });

    await viewer.save();
    console.log('✅ Created Viewer user');

    console.log('\n🎉 Database reset complete!');
    console.log('\n📝 Available users:');
    console.log('1. Super Admin: admin@eaip.system (role: super_admin)');
    console.log('2. Org Admin: orgadmin@default.local (role: org_admin)');
    console.log('3. Editor: editor@default.local (role: editor)');
    console.log('4. Viewer: viewer@default.local (role: viewer)');
    console.log('\n🔑 Password for ALL users: eAIP2025');
    console.log('\nℹ️  All users are active and ready to use.');
    console.log('🏢 Default organization: "Default Organization" has been created.');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the reset
connectDB().then(() => {
  resetDatabase();
});
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eaip', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Organization schema (simplified)
const organizationSchema = new mongoose.Schema({
  name: String,
  domain: String,
  country: String,
  icaoCode: String,
  status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'active' },
  contact: {
    email: String,
    phone: String,
    address: String,
  },
  settings: {
    publicUrl: String,
    timezone: String,
    language: String,
  },
  subscription: {
    plan: { type: String, enum: ['basic', 'professional', 'enterprise'], default: 'basic' },
    maxUsers: { type: Number, default: 10 },
    maxDocuments: { type: Number, default: 100 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Organization = mongoose.model('Organization', organizationSchema);

// User schema for reference
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});

const User = mongoose.model('User', userSchema);

async function createTestOrganization() {
  try {
    // Get the super admin user
    const superAdmin = await User.findOne({ role: 'super_admin' });

    if (!superAdmin) {
      console.log('❌ No super admin found. Please run create-super-admin.js first.');
      return;
    }

    // Check if test organization already exists
    const existingOrg = await Organization.findOne({ domain: 'test-aviation.com' });

    if (existingOrg) {
      console.log('✅ Test organization already exists:', existingOrg.name);
      console.log('Organization ID:', existingOrg._id);
      return;
    }

    // Create test organization
    const testOrganization = new Organization({
      name: 'Test Aviation Authority',
      domain: 'test-aviation.com',
      country: 'US',
      icaoCode: 'TEST',
      status: 'active',
      contact: {
        email: 'contact@test-aviation.com',
        phone: '+1-555-123-4567',
        address: '123 Aviation Street, Flight City, FC 12345',
      },
      settings: {
        publicUrl: 'https://eaip.test-aviation.com',
        timezone: 'UTC',
        language: 'en',
      },
      subscription: {
        plan: 'professional',
        maxUsers: 50,
        maxDocuments: 500,
      },
      createdBy: superAdmin._id,
    });

    await testOrganization.save();
    console.log('✅ Test organization created successfully!');
    console.log('Name:', testOrganization.name);
    console.log('Domain:', testOrganization.domain);
    console.log('Organization ID:', testOrganization._id);
    console.log('Status:', testOrganization.status);
    console.log('Plan:', testOrganization.subscription.plan);

  } catch (error) {
    console.error('❌ Error creating test organization:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestOrganization();
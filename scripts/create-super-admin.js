const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eaip', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password + "eAIP_salt_2025")
    .digest("hex");
}

async function createSuperAdmin() {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      return;
    }

    // Create super admin
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'admin@eaip.system',
      password: hashPassword('admin123'),
      role: 'super_admin',
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('Email: admin@eaip.system');
    console.log('Password: admin123');
    console.log('Role: super_admin');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();
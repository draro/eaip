const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

async function checkUserOrg() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eaip');

    console.log('🔍 Checking orgadmin@default.local user...');

    const user = await User.findOne({ email: 'orgadmin@default.local' }).populate('organization');

    if (!user) {
      console.log('❌ User orgadmin@default.local not found');
      return;
    }

    console.log('✅ User found:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Organization ID:', user.organization);

    if (user.organization) {
      console.log('- Organization Name:', user.organization.name);
      console.log('- Organization Domain:', user.organization.domain);
    } else {
      console.log('❌ No organization assigned to this user');

      // Let's find the default organization and assign it
      const defaultOrg = await Organization.findOne({ domain: 'default.local' });

      if (defaultOrg) {
        console.log('🔧 Found default organization, assigning it to user...');
        await User.findByIdAndUpdate(user._id, { organization: defaultOrg._id });
        console.log('✅ User updated with organization:', defaultOrg.name);
      } else {
        console.log('❌ Default organization not found');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUserOrg();
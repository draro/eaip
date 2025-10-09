require('dotenv').config();
const mongoose = require('mongoose');

async function fixPublicAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const Organization = require('./src/models/Organization');

    console.log('Looking for FlyClim organization...');

    // Find the correct organization (with flyclim.com domain and the document)
    const correctOrg = await Organization.findById('68e25f61de97ab4c01dd6ae7');

    if (!correctOrg) {
      console.log('❌ Organization not found');
      process.exit(1);
    }

    console.log('Found organization:', {
      id: correctOrg._id.toString(),
      name: correctOrg.name,
      domain: correctOrg.domain,
      enablePublicAccess: correctOrg.settings?.enablePublicAccess
    });

    // Enable public access
    if (!correctOrg.settings) {
      correctOrg.settings = {};
    }

    correctOrg.settings.enablePublicAccess = true;
    await correctOrg.save();

    console.log('✅ Public access enabled!');
    console.log('');
    console.log('You can now access the public page at:');
    console.log(`  https://eaip.flyclim.com/public/${correctOrg.domain}`);
    console.log('');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixPublicAccess();

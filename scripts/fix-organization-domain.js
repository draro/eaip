/**
 * Fix Organization Domain Script
 *
 * This script updates the organization's domain to match the public URL
 *
 * Usage: node scripts/fix-organization-domain.js [domain] [org-name-pattern]
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function fixOrganizationDomain(targetDomain, orgNamePattern) {
  try {
    console.log('='.repeat(60));
    console.log('Organization Domain Fix Tool');
    console.log('='.repeat(60));
    console.log();

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGODB_URI not found in environment');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);
    console.log();

    const Organization = require('../src/models/Organization');

    // List all organizations first
    console.log('Current Organizations:');
    console.log('-'.repeat(60));
    const allOrgs = await Organization.find().select('name domain status settings.enablePublicAccess').lean();

    if (allOrgs.length === 0) {
      console.log('No organizations found in database');
      await mongoose.connection.close();
      process.exit(0);
    }

    allOrgs.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   Domain: ${org.domain || '(not set)'}`);
      console.log(`   Status: ${org.status}`);
      console.log(`   Public Access: ${org.settings?.enablePublicAccess || false}`);
      console.log();
    });

    // Find organization to update
    let organization;

    if (orgNamePattern) {
      const regex = new RegExp(orgNamePattern, 'i');
      organization = await Organization.findOne({ name: regex });
    } else {
      // Use first organization if no pattern provided
      organization = await Organization.findOne();
    }

    if (!organization) {
      console.log('✗ Organization not found');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('Found organization to update:');
    console.log('-'.repeat(60));
    console.log('Name:', organization.name);
    console.log('Current Domain:', organization.domain || '(not set)');
    console.log('Status:', organization.status);
    console.log('Public Access:', organization.settings?.enablePublicAccess || false);
    console.log();

    // Update organization
    console.log('Updating organization...');
    console.log('-'.repeat(60));

    const oldDomain = organization.domain;
    organization.domain = targetDomain;

    // Ensure public access is enabled
    if (!organization.settings) {
      organization.settings = {};
    }
    organization.settings.enablePublicAccess = true;

    // Ensure status is active
    if (organization.status !== 'active') {
      organization.status = 'active';
    }

    await organization.save();

    console.log('✓ Organization updated successfully!');
    console.log();
    console.log('Changes:');
    console.log('-'.repeat(60));
    console.log(`Domain: ${oldDomain || '(not set)'} → ${organization.domain}`);
    console.log(`Status: ${organization.status}`);
    console.log(`Public Access: ${organization.settings.enablePublicAccess}`);
    console.log();

    // Verify the change
    console.log('Verification:');
    console.log('-'.repeat(60));

    const updated = await Organization.findById(organization._id).select('name domain status settings.enablePublicAccess');

    if (updated && updated.domain === targetDomain) {
      console.log('✓ Domain verified in database');
      console.log();
      console.log('Public URL:');
      console.log(`  https://${targetDomain}/public/${targetDomain}`);
      console.log();
      console.log('API Test:');
      console.log(`  curl "https://${targetDomain}/api/organizations/by-domain?domain=${targetDomain}"`);
    } else {
      console.log('✗ Verification failed');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Restart the application container');
    console.log('2. Visit https://' + targetDomain + '/public/' + targetDomain);
    console.log('3. Verify canonical URLs are present');
    console.log('4. Run SEO scanner');
    console.log();

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Get arguments
const targetDomain = process.argv[2] || 'flyclim.com';
const orgNamePattern = process.argv[3]; // Optional

console.log();
console.log('Target Domain:', targetDomain);
if (orgNamePattern) {
  console.log('Organization Pattern:', orgNamePattern);
}
console.log();

fixOrganizationDomain(targetDomain, orgNamePattern);

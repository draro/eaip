#!/bin/bash

echo "=== Authentication Debug Tool ==="
echo ""

cat << 'SCRIPT' | ssh root@72.60.213.232 "cd /eaip && docker-compose exec -T eaip-app node"
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const Organization = require('./src/models/Organization');
    const Domain = require('./src/models/Domain');

    console.log('1. USER INFO');
    console.log('────────────────────────────────────────');
    const user = await User.findOne({ email: 'raro.davide@gmail.com' });
    console.log('Email:', user.email);
    console.log('User Org ID:', user.organization.toString());
    console.log('');

    console.log('2. ORGANIZATION INFO');
    console.log('────────────────────────────────────────');
    const org = await Organization.findById(user.organization);
    console.log('Org ID:', org._id.toString());
    console.log('Org Name:', org.name);
    console.log('Org Domain:', org.domain);
    console.log('Org Status:', org.status);
    console.log('');

    console.log('3. DOMAIN LOOKUP');
    console.log('────────────────────────────────────────');

    // Check if domain exists in Domain collection
    const domainRecord = await Domain.findOne({ domain: 'eaip.flyclim.com' });
    if (domainRecord) {
      console.log('Domain record found:');
      console.log('  Domain:', domainRecord.domain);
      console.log('  Org ID:', domainRecord.organizationId?.toString());
      console.log('  Active:', domainRecord.isActive);
      console.log('  Verified:', domainRecord.isVerified);
    } else {
      console.log('❌ No domain record for eaip.flyclim.com');
    }
    console.log('');

    // Check if org domain matches
    console.log('4. DOMAIN VALIDATION');
    console.log('────────────────────────────────────────');
    console.log('Request domain: eaip.flyclim.com');
    console.log('Org domain:', org.domain);
    console.log('Match:', org.domain === 'eaip.flyclim.com' ? '✅ YES' : '❌ NO');
    console.log('');

    console.log('5. PASSWORD TEST');
    console.log('────────────────────────────────────────');
    const testPassword = 'eAIP2025';
    const hashedPassword = crypto
      .createHash('sha256')
      .update(testPassword + 'eAIP_salt_2025')
      .digest('hex');

    console.log('Test password:', testPassword);
    console.log('Generated hash:', hashedPassword);
    console.log('User hash:     ', user.password);
    console.log('Match:', hashedPassword === user.password ? '✅ YES' : '❌ NO');
    console.log('');

    console.log('6. DIAGNOSIS');
    console.log('────────────────────────────────────────');

    if (hashedPassword !== user.password) {
      console.log('❌ PASSWORD MISMATCH');
      console.log('   → Use RESET_DAVIDE_PASSWORD.sh to fix');
    } else {
      console.log('✅ Password is correct');
    }

    if (org.domain !== 'eaip.flyclim.com') {
      console.log('❌ DOMAIN MISMATCH');
      console.log('   → Org domain:', org.domain);
      console.log('   → Request domain: eaip.flyclim.com');
      console.log('   → This may cause cross-tenant login blocking');
    } else {
      console.log('✅ Domain matches');
    }

    if (!domainRecord && org.domain !== 'eaip.flyclim.com') {
      console.log('');
      console.log('LIKELY ISSUE: Domain configuration mismatch');
      console.log('');
      console.log('FIX: Update organization domain:');
      console.log('  org.domain = "eaip.flyclim.com"');
      console.log('  org.save()');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

debug();
SCRIPT

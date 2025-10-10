#!/usr/bin/env node

/**
 * Drop the unique index on aipdocuments collection
 * This allows organizations to have multiple documents for the same country/airport/version
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

async function dropUniqueIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('aipdocuments');

    // Get current indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(UNIQUE)' : '');
    });

    // Drop the problematic unique index
    const indexName = 'organization_1_country_1_airport_1_version_1_documentType_1';

    try {
      console.log(`\nDropping unique index: ${indexName}...`);
      await collection.dropIndex(indexName);
      console.log('✓ Unique index dropped successfully');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('✓ Index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Recreate as non-unique index
    console.log('\nRecreating as non-unique index...');
    await collection.createIndex(
      { organization: 1, country: 1, airport: 1, version: 1, documentType: 1 },
      { unique: false, background: true }
    );
    console.log('✓ Non-unique index created');

    // Show updated indexes
    console.log('\nUpdated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key, index.unique ? '(UNIQUE)' : '');
    });

    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

dropUniqueIndex();

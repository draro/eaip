const mongoose = require('mongoose');

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb.qj1barl.mongodb.net/?retryWrites=true&w=majority&appName=flyclimWeb');
    
    const db = mongoose.connection.db;
    const collection = db.collection('aipdocuments');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the old unique index (without documentType)
    try {
      await collection.dropIndex('organization_1_country_1_airport_1_version_1');
      console.log('✅ Dropped old unique index');
    } catch (err) {
      console.log('ℹ️  Old index not found or already dropped:', err.message);
    }
    
    // Create new unique index (with documentType)
    await collection.createIndex(
      { organization: 1, country: 1, airport: 1, version: 1, documentType: 1 },
      { unique: true, name: 'organization_1_country_1_airport_1_version_1_documentType_1' }
    );
    console.log('✅ Created new unique index with documentType');
    
    console.log('\n✨ Index migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndex();

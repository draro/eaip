const mongoose = require('mongoose');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://davide:!!!Sasha2015!!!Eliana2019!!!@flyclimweb.qj1barl.mongodb.net/?retryWrites=true&w=majority&appName=flyclimWeb');
    
    const db = mongoose.connection.db;
    const collection = db.collection('aipdocuments');
    
    // Find documents with null values
    const nullDocs = await collection.find({
      $or: [
        { organization: null },
        { country: null },
        { documentType: null }
      ]
    }).toArray();
    
    console.log(`Found ${nullDocs.length} documents with null values`);
    
    if (nullDocs.length > 0) {
      console.log('\nDocuments with issues:');
      nullDocs.forEach(doc => {
        console.log(`- ${doc._id}: org=${doc.organization}, country=${doc.country}, type=${doc.documentType}`);
      });
      
      // Delete invalid documents
      const result = await collection.deleteMany({
        $or: [
          { organization: null },
          { country: null },
          { documentType: null }
        ]
      });
      console.log(`\n✅ Deleted ${result.deletedCount} invalid documents`);
    }
    
    // Drop old sectionCode index
    try {
      await collection.dropIndex('sectionCode_1_subsectionCode_1_version_1');
      console.log('✅ Dropped old sectionCode index');
    } catch (err) {
      console.log('ℹ️  sectionCode index not found:', err.message);
    }
    
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();

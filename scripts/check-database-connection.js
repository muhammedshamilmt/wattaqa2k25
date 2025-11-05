require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function checkDatabaseConnection() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db('wattaqa2k25');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check each collection count
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`📊 ${col.name}: ${count} documents`);
    }
    
    // Check if we have any results with status 'published'
    const publishedResults = await db.collection('results').find({ status: 'published' }).toArray();
    console.log(`\n🔍 Published results: ${publishedResults.length}`);
    
    if (publishedResults.length > 0) {
      console.log('Sample published result:');
      console.log(JSON.stringify(publishedResults[0], null, 2));
    }
    
    // Check programmes
    const programmes = await db.collection('programmes').find({}).limit(3).toArray();
    console.log(`\n📋 Sample programmes: ${programmes.length}`);
    if (programmes.length > 0) {
      programmes.forEach(prog => {
        console.log(`  - ${prog.name} (${prog._id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabaseConnection();
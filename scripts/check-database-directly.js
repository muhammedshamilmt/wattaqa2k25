#!/usr/bin/env node

/**
 * Direct database check script to verify programme participants data
 */

const { MongoClient } = require('mongodb');

console.log('🔍 DIRECT DATABASE CHECK FOR PROGRAMME PARTICIPANTS\n');

async function checkDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('wattaqa-festival-2k25');
    
    // Check programme_participants collection
    console.log('📊 CHECKING programme_participants COLLECTION:');
    const participantsCollection = db.collection('programme_participants');
    
    const totalCount = await participantsCollection.countDocuments();
    console.log(`   Total documents: ${totalCount}`);
    
    if (totalCount > 0) {
      // Get sample documents
      const sampleDocs = await participantsCollection.find({}).limit(3).toArray();
      console.log('\n   Sample documents:');
      sampleDocs.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${JSON.stringify(doc, null, 4)}`);
      });

      // Check team distribution
      const teamAggregation = await participantsCollection.aggregate([
        { $group: { _id: '$teamCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      console.log('\n   Team distribution:');
      teamAggregation.forEach(team => {
        console.log(`   ${team._id}: ${team.count} registrations`);
      });

      // Check specific team (SMD)
      const smdDocs = await participantsCollection.find({ teamCode: 'SMD' }).toArray();
      console.log(`\n   SMD team registrations: ${smdDocs.length}`);
      if (smdDocs.length > 0) {
        console.log('   SMD programmes:');
        smdDocs.forEach((doc, i) => {
          console.log(`   ${i + 1}. ${doc.programmeName} (${doc.programmeCode})`);
          console.log(`      Programme ID: ${doc.programmeId}`);
          console.log(`      Participants: ${doc.participants?.join(', ') || 'None'}`);
        });
      }

      // Check field consistency
      console.log('\n   Field analysis:');
      const fieldSample = await participantsCollection.findOne({});
      if (fieldSample) {
        console.log('   Available fields:', Object.keys(fieldSample));
        console.log('   programmeId type:', typeof fieldSample.programmeId);
        console.log('   teamCode type:', typeof fieldSample.teamCode);
      }

    } else {
      console.log('   ❌ NO DOCUMENTS FOUND IN programme_participants COLLECTION');
      console.log('   This explains why registrations are not showing up!');
    }

    // Check programmes collection for comparison
    console.log('\n📊 CHECKING programmes COLLECTION:');
    const programmesCollection = db.collection('programmes');
    const programmesCount = await programmesCollection.countDocuments();
    console.log(`   Total programmes: ${programmesCount}`);
    
    if (programmesCount > 0) {
      const sampleProgramme = await programmesCollection.findOne({});
      console.log('   Sample programme _id type:', typeof sampleProgramme._id);
      console.log('   Sample programme _id value:', sampleProgramme._id);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Check if MongoDB is running');
    console.log('2. Verify MONGODB_URI environment variable');
    console.log('3. Check database name: wattaqa-festival-2k25');
    console.log('4. Verify collection name: programme_participants');
  } finally {
    await client.close();
  }
}

console.log('🚀 Starting database check...\n');
checkDatabase();
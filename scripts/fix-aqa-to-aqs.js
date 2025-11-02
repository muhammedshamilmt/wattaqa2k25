const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function fixAqaToAqs() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';
  console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('=== FIXING AQA TO AQS TEAM CODE MISMATCH ===\n');
    
    // Check current state
    const candidatesCollection = db.collection('candidates');
    const aqaCandidates = await candidatesCollection.find({ team: 'AQA' }).toArray();
    const aqsCandidates = await candidatesCollection.find({ team: 'AQS' }).toArray();
    
    console.log('Current state:');
    console.log(`- Candidates with team "AQA": ${aqaCandidates.length}`);
    console.log(`- Candidates with team "AQS": ${aqsCandidates.length}`);
    
    if (aqaCandidates.length === 0) {
      console.log('\n✅ No AQA candidates found. All candidates already have correct team codes.');
      return;
    }
    
    console.log('\nAQA candidates to be updated:');
    aqaCandidates.forEach(candidate => {
      console.log(`- ${candidate.chestNumber}: ${candidate.name} (${candidate.section})`);
    });
    
    // Update AQA to AQS
    const updateResult = await candidatesCollection.updateMany(
      { team: 'AQA' },
      { $set: { team: 'AQS' } }
    );
    
    console.log(`\n✅ Updated ${updateResult.modifiedCount} candidates from AQA to AQS`);
    
    // Also check and fix any results that might have AQA team codes
    const resultsCollection = db.collection('results');
    
    // Fix team results
    const teamResultsUpdate = await resultsCollection.updateMany(
      {
        $or: [
          { 'firstPlaceTeams.teamCode': 'AQA' },
          { 'secondPlaceTeams.teamCode': 'AQA' },
          { 'thirdPlaceTeams.teamCode': 'AQA' },
          { 'participationTeamGrades.teamCode': 'AQA' }
        ]
      },
      {
        $set: {
          'firstPlaceTeams.$[elem].teamCode': 'AQS',
          'secondPlaceTeams.$[elem].teamCode': 'AQS',
          'thirdPlaceTeams.$[elem].teamCode': 'AQS',
          'participationTeamGrades.$[elem].teamCode': 'AQS'
        }
      },
      {
        arrayFilters: [{ 'elem.teamCode': 'AQA' }]
      }
    );
    
    if (teamResultsUpdate.modifiedCount > 0) {
      console.log(`✅ Updated ${teamResultsUpdate.modifiedCount} results with AQA team codes to AQS`);
    }
    
    // Verify the fix
    const finalAqaCandidates = await candidatesCollection.find({ team: 'AQA' }).toArray();
    const finalAqsCandidates = await candidatesCollection.find({ team: 'AQS' }).toArray();
    
    console.log('\nFinal state:');
    console.log(`- Candidates with team "AQA": ${finalAqaCandidates.length}`);
    console.log(`- Candidates with team "AQS": ${finalAqsCandidates.length}`);
    
    if (finalAqaCandidates.length === 0) {
      console.log('\n🎉 SUCCESS! All AQA candidates have been updated to AQS.');
      console.log('Now AQSA team should show correct points in the marks summary.');
    } else {
      console.log('\n❌ Some AQA candidates still remain. Manual intervention may be needed.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixAqaToAqs().catch(console.error);
const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function checkAllTeamCodes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';
  console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('=== CHECKING ALL TEAM CODES IN DATABASE ===\n');
    
    // Check teams collection
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    
    console.log('1. TEAMS COLLECTION:');
    if (teams.length === 0) {
      console.log('   ❌ No teams found in database!');
    } else {
      teams.forEach(team => {
        console.log(`   - Code: "${team.code}", Name: "${team.name}"`);
      });
    }
    
    // Check candidates collection
    const candidatesCollection = db.collection('candidates');
    const candidates = await candidatesCollection.find({}).toArray();
    
    console.log(`\n2. CANDIDATES COLLECTION (${candidates.length} total):`);
    if (candidates.length === 0) {
      console.log('   ❌ No candidates found in database!');
    } else {
      // Group by team
      const teamGroups = {};
      candidates.forEach(candidate => {
        const team = candidate.team || 'NO_TEAM';
        if (!teamGroups[team]) {
          teamGroups[team] = [];
        }
        teamGroups[team].push(candidate);
      });
      
      Object.keys(teamGroups).forEach(teamCode => {
        console.log(`   - Team "${teamCode}": ${teamGroups[teamCode].length} candidates`);
        // Show first few candidates as examples
        teamGroups[teamCode].slice(0, 3).forEach(candidate => {
          console.log(`     * ${candidate.chestNumber}: ${candidate.name}`);
        });
        if (teamGroups[teamCode].length > 3) {
          console.log(`     * ... and ${teamGroups[teamCode].length - 3} more`);
        }
      });
    }
    
    // Check results collection
    const resultsCollection = db.collection('results');
    const results = await resultsCollection.find({}).toArray();
    
    console.log(`\n3. RESULTS COLLECTION (${results.length} total):`);
    if (results.length === 0) {
      console.log('   ❌ No results found in database!');
    } else {
      const publishedResults = results.filter(r => r.status === 'published');
      console.log(`   - Published results: ${publishedResults.length}`);
      console.log(`   - Other results: ${results.length - publishedResults.length}`);
    }
    
    // Summary and recommendations
    console.log('\n4. SUMMARY & RECOMMENDATIONS:');
    
    if (teams.length === 0) {
      console.log('   🔧 Run: node scripts/init-db.js (to create teams)');
    }
    
    if (candidates.length === 0) {
      console.log('   🔧 Run: node scripts/add-sample-candidates.js (to add candidates)');
    }
    
    if (results.length === 0) {
      console.log('   🔧 Run: node scripts/add-sample-results.js (to add sample results)');
    }
    
    const aqsaTeam = teams.find(t => t.code === 'AQS' || t.code === 'AQA');
    if (aqsaTeam) {
      console.log(`   ✅ AQSA team found with code: "${aqsaTeam.code}"`);
      
      const aqsaCandidates = candidates.filter(c => c.team === aqsaTeam.code);
      if (aqsaCandidates.length === 0) {
        console.log(`   ❌ No candidates found for team "${aqsaTeam.code}"`);
        console.log('   🔧 This explains why AQSA shows 0 points!');
      } else {
        console.log(`   ✅ Found ${aqsaCandidates.length} candidates for team "${aqsaTeam.code}"`);
      }
    } else {
      console.log('   ❌ No AQSA team found (neither AQS nor AQA)');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the check
checkAllTeamCodes().catch(console.error);
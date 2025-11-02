const { MongoClient } = require('mongodb');

async function debugAqsaTeam() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== DEBUGGING AQSA TEAM ISSUE ===\n');
    
    // Check teams collection
    const teams = await db.collection('teams').find({}).toArray();
    console.log('1. TEAMS IN DATABASE:');
    teams.forEach(team => {
      console.log(`   - Code: ${team.code}, Name: ${team.name}`);
    });
    
    const aqsTeam = teams.find(t => t.code === 'AQS');
    console.log('\n2. AQS TEAM FOUND:', aqsTeam ? 'YES' : 'NO');
    if (aqsTeam) {
      console.log('   AQS Team Details:', aqsTeam);
    }
    
    // Check candidates collection
    const candidates = await db.collection('candidates').find({}).toArray();
    const aqsCandidates = candidates.filter(c => c.team === 'AQS');
    console.log('\n3. AQS CANDIDATES:');
    console.log(`   Total candidates: ${candidates.length}`);
    console.log(`   AQS candidates: ${aqsCandidates.length}`);
    aqsCandidates.forEach(candidate => {
      console.log(`   - ${candidate.chestNumber}: ${candidate.name} (${candidate.section})`);
    });
    
    // Check results collection
    const results = await db.collection('results').find({ status: 'published' }).toArray();
    console.log('\n4. PUBLISHED RESULTS:');
    console.log(`   Total published results: ${results.length}`);
    
    let aqsResultsCount = 0;
    results.forEach(result => {
      let hasAqsWinner = false;
      
      // Check individual winners
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS 1st place: ${winner.chestNumber} in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS 2nd place: ${winner.chestNumber} in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS 3rd place: ${winner.chestNumber} in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      // Check team winners
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (winner.teamCode === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS team 1st place in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (winner.teamCode === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS team 2nd place in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (winner.teamCode === 'AQS') {
            hasAqsWinner = true;
            console.log(`   - AQS team 3rd place in ${result.programmeName || 'Unknown'}`);
          }
        });
      }
      
      if (hasAqsWinner) {
        aqsResultsCount++;
      }
    });
    
    console.log(`\n5. SUMMARY:`);
    console.log(`   - AQS team exists: ${aqsTeam ? 'YES' : 'NO'}`);
    console.log(`   - AQS candidates: ${aqsCandidates.length}`);
    console.log(`   - Published results with AQS winners: ${aqsResultsCount}`);
    
    if (aqsResultsCount === 0) {
      console.log('\n❌ ISSUE FOUND: No published results contain AQS winners!');
      console.log('   This explains why AQS shows 0 points in the summary.');
      console.log('   Solution: Create some results with AQS winners and publish them.');
    } else {
      console.log('\n✅ AQS has winners in published results. Issue might be in the calculation logic.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the debug function
debugAqsaTeam().catch(console.error);
require('dotenv').config({ path: '.env.local' });

async function testLeaderboardAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING LEADERBOARD APIs\n');
  
  try {
    // Test grand marks API
    console.log('📊 Testing /api/grand-marks...');
    const grandMarksRes = await fetch(`${baseUrl}/api/grand-marks?category=all`);
    if (grandMarksRes.ok) {
      const grandMarksData = await grandMarksRes.json();
      console.log(`✅ Grand marks API: ${grandMarksData.length} teams`);
      grandMarksData.forEach(team => {
        console.log(`  - ${team.name}: ${team.points} points`);
      });
    } else {
      console.log(`❌ Grand marks API failed: ${grandMarksRes.status}`);
    }
    
    console.log('\n📋 Testing /api/results...');
    const resultsRes = await fetch(`${baseUrl}/api/results?status=published`);
    if (resultsRes.ok) {
      const resultsData = await resultsRes.json();
      console.log(`✅ Results API: ${resultsData.length} published results`);
      
      if (resultsData.length > 0) {
        console.log('Sample result:');
        const sample = resultsData[0];
        console.log(`  - Programme: ${sample.programmeName || 'Unknown'}`);
        console.log(`  - Programme ID: ${sample.programmeId}`);
        console.log(`  - First Place: ${sample.firstPlace?.length || 0} winners`);
        console.log(`  - Status: ${sample.status}`);
      }
    } else {
      console.log(`❌ Results API failed: ${resultsRes.status}`);
    }
    
    console.log('\n👥 Testing /api/candidates...');
    const candidatesRes = await fetch(`${baseUrl}/api/candidates`);
    if (candidatesRes.ok) {
      const candidatesData = await candidatesRes.json();
      console.log(`✅ Candidates API: ${candidatesData.length} candidates`);
      
      if (candidatesData.length > 0) {
        console.log('Sample candidates:');
        candidatesData.slice(0, 3).forEach(candidate => {
          console.log(`  - ${candidate.name} (${candidate.chestNumber}) - ${candidate.team}`);
        });
      }
    } else {
      console.log(`❌ Candidates API failed: ${candidatesRes.status}`);
    }
    
    console.log('\n📚 Testing /api/programmes...');
    const programmesRes = await fetch(`${baseUrl}/api/programmes`);
    if (programmesRes.ok) {
      const programmesData = await programmesRes.json();
      console.log(`✅ Programmes API: ${programmesData.length} programmes`);
      
      if (programmesData.length > 0) {
        console.log('Sample programmes:');
        programmesData.slice(0, 3).forEach(programme => {
          console.log(`  - ${programme.name} (${programme._id}) - ${programme.category}`);
        });
      }
    } else {
      console.log(`❌ Programmes API failed: ${programmesRes.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on localhost:3000');
    console.log('   Run: npm run dev');
  }
}

testLeaderboardAPIs();
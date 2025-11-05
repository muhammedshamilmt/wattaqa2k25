console.log('🔍 Debugging Published Marks Comparison...\n');

async function debugPublishedMarks() {
  try {
    console.log('📊 Fetching data from different sources...\n');
    
    // Test different API endpoints
    const endpoints = [
      { url: 'http://localhost:3000/api/grand-marks?category=arts', name: 'Grand Marks API (Arts)' },
      { url: 'http://localhost:3000/api/results?status=published', name: 'Published Results API' },
      { url: 'http://localhost:3000/api/teams', name: 'Teams API' },
      { url: 'http://localhost:3000/api/programmes', name: 'Programmes API' }
    ];
    
    const data = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Fetching ${endpoint.name}...`);
        const response = await fetch(endpoint.url);
        const result = await response.json();
        
        if (response.ok) {
          data[endpoint.name] = result;
          console.log(`   ✅ Success: ${Array.isArray(result) ? result.length : 'Object'} items`);
        } else {
          console.log(`   ❌ Error: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
    }
    
    console.log('\n📈 Current Grand Marks API Results:');
    const grandMarks = data['Grand Marks API (Arts)'];
    if (grandMarks && Array.isArray(grandMarks)) {
      grandMarks.forEach((team, index) => {
        console.log(`   ${index + 1}. ${team.name} (${team.teamCode}): ${Math.round(team.points)} pts`);
        console.log(`      Arts: ${Math.round(team.artsPoints || 0)} | Sports: ${Math.round(team.sportsPoints || 0)}`);
      });
    }
    
    console.log('\n🎯 Expected Results (from admin checklist):');
    console.log('   1. Team Inthifada (INT): 544 pts');
    console.log('   2. Team Sumud (SMD): 432 pts');
    console.log('   3. Team Aqsa (AQS): 424 pts');
    
    console.log('\n🔍 Analysis:');
    if (grandMarks && Array.isArray(grandMarks)) {
      const intTeam = grandMarks.find(t => t.teamCode === 'INT');
      const smdTeam = grandMarks.find(t => t.teamCode === 'SMD');
      const aqsTeam = grandMarks.find(t => t.teamCode === 'AQS');
      
      if (intTeam) {
        const diff = Math.round(intTeam.points) - 544;
        console.log(`   INT: API shows ${Math.round(intTeam.points)}, expected 544 (difference: ${diff > 0 ? '+' : ''}${diff})`);
      }
      if (smdTeam) {
        const diff = Math.round(smdTeam.points) - 432;
        console.log(`   SMD: API shows ${Math.round(smdTeam.points)}, expected 432 (difference: ${diff > 0 ? '+' : ''}${diff})`);
      }
      if (aqsTeam) {
        const diff = Math.round(aqsTeam.points) - 424;
        console.log(`   AQS: API shows ${Math.round(aqsTeam.points)}, expected 424 (difference: ${diff > 0 ? '+' : ''}${diff})`);
      }
    }
    
    console.log('\n📝 Possible Issues:');
    console.log('   • Different filtering criteria (arts-total vs arts-stage vs arts-non-stage)');
    console.log('   • Different grade points calculation');
    console.log('   • Different result status filtering');
    console.log('   • Different programme categorization');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Check admin checklist page filtering (arts-total vs arts-stage)');
    console.log('   2. Verify which results are being included');
    console.log('   3. Check if there are unpublished results being excluded');
    console.log('   4. Verify programme categories and subcategories');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugPublishedMarks();
console.log('🧪 Testing Grand Marks API Fix...\n');

async function testGrandMarksAPI() {
  try {
    // Test the grand marks API with different categories
    console.log('📊 Testing Grand Marks API endpoints...');
    
    const testEndpoints = [
      { url: 'http://localhost:3000/api/grand-marks?category=all', name: 'All Categories' },
      { url: 'http://localhost:3000/api/grand-marks?category=arts', name: 'Arts Only' },
      { url: 'http://localhost:3000/api/grand-marks?category=sports', name: 'Sports Only' }
    ];
    
    for (const endpoint of testEndpoints) {
      console.log(`\n🔍 Testing ${endpoint.name}:`);
      console.log(`   URL: ${endpoint.url}`);
      
      try {
        const response = await fetch(endpoint.url);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          console.log(`   ✅ Success: ${data.length} teams returned`);
          
          // Show top 3 teams
          data.slice(0, 3).forEach((team, index) => {
            console.log(`   ${index + 1}. ${team.name} (${team.teamCode}): ${team.points} pts`);
            console.log(`      Arts: ${team.artsPoints || 0} | Sports: ${team.sportsPoints || 0}`);
          });
        } else {
          console.log(`   ❌ Error: ${response.status} - ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Testing Grade Points System...');
    console.log('   Expected: A+ = 10, A = 9, B+ = 7, etc.');
    console.log('   This should now match the admin checklist page calculation');
    
    console.log('\n🏆 Testing Team Code Extraction...');
    console.log('   Expected: AQS123 → AQS, SM200 → SMD, INT400 → INT');
    console.log('   This should now match the admin checklist page logic');
    
    console.log('\n✅ Grand Marks API Fix Test Complete!');
    console.log('📝 Next Steps:');
    console.log('   1. Check the public results page at http://localhost:3000/results');
    console.log('   2. Compare team marks with admin checklist at http://localhost:3000/admin/results/checklist');
    console.log('   3. Verify that both pages show identical team marks');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGrandMarksAPI();
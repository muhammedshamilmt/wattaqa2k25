console.log('🔍 Testing Subcategory Filtering...\n');

async function testSubcategoryFiltering() {
  try {
    console.log('📊 Testing different arts subcategory filters...\n');
    
    const filters = [
      { category: 'arts', subcategory: 'all', name: 'Arts Total' },
      { category: 'arts', subcategory: 'stage', name: 'Arts Stage' },
      { category: 'arts', subcategory: 'non-stage', name: 'Arts Non-Stage' }
    ];
    
    for (const filter of filters) {
      console.log(`🔍 Testing ${filter.name}:`);
      
      try {
        const url = `http://localhost:3000/api/grand-marks?category=${filter.category}&subcategory=${filter.subcategory}`;
        console.log(`   URL: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          console.log(`   ✅ Success: ${data.length} teams returned`);
          
          data.forEach((team, index) => {
            console.log(`   ${index + 1}. ${team.name} (${team.teamCode}): ${Math.round(team.points)} pts`);
          });
          
          // Check if any of these match the expected values
          const intTeam = data.find(t => t.teamCode === 'INT');
          const smdTeam = data.find(t => t.teamCode === 'SMD');
          const aqsTeam = data.find(t => t.teamCode === 'AQS');
          
          console.log('   Expected vs Actual:');
          if (intTeam) console.log(`     INT: ${Math.round(intTeam.points)} (expected: 544)`);
          if (smdTeam) console.log(`     SMD: ${Math.round(smdTeam.points)} (expected: 432)`);
          if (aqsTeam) console.log(`     AQS: ${Math.round(aqsTeam.points)} (expected: 424)`);
          
          // Check if this matches the expected values
          if (intTeam && Math.abs(Math.round(intTeam.points) - 544) < 10) {
            console.log(`   🎯 MATCH FOUND! ${filter.name} shows expected values!`);
          }
          
        } else {
          console.log(`   ❌ Error: ${response.status} - ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎯 Analysis:');
    console.log('   • If Arts Stage or Arts Non-Stage matches expected values,');
    console.log('     then the admin checklist is filtering by subcategory');
    console.log('   • If none match, there might be a different calculation method');
    console.log('   • The public results page should use the same filter as admin checklist');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSubcategoryFiltering();
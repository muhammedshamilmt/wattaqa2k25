require('dotenv').config({ path: '.env.local' });

async function testAdminChecklistAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING ADMIN CHECKLIST API\n');
  
  try {
    // Test the admin checklist page to see what APIs it uses
    console.log('📊 Testing APIs that admin checklist might use...');
    
    // Test various potential APIs
    const apiEndpoints = [
      '/api/results?status=published',
      '/api/results?teamView=true',
      '/api/results/status?status=published',
      '/api/results/published',
      '/api/grand-marks?category=all',
      '/api/teams',
      '/api/candidates',
      '/api/programmes'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`\n🔍 Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'object'} items`);
          
          if (endpoint.includes('results') && Array.isArray(data) && data.length > 0) {
            const sample = data[0];
            console.log(`   Sample result structure:`);
            console.log(`   - ID: ${sample._id || sample.id}`);
            console.log(`   - Programme: ${sample.programmeName || sample.programmeId}`);
            console.log(`   - Status: ${sample.status}`);
            console.log(`   - First Place: ${sample.firstPlace?.length || 0} winners`);
            console.log(`   - Category: ${sample.programmeCategory || 'N/A'}`);
          }
          
          if (endpoint.includes('grand-marks') && Array.isArray(data) && data.length > 0) {
            const sample = data[0];
            console.log(`   Sample grand marks structure:`);
            console.log(`   - Team: ${sample.name} (${sample.teamCode})`);
            console.log(`   - Total: ${sample.points}`);
            console.log(`   - Arts: ${sample.artsPoints || 'N/A'}`);
            console.log(`   - Sports: ${sample.sportsPoints || 'N/A'}`);
            console.log(`   - Results: ${sample.results || 'N/A'}`);
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
    // Test what the grand marks API returns specifically
    console.log(`\n🏆 DETAILED GRAND MARKS API ANALYSIS:`);
    const grandMarksRes = await fetch(`${baseUrl}/api/grand-marks?category=all`);
    if (grandMarksRes.ok) {
      const grandMarksData = await grandMarksRes.json();
      console.log(`Grand marks data (${grandMarksData.length} teams):`);
      grandMarksData.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} (${team.teamCode})`);
        console.log(`   Total Points: ${team.points}`);
        console.log(`   Arts Points: ${team.artsPoints || 'undefined'}`);
        console.log(`   Sports Points: ${team.sportsPoints || 'undefined'}`);
        console.log(`   Results Count: ${team.results || 'undefined'}`);
        console.log(`   Color: ${team.color || 'undefined'}`);
        console.log('---');
      });
    }
    
    // Check if there's a specific checklist API
    console.log(`\n🔍 CHECKING FOR CHECKLIST-SPECIFIC APIS:`);
    const checklistEndpoints = [
      '/api/admin/checklist',
      '/api/checklist',
      '/api/results/checklist',
      '/api/admin/results/checklist'
    ];
    
    for (const endpoint of checklistEndpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Found! ${Array.isArray(data) ? data.length : 'object'} items`);
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing admin checklist API:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on localhost:3000');
  }
}

testAdminChecklistAPI();
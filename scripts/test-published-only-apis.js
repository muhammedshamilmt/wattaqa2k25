require('dotenv').config({ path: '.env.local' });

async function testPublishedOnlyAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING PUBLISHED RESULTS ONLY APIs\n');
  
  try {
    // Test different API endpoints for published results
    const apiEndpoints = [
      '/api/grand-marks?category=all',
      '/api/grand-marks?category=arts',
      '/api/grand-marks?category=sports',
      '/api/grand-marks?status=published',
      '/api/results/status?status=published',
      '/api/results?status=published'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`\n🔍 Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'object'} items`);
          
          if (endpoint.includes('grand-marks') && Array.isArray(data) && data.length > 0) {
            const sample = data[0];
            console.log(`   Sample grand marks structure:`);
            console.log(`   - Team: ${sample.name} (${sample.teamCode})`);
            console.log(`   - Total: ${sample.points}`);
            console.log(`   - Arts: ${sample.artsPoints || 'N/A'}`);
            console.log(`   - Sports: ${sample.sportsPoints || 'N/A'}`);
            console.log(`   - Results: ${sample.results || 'N/A'}`);
          }
          
          if (endpoint.includes('results') && Array.isArray(data) && data.length > 0) {
            const sample = data[0];
            console.log(`   Sample result structure:`);
            console.log(`   - ID: ${sample._id}`);
            console.log(`   - Programme: ${sample.programmeId}`);
            console.log(`   - Status: ${sample.status}`);
            console.log(`   - First Place: ${sample.firstPlace?.length || 0} winners`);
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
    // Test if we can get published results by category
    console.log(`\n🎨 TESTING ARTS PUBLISHED RESULTS:`);
    const artsRes = await fetch(`${baseUrl}/api/grand-marks?category=arts`);
    if (artsRes.ok) {
      const artsData = await artsRes.json();
      console.log(`Arts grand marks: ${artsData.length} teams`);
      artsData.forEach(team => {
        console.log(`  - ${team.name}: ${team.points} arts points`);
      });
    }
    
    console.log(`\n⚽ TESTING SPORTS PUBLISHED RESULTS:`);
    const sportsRes = await fetch(`${baseUrl}/api/grand-marks?category=sports`);
    if (sportsRes.ok) {
      const sportsData = await sportsRes.json();
      console.log(`Sports grand marks: ${sportsData.length} teams`);
      sportsData.forEach(team => {
        console.log(`  - ${team.name}: ${team.points} sports points`);
      });
    }
    
    // Check if we can manually filter published results
    console.log(`\n📊 MANUAL PUBLISHED RESULTS FILTERING:`);
    const resultsRes = await fetch(`${baseUrl}/api/results/status?status=published`);
    const programmesRes = await fetch(`${baseUrl}/api/programmes`);
    
    if (resultsRes.ok && programmesRes.ok) {
      const [resultsData, programmesData] = await Promise.all([
        resultsRes.json(),
        programmesRes.json()
      ]);
      
      const artsResults = resultsData.filter(result => {
        const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.category === 'arts';
      });
      
      const sportsResults = resultsData.filter(result => {
        const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.category === 'sports';
      });
      
      console.log(`Published results breakdown:`);
      console.log(`  - Total published: ${resultsData.length}`);
      console.log(`  - Arts published: ${artsResults.length}`);
      console.log(`  - Sports published: ${sportsResults.length}`);
      
      // Sample arts and sports results
      if (artsResults.length > 0) {
        console.log(`\nSample arts result:`);
        const sample = artsResults[0];
        const programme = programmesData.find(p => p._id?.toString() === sample.programmeId?.toString());
        console.log(`  - Programme: ${programme?.name}`);
        console.log(`  - Category: ${programme?.category}`);
        console.log(`  - Winners: ${sample.firstPlace?.length || 0} first place`);
      }
      
      if (sportsResults.length > 0) {
        console.log(`\nSample sports result:`);
        const sample = sportsResults[0];
        const programme = programmesData.find(p => p._id?.toString() === sample.programmeId?.toString());
        console.log(`  - Programme: ${programme?.name}`);
        console.log(`  - Category: ${programme?.category}`);
        console.log(`  - Winners: ${sample.firstPlace?.length || 0} first place`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing published APIs:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on localhost:3000');
  }
}

testPublishedOnlyAPIs();
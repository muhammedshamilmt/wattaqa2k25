const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Debugging Public Results Grand Marks Issue...\n');

async function testAPIs() {
  try {
    console.log('📡 Testing API Endpoints...\n');
    
    // Test grand-marks API
    console.log('1. Testing Grand Marks API:');
    try {
      const grandMarksResponse = await fetch('http://localhost:3000/api/grand-marks?category=all');
      const grandMarksData = await grandMarksResponse.json();
      
      console.log('✅ Grand Marks API Response:');
      console.log(`   Status: ${grandMarksResponse.status}`);
      console.log(`   Teams found: ${grandMarksData.length}`);
      
      if (grandMarksData.length > 0) {
        grandMarksData.forEach((team, index) => {
          console.log(`   ${index + 1}. ${team.name} (${team.teamCode}): ${team.points} points`);
          console.log(`      Arts: ${team.artsPoints}, Sports: ${team.sportsPoints}`);
          console.log(`      Results: ${team.results}, Color: ${team.color}`);
        });
      } else {
        console.log('   ⚠️  No team data returned from grand-marks API');
      }
    } catch (error) {
      console.log('❌ Grand Marks API Error:', error.message);
    }
    
    console.log('\n2. Testing Published Results API:');
    try {
      const publishedResponse = await fetch('http://localhost:3000/api/results/status?status=published');
      const publishedData = await publishedResponse.json();
      
      console.log('✅ Published Results API Response:');
      console.log(`   Status: ${publishedResponse.status}`);
      console.log(`   Published results: ${publishedData.length}`);
      
      if (publishedData.length > 0) {
        const sampleResult = publishedData[0];
        console.log('   Sample result structure:');
        console.log(`   - Programme ID: ${sampleResult.programmeId}`);
        console.log(`   - Status: ${sampleResult.status}`);
        console.log(`   - First Place: ${sampleResult.firstPlace?.length || 0} winners`);
        console.log(`   - Second Place: ${sampleResult.secondPlace?.length || 0} winners`);
        console.log(`   - Third Place: ${sampleResult.thirdPlace?.length || 0} winners`);
        console.log(`   - Team Winners: ${(sampleResult.firstPlaceTeams?.length || 0) + (sampleResult.secondPlaceTeams?.length || 0) + (sampleResult.thirdPlaceTeams?.length || 0)}`);
      } else {
        console.log('   ⚠️  No published results found');
      }
    } catch (error) {
      console.log('❌ Published Results API Error:', error.message);
    }
    
    console.log('\n3. Testing Teams API:');
    try {
      const teamsResponse = await fetch('http://localhost:3000/api/teams');
      const teamsData = await teamsResponse.json();
      
      console.log('✅ Teams API Response:');
      console.log(`   Status: ${teamsResponse.status}`);
      console.log(`   Teams found: ${teamsData.length}`);
      
      teamsData.forEach(team => {
        console.log(`   - ${team.name} (${team.code}): Color ${team.color || 'not set'}`);
      });
    } catch (error) {
      console.log('❌ Teams API Error:', error.message);
    }
    
    console.log('\n4. Testing Candidates API:');
    try {
      const candidatesResponse = await fetch('http://localhost:3000/api/candidates');
      const candidatesData = await candidatesResponse.json();
      
      console.log('✅ Candidates API Response:');
      console.log(`   Status: ${candidatesResponse.status}`);
      console.log(`   Candidates found: ${candidatesData.length}`);
      
      // Check team distribution
      const teamCounts = {};
      candidatesData.forEach(candidate => {
        const team = candidate.team || 'Unknown';
        teamCounts[team] = (teamCounts[team] || 0) + 1;
      });
      
      console.log('   Team distribution:');
      Object.entries(teamCounts).forEach(([team, count]) => {
        console.log(`   - ${team}: ${count} candidates`);
      });
    } catch (error) {
      console.log('❌ Candidates API Error:', error.message);
    }
    
    console.log('\n5. Testing Programmes API:');
    try {
      const programmesResponse = await fetch('http://localhost:3000/api/programmes');
      const programmesData = await programmesResponse.json();
      
      console.log('✅ Programmes API Response:');
      console.log(`   Status: ${programmesResponse.status}`);
      console.log(`   Programmes found: ${programmesData.length}`);
      
      // Check category distribution
      const categoryCounts = {};
      programmesData.forEach(programme => {
        const category = programme.category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      console.log('   Category distribution:');
      Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} programmes`);
      });
    } catch (error) {
      console.log('❌ Programmes API Error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

// Check results page implementation
function checkResultsPageImplementation() {
  console.log('\n📄 Checking Results Page Implementation...\n');
  
  try {
    const resultsPagePath = 'src/app/results/page.tsx';
    const resultsContent = fs.readFileSync(resultsPagePath, 'utf8');
    
    const checks = [
      {
        name: 'Uses grand-marks API',
        test: resultsContent.includes("fetch('/api/grand-marks?category=all')"),
        issue: 'Results page should fetch from grand-marks API'
      },
      {
        name: 'No hardcoded grand marks',
        test: !resultsContent.includes('const correctGrandMarks = ['),
        issue: 'Results page should not use hardcoded grand marks'
      },
      {
        name: 'Uses API response',
        test: resultsContent.includes('grandMarksResponse') && resultsContent.includes('setGrandMarksData'),
        issue: 'Results page should use API response for grand marks'
      },
      {
        name: 'Has fallback calculation',
        test: resultsContent.includes('calculateTeamMarksFromResults'),
        issue: 'Results page should have fallback calculation'
      },
      {
        name: 'Fetches published results',
        test: resultsContent.includes("fetch('/api/results?teamView=true')"),
        issue: 'Results page should fetch published results'
      }
    ];
    
    console.log('🔍 Results Page Implementation Checks:');
    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!check.test) {
        console.log(`   → Issue: ${check.issue}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking results page:', error.message);
  }
}

// Check grand-marks API implementation
function checkGrandMarksAPI() {
  console.log('\n🔧 Checking Grand Marks API Implementation...\n');
  
  try {
    const apiPath = 'src/app/api/grand-marks/route.ts';
    const apiContent = fs.readFileSync(apiPath, 'utf8');
    
    const checks = [
      {
        name: 'Fetches published results only',
        test: apiContent.includes("status: 'published'"),
        issue: 'API should only process published results'
      },
      {
        name: 'Uses candidate lookup',
        test: apiContent.includes('candidates.find'),
        issue: 'API should use candidate lookup for team assignment'
      },
      {
        name: 'Includes grade points',
        test: apiContent.includes('getGradePoints'),
        issue: 'API should include grade points in calculations'
      },
      {
        name: 'Separates arts and sports',
        test: apiContent.includes('artsPoints') && apiContent.includes('sportsPoints'),
        issue: 'API should separate arts and sports points'
      },
      {
        name: 'Sorts by total points',
        test: apiContent.includes('sort((a, b) => b.points - a.points)'),
        issue: 'API should sort teams by total points'
      }
    ];
    
    console.log('🔍 Grand Marks API Implementation Checks:');
    checks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!check.test) {
        console.log(`   → Issue: ${check.issue}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking grand marks API:', error.message);
  }
}

async function main() {
  console.log('🏆 Public Results Grand Marks Debug Tool\n');
  console.log('This tool will help identify issues with team leaderboard and published results.\n');
  
  // Check implementations first
  checkResultsPageImplementation();
  checkGrandMarksAPI();
  
  // Test APIs if server is running
  console.log('\n🚀 Testing Live APIs (requires running server)...');
  console.log('If APIs fail, make sure your development server is running on localhost:3000\n');
  
  await testAPIs();
  
  console.log('\n📋 Summary and Recommendations:');
  console.log('1. Ensure all APIs return correct data structure');
  console.log('2. Verify published results have proper team assignments');
  console.log('3. Check that grade points are being calculated correctly');
  console.log('4. Confirm team colors are set properly');
  console.log('5. Make sure results page uses API data instead of hardcoded values');
  
  console.log('\n✅ Debug completed! Check the output above for specific issues.');
}

main().catch(console.error);
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Debugging Grand Marks Discrepancy...\n');

async function compareGrandMarks() {
  try {
    console.log('📊 Expected vs Actual Grand Marks Comparison\n');
    
    // Your expected data
    const expectedData = {
      arts: {
        SMD: { points: 759, rank: 1 },
        INT: { points: 754, rank: 2 },
        AQS: { points: 716, rank: 3 }
      },
      sports: {
        SMD: { points: 143, rank: 1 },
        INT: { points: 141, rank: 2 },
        AQS: { points: 137, rank: 3 }
      }
    };
    
    console.log('🎯 Expected Grand Marks (Your Data):');
    console.log('Arts Rankings:');
    console.log(`  1. SMD: ${expectedData.arts.SMD.points} points 🥇`);
    console.log(`  2. INT: ${expectedData.arts.INT.points} points 🥈`);
    console.log(`  3. AQS: ${expectedData.arts.AQS.points} points 🥉`);
    
    console.log('\nSports Rankings:');
    console.log(`  1. SMD: ${expectedData.sports.SMD.points} points 🥇`);
    console.log(`  2. INT: ${expectedData.sports.INT.points} points 🥈`);
    console.log(`  3. AQS: ${expectedData.sports.AQS.points} points 🥉`);
    
    // Test different API endpoints
    console.log('\n🔧 Testing API Endpoints...\n');
    
    // Test grand-marks API with different categories
    const apiTests = [
      { endpoint: '/api/grand-marks?category=all', name: 'All Categories' },
      { endpoint: '/api/grand-marks?category=arts', name: 'Arts Only' },
      { endpoint: '/api/grand-marks?category=sports', name: 'Sports Only' }
    ];
    
    for (const test of apiTests) {
      try {
        console.log(`📡 Testing ${test.name}: ${test.endpoint}`);
        const response = await fetch(`http://localhost:3000${test.endpoint}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          console.log(`  Status: ${response.status} ✅`);
          data.forEach((team, index) => {
            console.log(`  ${index + 1}. ${team.teamCode}: ${team.points} points (Arts: ${team.artsPoints}, Sports: ${team.sportsPoints})`);
          });
        } else {
          console.log(`  Status: ${response.status} ❌ No data returned`);
        }
        console.log('');
      } catch (error) {
        console.log(`  Error: ${error.message} ❌`);
      }
    }
    
    // Test admin checklist API for comparison
    try {
      console.log('📋 Testing Admin Checklist API for comparison...');
      const checklistResponse = await fetch('http://localhost:3000/api/admin/checklist');
      const checklistData = await checklistResponse.json();
      
      if (checklistData && checklistData.teamTotals) {
        console.log('Admin Checklist Team Totals:');
        Object.entries(checklistData.teamTotals).forEach(([teamCode, data]) => {
          console.log(`  ${teamCode}: Total ${data.totalPoints} (Arts: ${data.artsPoints}, Sports: ${data.sportsPoints})`);
        });
      }
      console.log('');
    } catch (error) {
      console.log(`Admin Checklist API Error: ${error.message}`);
    }
    
    // Check published results count
    try {
      console.log('📄 Checking Published Results...');
      const resultsResponse = await fetch('http://localhost:3000/api/results/status?status=published');
      const resultsData = await resultsResponse.json();
      
      console.log(`Published Results Count: ${resultsData.length}`);
      
      // Analyze results by category
      const categoryBreakdown = {};
      resultsData.forEach(result => {
        // We need to fetch programme data to categorize
        const category = result.programmeCategory || 'unknown';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      });
      
      console.log('Results by Category:');
      Object.entries(categoryBreakdown).forEach(([category, count]) => {
        console.log(`  ${category}: ${count} results`);
      });
      console.log('');
    } catch (error) {
      console.log(`Published Results Error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Error in comparison:', error.message);
  }
}

async function analyzeCalculationMethod() {
  console.log('🧮 Analyzing Calculation Methods...\n');
  
  try {
    // Read the grand-marks API implementation
    const grandMarksApiPath = 'src/app/api/grand-marks/route.ts';
    const grandMarksContent = fs.readFileSync(grandMarksApiPath, 'utf8');
    
    console.log('🔍 Grand Marks API Analysis:');
    
    const analysisChecks = [
      {
        name: 'Uses published results only',
        test: grandMarksContent.includes("status: 'published'"),
        details: 'API filters for published results'
      },
      {
        name: 'Uses candidate lookup for teams',
        test: grandMarksContent.includes('candidates.find'),
        details: 'API uses candidate data to determine team membership'
      },
      {
        name: 'Includes grade points',
        test: grandMarksContent.includes('getGradePoints'),
        details: 'API adds grade points to position points'
      },
      {
        name: 'Default points system',
        test: grandMarksContent.includes('firstPoints || 5') && grandMarksContent.includes('secondPoints || 3'),
        details: 'API uses default points: 1st=5, 2nd=3, 3rd=1'
      },
      {
        name: 'Separates arts and sports',
        test: grandMarksContent.includes('programme.category === \'arts\'') && grandMarksContent.includes('programme.category === \'sports\''),
        details: 'API separates points by programme category'
      }
    ];
    
    analysisChecks.forEach(check => {
      const status = check.test ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.details}`);
    });
    
    console.log('\n🤔 Possible Discrepancy Sources:');
    console.log('1. Different calculation methods between admin and public APIs');
    console.log('2. Different published results being processed');
    console.log('3. Different grade points calculation');
    console.log('4. Different team assignment logic');
    console.log('5. Cached vs live data');
    
  } catch (error) {
    console.error('Error analyzing calculation method:', error.message);
  }
}

async function testSpecificTeamCalculation() {
  console.log('\n🎯 Testing Specific Team Calculation...\n');
  
  try {
    // Fetch all required data
    const [resultsRes, candidatesRes, programmesRes] = await Promise.all([
      fetch('http://localhost:3000/api/results/status?status=published'),
      fetch('http://localhost:3000/api/candidates'),
      fetch('http://localhost:3000/api/programmes')
    ]);
    
    const [results, candidates, programmes] = await Promise.all([
      resultsRes.json(),
      candidatesRes.json(),
      programmesRes.json()
    ]);
    
    console.log('📊 Manual Calculation for Team SMD:');
    
    let smdArtsPoints = 0;
    let smdSportsPoints = 0;
    let smdArtsResults = 0;
    let smdSportsResults = 0;
    
    // Get SMD candidates
    const smdCandidates = candidates.filter(c => c.team === 'SMD');
    console.log(`SMD Candidates: ${smdCandidates.length}`);
    
    // Process each published result
    results.forEach(result => {
      const programme = programmes.find(p => p._id.toString() === result.programmeId?.toString());
      if (!programme) return;
      
      let teamPointsFromResult = 0;
      
      // Check individual winners
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, index) => {
        const positionPoints = [5, 3, 1][index]; // Default points
        result[position]?.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team === 'SMD') {
            const gradePoints = getGradePoints(winner.grade || '');
            teamPointsFromResult += positionPoints + gradePoints;
          }
        });
      });
      
      // Check team winners
      ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, index) => {
        const positionPoints = [5, 3, 1][index];
        result[position]?.forEach(winner => {
          if (winner.teamCode === 'SMD') {
            const gradePoints = getGradePoints(winner.grade || '');
            teamPointsFromResult += positionPoints + gradePoints;
          }
        });
      });
      
      if (teamPointsFromResult > 0) {
        if (programme.category === 'arts') {
          smdArtsPoints += teamPointsFromResult;
          smdArtsResults++;
        } else if (programme.category === 'sports') {
          smdSportsPoints += teamPointsFromResult;
          smdSportsResults++;
        }
      }
    });
    
    console.log(`Manual SMD Calculation:`);
    console.log(`  Arts: ${smdArtsPoints} points from ${smdArtsResults} results`);
    console.log(`  Sports: ${smdSportsPoints} points from ${smdSportsResults} results`);
    console.log(`  Total: ${smdArtsPoints + smdSportsPoints} points`);
    
    console.log(`\nExpected SMD (Your Data):`);
    console.log(`  Arts: 759 points`);
    console.log(`  Sports: 143 points`);
    console.log(`  Total: 902 points`);
    
    console.log(`\nDiscrepancy:`);
    console.log(`  Arts: ${759 - smdArtsPoints} points difference`);
    console.log(`  Sports: ${143 - smdSportsPoints} points difference`);
    
  } catch (error) {
    console.error('Error in manual calculation:', error.message);
  }
}

// Grade points function (same as API)
function getGradePoints(grade) {
  switch (grade) {
    case 'A+': return 10;
    case 'A': return 9;
    case 'A-': return 8;
    case 'B+': return 7;
    case 'B': return 6;
    case 'B-': return 5;
    case 'C+': return 4;
    case 'C': return 3;
    case 'C-': return 2;
    case 'D+': return 1;
    case 'D': return 0.5;
    case 'D-': return 0.25;
    case 'E+': return 0.1;
    case 'E': return 0.05;
    case 'E-': return 0.01;
    case 'F': return 0;
    default: return 0;
  }
}

async function main() {
  console.log('🏆 Grand Marks Discrepancy Analysis Tool\n');
  console.log('This tool will help identify why the grand marks don\'t match your expected values.\n');
  
  await compareGrandMarks();
  await analyzeCalculationMethod();
  await testSpecificTeamCalculation();
  
  console.log('\n📋 Recommendations:');
  console.log('1. Check if there are different calculation methods being used');
  console.log('2. Verify that all published results are being processed');
  console.log('3. Ensure grade points are calculated consistently');
  console.log('4. Check if there are cached values somewhere');
  console.log('5. Compare with admin checklist calculations');
  
  console.log('\n✅ Analysis completed! Check the output above for discrepancies.');
}

main().catch(console.error);
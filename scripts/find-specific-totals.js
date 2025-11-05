require('dotenv').config({ path: '.env.local' });

async function findSpecificTotals() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 FINDING SPECIFIC TOTALS: INT(544), SMD(432), AQS(424)\n');
  
  try {
    // Test various APIs to find where these specific numbers come from
    const apiEndpoints = [
      '/api/grand-marks?category=all',
      '/api/grand-marks?category=arts',
      '/api/grand-marks?category=sports',
      '/api/grand-marks?status=published',
      '/api/grand-marks?filter=arts-total',
      '/api/grand-marks?view=filtered',
      '/api/results/summary',
      '/api/results/marks-summary'
    ];
    
    console.log('🔍 Testing different APIs to find the specific totals...\n');
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'object'} items`);
          
          if (Array.isArray(data) && data.length > 0) {
            const hasTargetNumbers = data.some(team => 
              team.points === 544 || team.points === 432 || team.points === 424 ||
              team.artsPoints === 544 || team.artsPoints === 432 || team.artsPoints === 424
            );
            
            if (hasTargetNumbers) {
              console.log(`🎯 FOUND TARGET NUMBERS in ${endpoint}:`);
              data.forEach(team => {
                if (team.points === 544 || team.points === 432 || team.points === 424 ||
                    team.artsPoints === 544 || team.artsPoints === 432 || team.artsPoints === 424) {
                  console.log(`  ⭐ ${team.name} (${team.teamCode}): ${team.points} total, ${team.artsPoints || 'N/A'} arts, ${team.sportsPoints || 'N/A'} sports`);
                }
              });
            } else {
              // Show what we got instead
              data.slice(0, 3).forEach(team => {
                console.log(`  - ${team.name} (${team.teamCode}): ${team.points} total, ${team.artsPoints || 'N/A'} arts, ${team.sportsPoints || 'N/A'} sports`);
              });
            }
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ ${endpoint}: Error`);
      }
    }
    
    // Check if there's a specific filter or parameter that gives these numbers
    console.log('🔍 Testing specific parameters that might give the target numbers...\n');
    
    const specificTests = [
      '/api/grand-marks?category=arts&filter=total',
      '/api/grand-marks?category=arts&view=summary',
      '/api/grand-marks?category=arts&type=filtered',
      '/api/grand-marks?status=checked',
      '/api/grand-marks?status=published&filter=arts',
      '/api/results/published-summary',
      '/api/results/arts-summary'
    ];
    
    for (const endpoint of specificTests) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Found data`);
          
          if (Array.isArray(data)) {
            const hasTargetNumbers = data.some(team => 
              team.points === 544 || team.points === 432 || team.points === 424
            );
            
            if (hasTargetNumbers) {
              console.log(`🎯 FOUND TARGET NUMBERS in ${endpoint}:`);
              data.forEach(team => {
                console.log(`  ⭐ ${team.name} (${team.teamCode}): ${team.points} points`);
              });
            }
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error`);
      }
    }
    
    // Manual calculation to see if we can get these numbers
    console.log('\n🔍 MANUAL CALCULATION TO FIND TARGET NUMBERS...\n');
    
    const resultsRes = await fetch(`${baseUrl}/api/results/status?status=published`);
    const programmesRes = await fetch(`${baseUrl}/api/programmes`);
    const candidatesRes = await fetch(`${baseUrl}/api/candidates`);
    const teamsRes = await fetch(`${baseUrl}/api/teams`);
    
    if (resultsRes.ok && programmesRes.ok && candidatesRes.ok && teamsRes.ok) {
      const [resultsData, programmesData, candidatesData, teamsData] = await Promise.all([
        resultsRes.json(),
        programmesRes.json(),
        candidatesRes.json(),
        teamsRes.json()
      ]);
      
      // Try different filtering approaches
      const filterApproaches = [
        { name: 'All Arts Results', filter: (result, programme) => programme.category === 'arts' },
        { name: 'Arts Stage Only', filter: (result, programme) => programme.category === 'arts' && programme.subcategory === 'stage' },
        { name: 'Arts Non-Stage Only', filter: (result, programme) => programme.category === 'arts' && programme.subcategory === 'non-stage' },
        { name: 'Published Arts Only', filter: (result, programme) => programme.category === 'arts' && result.status === 'published' },
        { name: 'Checked Arts Results', filter: (result, programme) => programme.category === 'arts' && result.status === 'checked' }
      ];
      
      for (const approach of filterApproaches) {
        console.log(`\n📊 Testing: ${approach.name}`);
        
        const teamTotals = { INT: 0, SMD: 0, AQS: 0 };
        
        resultsData.forEach(result => {
          const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
          if (!programme || !approach.filter(result, programme)) return;
          
          // Process individual winners
          ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, index) => {
            const points = [result.firstPoints || 0, result.secondPoints || 0, result.thirdPoints || 0][index];
            
            if (result[position]) {
              result[position].forEach(winner => {
                const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                if (teamCode && teamTotals[teamCode] !== undefined) {
                  const gradePoints = getGradePoints(winner.grade || '');
                  teamTotals[teamCode] += points + gradePoints;
                }
              });
            }
          });
          
          // Process team winners
          ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, index) => {
            const points = [result.firstPoints || 0, result.secondPoints || 0, result.thirdPoints || 0][index];
            
            if (result[position]) {
              result[position].forEach(winner => {
                if (teamTotals[winner.teamCode] !== undefined) {
                  const gradePoints = getGradePoints(winner.grade || '');
                  teamTotals[winner.teamCode] += points + gradePoints;
                }
              });
            }
          });
        });
        
        console.log(`Results:`);
        Object.entries(teamTotals).forEach(([code, points]) => {
          const isTarget = points === 544 || points === 432 || points === 424;
          console.log(`  ${code}: ${points} points ${isTarget ? '🎯 TARGET!' : ''}`);
        });
        
        // Check if this matches our target
        if (teamTotals.INT === 544 && teamTotals.SMD === 432 && teamTotals.AQS === 424) {
          console.log(`\n🎯 FOUND EXACT MATCH: ${approach.name}`);
          console.log(`This is the calculation method that gives the target numbers!`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding specific totals:', error.message);
  }
}

// Helper functions
function getTeamCodeFromChestNumber(chestNumber) {
  if (!chestNumber) return '';
  const upperChestNumber = chestNumber.toUpperCase();
  
  const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
  if (threeLetterMatch) return threeLetterMatch[1];
  
  const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
  if (twoLetterMatch) {
    const teamCode = twoLetterMatch[1];
    if (teamCode === 'SM') return 'SMD';
    if (teamCode === 'IN') return 'INT';
    if (teamCode === 'AQ') return 'AQS';
    return teamCode;
  }
  
  const num = parseInt(chestNumber);
  if (!isNaN(num)) {
    if (num >= 600 && num < 700) return 'AQS';
    if (num >= 400 && num < 500) return 'INT';
    if (num >= 200 && num < 300) return 'SMD';
  }
  
  return '';
}

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

findSpecificTotals();
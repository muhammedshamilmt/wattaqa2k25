require('dotenv').config({ path: '.env.local' });

async function checkAdminResultsAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 CHECKING ADMIN RESULTS APIs FOR SPECIFIC TOTALS\n');
  
  try {
    // Test admin-specific APIs that might have the target numbers
    const adminEndpoints = [
      '/api/admin/results',
      '/api/admin/marks-summary',
      '/api/admin/checklist',
      '/api/results?status=checked',
      '/api/results?view=admin',
      '/api/results?filter=checklist',
      '/api/grand-marks?status=checked',
      '/api/grand-marks?view=admin',
      '/api/grand-marks?filter=checklist'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'object'} items`);
          
          if (Array.isArray(data) && data.length > 0) {
            // Check if any team has the target numbers
            const hasTargetNumbers = data.some(team => 
              team.points === 544 || team.points === 432 || team.points === 424 ||
              team.artsPoints === 544 || team.artsPoints === 432 || team.artsPoints === 424 ||
              team.totalMarks === 544 || team.totalMarks === 432 || team.totalMarks === 424
            );
            
            if (hasTargetNumbers) {
              console.log(`🎯 FOUND TARGET NUMBERS in ${endpoint}:`);
              data.forEach(team => {
                const points = team.points || team.artsPoints || team.totalMarks || 0;
                if (points === 544 || points === 432 || points === 424) {
                  console.log(`  ⭐ ${team.name || team.teamName} (${team.teamCode}): ${points} points`);
                }
              });
            } else {
              // Show sample data
              data.slice(0, 3).forEach(team => {
                const points = team.points || team.artsPoints || team.totalMarks || 0;
                console.log(`  - ${team.name || team.teamName || 'Unknown'} (${team.teamCode || 'N/A'}): ${points} points`);
              });
            }
          }
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
    
    // Check if there's a specific calculation that gives these numbers
    console.log('🔍 TRYING DIFFERENT CALCULATION METHODS...\n');
    
    // Maybe it's a specific subset of results or a different status
    const resultsRes = await fetch(`${baseUrl}/api/results`); // All results, not just published
    const programmesRes = await fetch(`${baseUrl}/api/programmes`);
    const candidatesRes = await fetch(`${baseUrl}/api/candidates`);
    
    if (resultsRes.ok && programmesRes.ok && candidatesRes.ok) {
      const [allResults, programmesData, candidatesData] = await Promise.all([
        resultsRes.json(),
        programmesRes.json(),
        candidatesRes.json()
      ]);
      
      console.log(`📊 Total results in database: ${allResults.length}`);
      
      // Group results by status
      const resultsByStatus = {};
      allResults.forEach(result => {
        const status = result.status || 'unknown';
        if (!resultsByStatus[status]) resultsByStatus[status] = [];
        resultsByStatus[status].push(result);
      });
      
      console.log('Results by status:');
      Object.entries(resultsByStatus).forEach(([status, results]) => {
        console.log(`  - ${status}: ${results.length} results`);
      });
      
      // Try calculating with different statuses
      const statusesToTry = ['checked', 'published', 'draft', 'pending'];
      
      for (const status of statusesToTry) {
        if (!resultsByStatus[status]) continue;
        
        console.log(`\n📊 Calculating with ${status} results (${resultsByStatus[status].length} results):`);
        
        const teamTotals = { INT: 0, SMD: 0, AQS: 0 };
        
        resultsByStatus[status].forEach(result => {
          const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
          if (!programme || programme.category !== 'arts') return; // Only arts for now
          
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
        
        console.log(`Arts totals with ${status} results:`);
        Object.entries(teamTotals).forEach(([code, points]) => {
          const isTarget = points === 544 || points === 432 || points === 424;
          console.log(`  ${code}: ${points} points ${isTarget ? '🎯 TARGET FOUND!' : ''}`);
        });
        
        // Check if this matches our target
        if (teamTotals.INT === 544 && teamTotals.SMD === 432 && teamTotals.AQS === 424) {
          console.log(`\n🎯 EXACT MATCH FOUND: ${status} arts results give the target numbers!`);
          return; // Found it!
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking admin APIs:', error.message);
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

checkAdminResultsAPIs();
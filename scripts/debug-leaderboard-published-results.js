require('dotenv').config({ path: '.env.local' });

async function debugLeaderboardPublishedResults() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 DEBUGGING LEADERBOARD PUBLISHED RESULTS ISSUE\n');
  
  try {
    // Test what the leaderboard APIs are returning
    console.log('📊 Testing Grand Marks API...');
    const grandMarksRes = await fetch(`${baseUrl}/api/grand-marks?category=all`);
    if (grandMarksRes.ok) {
      const grandMarksData = await grandMarksRes.json();
      console.log(`✅ Grand marks API returned ${grandMarksData.length} teams:`);
      grandMarksData.forEach(team => {
        console.log(`  - ${team.name} (${team.teamCode}): ${team.points} total points`);
        console.log(`    Arts: ${team.artsPoints || 'N/A'}, Sports: ${team.sportsPoints || 'N/A'}`);
        console.log(`    Results: ${team.results || 'N/A'}`);
      });
    } else {
      console.log(`❌ Grand marks API failed: ${grandMarksRes.status}`);
    }
    
    console.log('\n🔍 What leaderboard is currently using (hardcoded):');
    const hardcodedData = [
      {
        teamCode: 'INT',
        name: 'Team Inthifada',
        points: 659, // Total: 544 (Arts) + 115 (Sports)
        artsPoints: 544, // Correct arts points from admin checklist
        sportsPoints: 115,
        results: 50,
        color: '#EF4444',
        rank: 1,
        change: 0
      },
      {
        teamCode: 'SMD',
        name: 'Team Sumud',
        points: 550, // Total: 432 (Arts) + 118 (Sports)
        artsPoints: 432, // Correct arts points from admin checklist
        sportsPoints: 118,
        results: 45,
        color: '#10B981',
        rank: 2,
        change: 0
      },
      {
        teamCode: 'AQS',
        name: 'Team Aqsa',
        points: 542, // Total: 424 (Arts) + 118 (Sports)
        artsPoints: 424, // Correct arts points from admin checklist
        sportsPoints: 118,
        results: 42,
        color: '#6B7280',
        rank: 3,
        change: 0
      }
    ];
    
    hardcodedData.forEach(team => {
      console.log(`  - ${team.name} (${team.teamCode}): ${team.points} total points`);
      console.log(`    Arts: ${team.artsPoints}, Sports: ${team.sportsPoints}`);
      console.log(`    Results: ${team.results}`);
    });
    
    console.log('\n📋 Testing Published Results API...');
    const resultsRes = await fetch(`${baseUrl}/api/results?status=published`);
    if (resultsRes.ok) {
      const resultsData = await resultsRes.json();
      console.log(`✅ Published results API returned ${resultsData.length} results`);
      
      // Count results by team
      const teamResultCounts = {};
      resultsData.forEach(result => {
        // Count individual winners
        ['firstPlace', 'secondPlace', 'thirdPlace'].forEach(position => {
          if (result[position]) {
            result[position].forEach(winner => {
              const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
              if (teamCode) {
                teamResultCounts[teamCode] = (teamResultCounts[teamCode] || 0) + 1;
              }
            });
          }
        });
        
        // Count team winners
        ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach(position => {
          if (result[position]) {
            result[position].forEach(winner => {
              const teamCode = winner.teamCode;
              if (teamCode) {
                teamResultCounts[teamCode] = (teamResultCounts[teamCode] || 0) + 1;
              }
            });
          }
        });
      });
      
      console.log('\nActual published results count by team:');
      Object.entries(teamResultCounts).forEach(([teamCode, count]) => {
        console.log(`  - ${teamCode}: ${count} results`);
      });
    } else {
      console.log(`❌ Published results API failed: ${resultsRes.status}`);
    }
    
    console.log('\n🔍 ISSUE ANALYSIS:');
    console.log('The leaderboard is using hardcoded team data instead of the actual API data!');
    console.log('This means:');
    console.log('  ❌ Team points are not reflecting real published results');
    console.log('  ❌ Results count is hardcoded and not dynamic');
    console.log('  ❌ Points breakdown (arts/sports) is not from actual calculations');
    console.log('\n💡 SOLUTION:');
    console.log('Replace hardcoded team data with actual grand marks API data');
    
  } catch (error) {
    console.error('❌ Error testing leaderboard:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on localhost:3000');
  }
}

// Helper function to get team code from chest number
function getTeamCodeFromChestNumber(chestNumber) {
  if (!chestNumber) return '';

  const upperChestNumber = chestNumber.toUpperCase();

  const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
  if (threeLetterMatch) {
    return threeLetterMatch[1];
  }

  const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
  if (twoLetterMatch) {
    const teamCode = twoLetterMatch[1];
    if (teamCode === 'SM') return 'SMD';
    if (teamCode === 'IN') return 'INT';
    if (teamCode === 'AQ') return 'AQS';
    return teamCode;
  }

  if (upperChestNumber.match(/^[A-Z]/)) {
    return upperChestNumber.charAt(0);
  }

  const num = parseInt(chestNumber);
  if (!isNaN(num)) {
    if (num >= 600 && num < 700) {
      return 'AQS';
    } else if (num >= 400 && num < 500) {
      return 'INT';
    } else if (num >= 200 && num < 300) {
      return 'SMD';
    }
  }

  return '';
}

debugLeaderboardPublishedResults();
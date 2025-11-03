const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Helper function to extract team code from chest number
function getTeamCodeFromChestNumber(chestNumber) {
  if (!chestNumber) return '';
  
  const upperChestNumber = chestNumber.toUpperCase();
  
  // Method 1: Check if it starts with 3 letters (like SMD001, INT001, AQS001)
  const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
  if (threeLetterMatch) {
    return threeLetterMatch[1];
  }
  
  // Method 2: Check if it starts with 2 letters (like SM001, IN001, AQ001)
  const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
  if (twoLetterMatch) {
    const teamCode = twoLetterMatch[1];
    // Map 2-letter codes to 3-letter team codes
    if (teamCode === 'SM') return 'SMD';
    if (teamCode === 'IN') return 'INT';
    if (teamCode === 'AQ') return 'AQS';
    return teamCode;
  }
  
  // Method 3: Single letter (like A001, B002) 
  if (upperChestNumber.match(/^[A-Z]/)) {
    return upperChestNumber.charAt(0);
  }
  
  // Method 4: Pure numbers (like 605, 402, 211) - map to teams
  const num = parseInt(chestNumber);
  if (!isNaN(num)) {
    if (num >= 600 && num < 700) {
      return 'AQS'; // Team 6xx = AQS (AQSA)
    } else if (num >= 400 && num < 500) {
      return 'INT'; // Team 4xx = INT (INTIFADA)  
    } else if (num >= 200 && num < 300) {
      return 'SMD'; // Team 2xx = SMD (SUMUD)
    } else if (num >= 100 && num < 200) {
      return 'A'; // Team 1xx = Team A
    } else {
      // Default mapping based on first digit
      return chestNumber.charAt(0);
    }
  }
  
  return '';
}

async function explainPublishedSummaryCalculations() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 EXPLAINING PUBLISHED SUMMARY CALCULATIONS\n');
    
    const db = client.db('wattaqa-festival-2k25');
    
    // Get published results and teams
    const publishedResults = await db.collection('results').find({ status: 'published' }).toArray();
    const teams = await db.collection('teams').find({}).toArray();
    
    console.log('🎯 CURRENT CALCULATIONS ANALYSIS:');
    console.log('=====================================\n');
    
    // 1. Published Programmes Count
    console.log(`📊 Published Programmes: ${publishedResults.length}`);
    console.log('   → This counts unique programmes that have been published\n');
    
    // 2. Total Points Calculation
    let totalPoints = 0;
    publishedResults.forEach(result => {
      const firstCount = (result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0);
      const secondCount = (result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0);
      const thirdCount = (result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0);
      
      totalPoints += (firstCount * result.firstPoints) + (secondCount * result.secondPoints) + (thirdCount * result.thirdPoints);
    });
    
    console.log(`🎯 Total Points: ${Math.round(totalPoints)}`);
    console.log('   → Sum of all position points awarded (excluding grade bonuses)');
    console.log('   → Formula: (1st place winners × 1st points) + (2nd place winners × 2nd points) + (3rd place winners × 3rd points)\n');
    
    // 3. Participants Count
    const uniqueParticipants = new Set();
    publishedResults.forEach(result => {
      result.firstPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
      result.secondPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
      result.thirdPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
    });
    
    console.log(`👥 Participants: ${uniqueParticipants.size}`);
    console.log('   → Number of unique individuals who won prizes (1st, 2nd, 3rd place)');
    console.log('   → Excludes: Team results, participation grades, non-winners\n');
    
    // 4. Team Programme Counts (Current - Problematic)
    console.log('🏆 TEAM PROGRAMME COUNTS (CURRENT - CONFUSING):');
    console.log('================================================\n');
    
    const teamEarningsOld = {};
    teams.forEach(team => {
      teamEarningsOld[team.code] = { name: team.name, programmes: 0 };
    });
    
    // Current method (counts each result)
    publishedResults.forEach(result => {
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamEarningsOld[teamCode]) {
            teamEarningsOld[teamCode].programmes += 1;
          }
        });
      }
      
      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamEarningsOld[teamCode]) {
            teamEarningsOld[teamCode].programmes += 1;
          }
        });
      }
      
      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamEarningsOld[teamCode]) {
            teamEarningsOld[teamCode].programmes += 1;
          }
        });
      }
      
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamEarningsOld[winner.teamCode]) {
            teamEarningsOld[winner.teamCode].programmes += 1;
          }
        });
      }
      
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamEarningsOld[winner.teamCode]) {
            teamEarningsOld[winner.teamCode].programmes += 1;
          }
        });
      }
      
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamEarningsOld[winner.teamCode]) {
            teamEarningsOld[winner.teamCode].programmes += 1;
          }
        });
      }
    });
    
    Object.keys(teamEarningsOld).forEach(teamCode => {
      const team = teamEarningsOld[teamCode];
      console.log(`   ${teamCode} (${team.name}): ${team.programmes} programmes`);
    });
    
    console.log('\n❌ PROBLEM: These numbers can be higher than total published programmes (23)');
    console.log('   → Counts each result/winner separately, not unique programmes\n');
    
    // 5. Team Programme Counts (Fixed - Correct)
    console.log('🏆 TEAM PROGRAMME COUNTS (FIXED - CORRECT):');
    console.log('===========================================\n');
    
    const teamEarningsNew = {};
    const teamProgrammes = {};
    
    teams.forEach(team => {
      teamEarningsNew[team.code] = { name: team.name, programmes: 0 };
      teamProgrammes[team.code] = new Set();
    });
    
    // New method (counts unique programmes)
    publishedResults.forEach(result => {
      const programmeId = result._id?.toString() || result.programmeId || '';
      
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamProgrammes[teamCode]) {
            teamProgrammes[teamCode].add(programmeId);
          }
        });
      }
      
      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamProgrammes[teamCode]) {
            teamProgrammes[teamCode].add(programmeId);
          }
        });
      }
      
      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamProgrammes[teamCode]) {
            teamProgrammes[teamCode].add(programmeId);
          }
        });
      }
      
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamProgrammes[winner.teamCode]) {
            teamProgrammes[winner.teamCode].add(programmeId);
          }
        });
      }
      
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamProgrammes[winner.teamCode]) {
            teamProgrammes[winner.teamCode].add(programmeId);
          }
        });
      }
      
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamProgrammes[winner.teamCode]) {
            teamProgrammes[winner.teamCode].add(programmeId);
          }
        });
      }
    });
    
    // Update counts with unique programmes
    Object.keys(teamEarningsNew).forEach(teamCode => {
      teamEarningsNew[teamCode].programmes = teamProgrammes[teamCode].size;
    });
    
    Object.keys(teamEarningsNew).forEach(teamCode => {
      const team = teamEarningsNew[teamCode];
      console.log(`   ${teamCode} (${team.name}): ${team.programmes} programmes`);
    });
    
    console.log('\n✅ FIXED: These numbers are now ≤ total published programmes (23)');
    console.log('   → Counts unique programmes each team participated in\n');
    
    // 6. Comparison
    console.log('📈 COMPARISON (OLD vs NEW):');
    console.log('===========================\n');
    
    Object.keys(teamEarningsOld).forEach(teamCode => {
      const oldCount = teamEarningsOld[teamCode].programmes;
      const newCount = teamEarningsNew[teamCode].programmes;
      const difference = oldCount - newCount;
      const team = teams.find(t => t.code === teamCode);
      
      console.log(`${teamCode} (${team?.name || 'Unknown'}):`);
      console.log(`   Old (confusing): ${oldCount} programmes`);
      console.log(`   New (correct): ${newCount} programmes`);
      console.log(`   Difference: ${difference} (${difference > 0 ? 'multiple results per programme' : 'no change'})\n`);
    });
    
    console.log('🎉 SUMMARY:');
    console.log('===========');
    console.log('✅ Published Programmes: Shows unique programmes published');
    console.log('✅ Total Points: Shows sum of position points awarded');
    console.log('✅ Participants: Shows unique individuals who won prizes');
    console.log('✅ Team Programmes: Now shows unique programmes per team (fixed)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

explainPublishedSummaryCalculations();
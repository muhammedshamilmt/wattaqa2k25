require('dotenv').config({ path: '.env.local' });

async function testResultsPageCalculation() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING RESULTS PAGE CALCULATION LOGIC\n');
  
  try {
    // Fetch the same data as results page
    const [teamsRes, resultsRes, candidatesRes, programmesRes] = await Promise.all([
      fetch(`${baseUrl}/api/teams`),
      fetch(`${baseUrl}/api/results?teamView=true`),
      fetch(`${baseUrl}/api/candidates`),
      fetch(`${baseUrl}/api/programmes`)
    ]);

    const [teamsData, resultsData, candidatesData, programmesData] = await Promise.all([
      teamsRes.json(),
      resultsRes.json(),
      candidatesRes.json(),
      programmesRes.json()
    ]);

    console.log(`📊 Data loaded:`);
    console.log(`  - ${teamsData.length} teams`);
    console.log(`  - ${resultsData.length} results`);
    console.log(`  - ${candidatesData.length} candidates`);
    console.log(`  - ${programmesData.length} programmes`);

    // Apply the same calculation logic as results page
    const calculatedTeamMarks = calculateTeamMarksFromResults(resultsData, teamsData, candidatesData, programmesData);

    console.log(`\n🏆 CALCULATED TEAM MARKS (Results Page Logic):`);
    calculatedTeamMarks.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (${team.teamCode})`);
      console.log(`   Total Points: ${team.points}`);
      console.log(`   Arts Points: ${team.artsPoints}`);
      console.log(`   Sports Points: ${team.sportsPoints}`);
      console.log(`   Results Count: ${team.results}`);
      console.log('---');
    });

    // Compare with grand marks API
    console.log(`\n📊 COMPARING WITH GRAND MARKS API:`);
    const grandMarksRes = await fetch(`${baseUrl}/api/grand-marks?category=all`);
    if (grandMarksRes.ok) {
      const grandMarksData = await grandMarksRes.json();
      
      console.log(`Grand Marks API data:`);
      grandMarksData.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} (${team.teamCode})`);
        console.log(`   Total Points: ${team.points}`);
        console.log(`   Arts Points: ${team.artsPoints || 'N/A'}`);
        console.log(`   Sports Points: ${team.sportsPoints || 'N/A'}`);
        console.log(`   Results Count: ${team.results || 'N/A'}`);
        console.log('---');
      });

      // Check if they match
      console.log(`\n🔍 COMPARISON ANALYSIS:`);
      calculatedTeamMarks.forEach(calcTeam => {
        const apiTeam = grandMarksData.find(t => t.teamCode === calcTeam.teamCode);
        if (apiTeam) {
          const totalMatch = calcTeam.points === apiTeam.points;
          const artsMatch = calcTeam.artsPoints === (apiTeam.artsPoints || 0);
          const sportsMatch = calcTeam.sportsPoints === (apiTeam.sportsPoints || 0);
          
          console.log(`${calcTeam.name}:`);
          console.log(`  Total: ${totalMatch ? '✅' : '❌'} (Calc: ${calcTeam.points}, API: ${apiTeam.points})`);
          console.log(`  Arts: ${artsMatch ? '✅' : '❌'} (Calc: ${calcTeam.artsPoints}, API: ${apiTeam.artsPoints || 0})`);
          console.log(`  Sports: ${sportsMatch ? '✅' : '❌'} (Calc: ${calcTeam.sportsPoints}, API: ${apiTeam.sportsPoints || 0})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing calculation:', error.message);
  }
}

// Function to calculate team marks from published results (same logic as results page)
function calculateTeamMarksFromResults(resultsData, teamsData, candidatesData, programmesData) {
  const teamTotals = {};

  // Initialize team totals
  teamsData.forEach(team => {
    teamTotals[team.code] = {
      name: team.name,
      points: 0,
      results: 0,
      artsPoints: 0,
      sportsPoints: 0,
      artsResults: 0,
      sportsResults: 0,
      color: team.color || '#6366f1'
    };
  });

  // Helper function to add points to team totals
  const addPointsToTeam = (teamCode, points, result) => {
    if (teamTotals[teamCode]) {
      // Separate Arts and Sports points
      if (result.programmeCategory === 'arts') {
        teamTotals[teamCode].artsPoints += points;
        teamTotals[teamCode].artsResults += 1;
      } else if (result.programmeCategory === 'sports') {
        teamTotals[teamCode].sportsPoints += points;
        teamTotals[teamCode].sportsResults += 1;
      }
    }
  };

  // Process published results only
  const publishedResults = resultsData.filter(result => result.status === 'published');

  publishedResults.forEach(result => {
    const programme = programmesData.find(p => p._id?.toString() === result.programmeId);
    if (!programme) return;

    // Enrich result with programme information
    const enrichedResult = {
      ...result,
      programmeCategory: programme.category,
      programmeSubcategory: programme.subcategory
    };

    // Process individual winners with grade points
    if (result.firstPlace) {
      result.firstPlace.forEach(winner => {
        const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
        if (teamCode) {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.firstPoints || 0) + gradePoints;
          addPointsToTeam(teamCode, totalPoints, enrichedResult);
        }
      });
    }

    if (result.secondPlace) {
      result.secondPlace.forEach(winner => {
        const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
        if (teamCode) {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.secondPoints || 0) + gradePoints;
          addPointsToTeam(teamCode, totalPoints, enrichedResult);
        }
      });
    }

    if (result.thirdPlace) {
      result.thirdPlace.forEach(winner => {
        const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
        if (teamCode) {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.thirdPoints || 0) + gradePoints;
          addPointsToTeam(teamCode, totalPoints, enrichedResult);
        }
      });
    }

    // Process team winners with grade points
    if (result.firstPlaceTeams) {
      result.firstPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        const totalPoints = (result.firstPoints || 0) + gradePoints;
        addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
      });
    }

    if (result.secondPlaceTeams) {
      result.secondPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        const totalPoints = (result.secondPoints || 0) + gradePoints;
        addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
      });
    }

    if (result.thirdPlaceTeams) {
      result.thirdPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        const totalPoints = (result.thirdPoints || 0) + gradePoints;
        addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
      });
    }
  });

  // Convert to array and sort by total points (arts + sports)
  return Object.entries(teamTotals)
    .map(([teamCode, data]) => ({
      teamCode,
      name: data.name,
      points: data.artsPoints + data.sportsPoints, // Total points = arts + sports
      artsPoints: data.artsPoints,
      sportsPoints: data.sportsPoints,
      results: data.artsResults + data.sportsResults,
      color: data.color
    }))
    .filter(team => team.points > 0)
    .sort((a, b) => b.points - a.points);
}

// Helper functions
function getTeamCodeFromChestNumber(chestNumber, teamsData) {
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
    } else if (num >= 100 && num < 200) {
      return 'A';
    } else {
      return chestNumber.charAt(0);
    }
  }

  const availableTeamCodes = teamsData.map(t => t.code.toUpperCase());
  for (const teamCode of availableTeamCodes) {
    if (upperChestNumber.includes(teamCode)) {
      return teamCode;
    }
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

testResultsPageCalculation();
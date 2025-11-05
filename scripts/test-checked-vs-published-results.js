console.log('🔍 Testing Checked vs Published Results...\n');

async function testCheckedVsPublished() {
  try {
    console.log('📊 Comparing checked and published results...\n');
    
    // Test both checked and published results
    const statuses = ['checked', 'published'];
    
    for (const status of statuses) {
      console.log(`🔍 Testing ${status.toUpperCase()} results:`);
      
      try {
        const [resultsRes, teamsRes, candidatesRes, programmesRes] = await Promise.all([
          fetch(`http://localhost:3000/api/results/status?status=${status}`),
          fetch('http://localhost:3000/api/teams'),
          fetch('http://localhost:3000/api/candidates'),
          fetch('http://localhost:3000/api/programmes')
        ]);
        
        if (!resultsRes.ok) {
          console.log(`   ❌ Error fetching ${status} results: ${resultsRes.status}`);
          continue;
        }
        
        const [results, teams, candidates, programmes] = await Promise.all([
          resultsRes.json(),
          teamsRes.json(),
          candidatesRes.json(),
          programmesRes.json()
        ]);
        
        console.log(`   📈 ${status} results: ${results.length}`);
        
        // Quick calculation for arts results
        const teamTotals = {};
        teams.forEach(team => {
          teamTotals[team.code] = { name: team.name, total: 0 };
        });
        
        const getGradePoints = (grade) => {
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
        };
        
        // Filter for arts results
        const artsResults = results.filter(result => {
          const programme = programmes.find(p => 
            p._id?.toString() === result.programmeId?.toString()
          );
          return programme && programme.category === 'arts';
        });
        
        console.log(`   🎨 Arts results: ${artsResults.length}`);
        
        // Calculate team totals
        artsResults.forEach(result => {
          // Process individual winners
          ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((place, index) => {
            const points = [result.firstPoints, result.secondPoints, result.thirdPoints][index];
            
            if (result[place] && result[place].length > 0) {
              result[place].forEach(winner => {
                const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                if (candidate && candidate.team && teamTotals[candidate.team]) {
                  const gradePoints = getGradePoints(winner.grade || '');
                  const totalPoints = points + gradePoints;
                  teamTotals[candidate.team].total += totalPoints;
                }
              });
            }
          });
          
          // Process team winners
          ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((place, index) => {
            const points = [result.firstPoints, result.secondPoints, result.thirdPoints][index];
            
            if (result[place] && result[place].length > 0) {
              result[place].forEach(winner => {
                if (teamTotals[winner.teamCode]) {
                  const gradePoints = getGradePoints(winner.grade || '');
                  const totalPoints = points + gradePoints;
                  teamTotals[winner.teamCode].total += totalPoints;
                }
              });
            }
          });
        });
        
        // Sort and display results
        const sortedTeams = Object.entries(teamTotals)
          .map(([code, data]) => ({ teamCode: code, ...data }))
          .filter(team => team.total > 0)
          .sort((a, b) => b.total - a.total);
        
        console.log(`   🏆 Team totals:`);
        sortedTeams.forEach((team, index) => {
          console.log(`     ${index + 1}. ${team.name} (${team.teamCode}): ${Math.round(team.total)} pts`);
        });
        
        // Check if this matches expected values
        const intTeam = sortedTeams.find(t => t.teamCode === 'INT');
        const smdTeam = sortedTeams.find(t => t.teamCode === 'SMD');
        const aqsTeam = sortedTeams.find(t => t.teamCode === 'AQS');
        
        console.log(`   🎯 Comparison with expected:`);
        if (intTeam) {
          const diff = Math.round(intTeam.total) - 544;
          console.log(`     INT: ${Math.round(intTeam.total)} (expected: 544, diff: ${diff > 0 ? '+' : ''}${diff})`);
          if (Math.abs(diff) < 20) console.log(`       🎯 CLOSE MATCH!`);
        }
        if (smdTeam) {
          const diff = Math.round(smdTeam.total) - 432;
          console.log(`     SMD: ${Math.round(smdTeam.total)} (expected: 432, diff: ${diff > 0 ? '+' : ''}${diff})`);
          if (Math.abs(diff) < 20) console.log(`       🎯 CLOSE MATCH!`);
        }
        if (aqsTeam) {
          const diff = Math.round(aqsTeam.total) - 424;
          console.log(`     AQS: ${Math.round(aqsTeam.total)} (expected: 424, diff: ${diff > 0 ? '+' : ''}${diff})`);
          if (Math.abs(diff) < 20) console.log(`       🎯 CLOSE MATCH!`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing ${status} results: ${error.message}`);
      }
      
      console.log(''); // Empty line
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCheckedVsPublished();
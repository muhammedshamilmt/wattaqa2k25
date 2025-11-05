require('dotenv').config({ path: '.env.local' });

async function testLeaderboardTopPerformersFix() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 TESTING LEADERBOARD TOP PERFORMERS FIX\n');
  
  try {
    // Simulate the leaderboard's fetchData logic
    const [resultsRes, candidatesRes, programmesRes] = await Promise.all([
      fetch(`${baseUrl}/api/results?status=published`),
      fetch(`${baseUrl}/api/candidates`),
      fetch(`${baseUrl}/api/programmes`)
    ]);

    if (resultsRes.ok && candidatesRes.ok && programmesRes.ok) {
      const [resultsData, candidatesData, programmesData] = await Promise.all([
        resultsRes.json(),
        candidatesRes.json(),
        programmesRes.json()
      ]);

      console.log(`📊 Data loaded:`);
      console.log(`  - ${resultsData.length} published results`);
      console.log(`  - ${candidatesData.length} candidates`);
      console.log(`  - ${programmesData.length} programmes`);

      // Generate top performers using the new logic
      const performerScores = {};
      
      const publishedResults = resultsData.filter(result => result.status === 'published');
      
      publishedResults
        .filter(result => {
          const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
          return programme && programme.positionType === 'individual';
        })
        .forEach(result => {
          const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
          
          // Process winners
          [
            { winners: result.firstPlace, points: result.firstPoints || 0, position: '1st Place' },
            { winners: result.secondPlace, points: result.secondPoints || 0, position: '2nd Place' },
            { winners: result.thirdPlace, points: result.thirdPoints || 0, position: '3rd Place' }
          ].forEach(({ winners, points, position }) => {
            winners?.forEach(winner => {
              const candidate = candidatesData.find(c => c.chestNumber === winner.chestNumber);
              
              if (!performerScores[winner.chestNumber]) {
                performerScores[winner.chestNumber] = { totalMarks: 0, programs: [], candidate };
              }
              
              const totalPoints = points + (winner.grade ? getGradePoints(winner.grade) : 0);
              performerScores[winner.chestNumber].totalMarks += totalPoints;
              performerScores[winner.chestNumber].programs.push({
                programmeName: programme?.name || 'Unknown Programme',
                programmeCategory: programme?.category || 'unknown',
                totalMarks: totalPoints,
                position,
                grade: winner.grade
              });
            });
          });
        });

      // Convert to TopPerformer format and get top performers
      const topPerformersData = Object.entries(performerScores)
        .map(([chestNumber, data]) => {
          const bestProgram = data.programs.sort((a, b) => b.totalMarks - a.totalMarks)[0];
          const teamName = getTeamName(data.candidate?.team);
          
          return {
            name: data.candidate?.name || 'Unknown Participant',
            chestNumber,
            team: teamName,
            programme: bestProgram?.programmeName || 'Unknown Programme',
            position: bestProgram?.position || '1st Place',
            grade: bestProgram?.grade || 'A+',
            points: data.totalMarks
          };
        })
        .filter(performer => performer.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 12);

      console.log(`\n🏆 TOP PERFORMERS (Fixed Logic):`);
      console.log(`Generated ${topPerformersData.length} top performers\n`);

      topPerformersData.slice(0, 8).forEach((performer, index) => {
        console.log(`${index + 1}. ${performer.name} (${performer.chestNumber})`);
        console.log(`   Team: ${performer.team}`);
        console.log(`   Programme: ${performer.programme}`);
        console.log(`   Position: ${performer.position}`);
        console.log(`   Grade: ${performer.grade}`);
        console.log(`   Total Points: ${performer.points}`);
        console.log('---');
      });

      // Check for "Unknown Programme" issues
      const unknownProgrammes = topPerformersData.filter(p => p.programme === 'Unknown Programme');
      console.log(`\n❌ "Unknown Programme" issues: ${unknownProgrammes.length}`);
      
      if (unknownProgrammes.length > 0) {
        console.log('Performers with unknown programmes:');
        unknownProgrammes.forEach(p => {
          console.log(`  - ${p.name} (${p.chestNumber})`);
        });
      } else {
        console.log('✅ All programmes properly identified!');
      }

      // Check individual programme filtering
      const individualProgrammes = programmesData.filter(p => p.positionType === 'individual');
      console.log(`\n📋 Individual programmes: ${individualProgrammes.length} out of ${programmesData.length} total`);
      
      const individualResults = publishedResults.filter(result => {
        const programme = programmesData.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.positionType === 'individual';
      });
      console.log(`📊 Individual results: ${individualResults.length} out of ${publishedResults.length} published`);

    } else {
      console.log('❌ Failed to fetch API data');
    }
    
  } catch (error) {
    console.error('❌ Error testing leaderboard fix:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on localhost:3000');
  }
}

// Helper functions
function getTeamName(teamCode) {
  switch (teamCode?.toUpperCase()) {
    case 'INT': return 'Team Inthifada';
    case 'SMD': return 'Team Sumud';
    case 'AQS': return 'Team Aqsa';
    default: return teamCode || 'Unknown Team';
  }
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

testLeaderboardTopPerformersFix();
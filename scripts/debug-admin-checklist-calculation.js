console.log('🔍 Debugging Admin Checklist Calculation...\n');

async function debugAdminChecklistCalculation() {
  try {
    console.log('📊 Fetching data to replicate admin checklist calculation...\n');
    
    // Fetch the same data that admin checklist uses
    const [resultsRes, teamsRes, candidatesRes, programmesRes] = await Promise.all([
      fetch('http://localhost:3000/api/results/status?status=published'),
      fetch('http://localhost:3000/api/teams'),
      fetch('http://localhost:3000/api/candidates'),
      fetch('http://localhost:3000/api/programmes')
    ]);
    
    if (!resultsRes.ok || !teamsRes.ok || !candidatesRes.ok || !programmesRes.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const [results, teams, candidates, programmes] = await Promise.all([
      resultsRes.json(),
      teamsRes.json(),
      candidatesRes.json(),
      programmesRes.json()
    ]);
    
    console.log(`📈 Data loaded:`);
    console.log(`   Published Results: ${results.length}`);
    console.log(`   Teams: ${teams.length}`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Programmes: ${programmes.length}`);
    
    // Replicate the MarksSummary calculation logic
    const teamTotals = {};
    
    // Initialize teams
    teams.forEach(team => {
      teamTotals[team.code] = {
        name: team.name,
        individual: 0,
        group: 0,
        general: 0,
        total: 0,
        programmes: []
      };
    });
    
    // Grade points function (same as MarksSummary)
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
    
    // Filter results for arts category (like admin checklist)
    const artsResults = results.filter(result => {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString()
      );
      return programme && programme.category === 'arts';
    });
    
    console.log(`\n🎨 Arts Results: ${artsResults.length}`);
    
    // Process results like MarksSummary does
    artsResults.forEach(result => {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString()
      );
      
      if (!programme) return;
      
      // Determine mark category (same logic as MarksSummary)
      const getMarkCategory = (section, positionType) => {
        const normalizedSection = section.toLowerCase();
        if (normalizedSection === 'general') {
          return 'general';
        } else if (['senior', 'junior', 'sub-junior'].includes(normalizedSection)) {
          if (positionType === 'individual') return 'individual';
          else if (positionType === 'group') return 'group';
          else return 'general';
        }
        return positionType === 'individual' ? 'individual' : 
               positionType === 'group' ? 'group' : 'general';
      };
      
      const markCategory = getMarkCategory(programme.section || result.section, result.positionType);
      
      // Process winners
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((place, index) => {
        const points = [result.firstPoints, result.secondPoints, result.thirdPoints][index];
        
        if (result[place] && result[place].length > 0) {
          result[place].forEach(winner => {
            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
            if (candidate && candidate.team && teamTotals[candidate.team]) {
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = points + gradePoints;
              
              teamTotals[candidate.team][markCategory] += totalPoints;
              teamTotals[candidate.team].total += totalPoints;
              teamTotals[candidate.team].programmes.push({
                name: programme.name,
                category: programme.category,
                section: programme.section,
                points: totalPoints,
                type: markCategory
              });
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
              
              teamTotals[winner.teamCode][markCategory] += totalPoints;
              teamTotals[winner.teamCode].total += totalPoints;
              teamTotals[winner.teamCode].programmes.push({
                name: programme.name,
                category: programme.category,
                section: programme.section,
                points: totalPoints,
                type: markCategory
              });
            }
          });
        }
      });
    });
    
    // Sort teams by total points
    const sortedTeams = Object.entries(teamTotals)
      .map(([code, data]) => ({ teamCode: code, ...data }))
      .filter(team => team.total > 0)
      .sort((a, b) => b.total - a.total);
    
    console.log(`\n🏆 Calculated Team Marks (Arts Total):`);
    sortedTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.name} (${team.teamCode}): ${Math.round(team.total)} pts`);
      console.log(`      Individual: ${Math.round(team.individual)} | Group: ${Math.round(team.group)} | General: ${Math.round(team.general)}`);
    });
    
    console.log(`\n🎯 Expected vs Calculated:`);
    const intTeam = sortedTeams.find(t => t.teamCode === 'INT');
    const smdTeam = sortedTeams.find(t => t.teamCode === 'SMD');
    const aqsTeam = sortedTeams.find(t => t.teamCode === 'AQS');
    
    if (intTeam) console.log(`   INT: Calculated ${Math.round(intTeam.total)}, Expected 544`);
    if (smdTeam) console.log(`   SMD: Calculated ${Math.round(smdTeam.total)}, Expected 432`);
    if (aqsTeam) console.log(`   AQS: Calculated ${Math.round(aqsTeam.total)}, Expected 424`);
    
    // Check if any match the expected values
    const matches = [];
    if (intTeam && Math.abs(Math.round(intTeam.total) - 544) < 20) matches.push('INT');
    if (smdTeam && Math.abs(Math.round(smdTeam.total) - 432) < 20) matches.push('SMD');
    if (aqsTeam && Math.abs(Math.round(aqsTeam.total) - 424) < 20) matches.push('AQS');
    
    if (matches.length > 0) {
      console.log(`\n🎯 CLOSE MATCH FOUND for teams: ${matches.join(', ')}`);
    } else {
      console.log(`\n❌ No close matches found. The admin checklist might be using different data or filters.`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debugAdminChecklistCalculation();
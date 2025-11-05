import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// Grade points mapping (same as admin checklist page)
function getGradePoints(grade: string): number {
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

function getTeamCodeFromChestNumber(chestNumber: string, teams: any[]): string {
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
  
  const availableTeamCodes = teams.map(t => t.code.toUpperCase());
  for (const teamCode of availableTeamCodes) {
    if (upperChestNumber.includes(teamCode)) {
      return teamCode;
    }
  }
  
  return '';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all'; // 'arts', 'sports', 'all'
    const subcategory = searchParams.get('subcategory') || 'all'; // 'stage', 'non-stage', 'all'

    const db = await getDatabase();
    
    // Fetch all required data
    const [results, teams, candidates, programmes] = await Promise.all([
      db.collection('results').find({ status: 'published' }).toArray(),
      db.collection('teams').find({}).toArray(),
      db.collection('candidates').find({}).toArray(),
      db.collection('programmes').find({}).toArray()
    ]);

    const teamTotals: { [teamCode: string]: { 
      name: string; 
      points: number; 
      results: number;
      artsPoints: number;
      sportsPoints: number;
      artsResults: number;
      sportsResults: number;
      color: string;
    } } = {};
    
    // Initialize team totals
    teams.forEach((team: any) => {
      let teamColor = '#6B7280'; // Default gray
      
      // Set team colors based on team names
      if (team.name.toLowerCase().includes('sumud')) {
        teamColor = '#10B981'; // Green
      } else if (team.name.toLowerCase().includes('aqsa')) {
        teamColor = '#6B7280'; // Gray
      } else if (team.name.toLowerCase().includes('inthifada')) {
        teamColor = '#EF4444'; // Red
      }
      
      teamTotals[team.code] = { 
        name: team.name, 
        points: 0, 
        results: 0,
        artsPoints: 0,
        sportsPoints: 0,
        artsResults: 0,
        sportsResults: 0,
        color: team.color || teamColor
      };
    });
    
    // Helper function to add points to team totals
    const addPointsToTeam = (teamCode: string, points: number, result: any) => {
      if (teamTotals[teamCode]) {
        const programme = programmes.find((p: any) => 
          p._id.toString() === result.programmeId?.toString()
        );
        
        if (programme) {
          // Separate Arts and Sports points
          if (programme.category === 'arts') {
            teamTotals[teamCode].artsPoints += points;
            teamTotals[teamCode].artsResults += 1;
          } else if (programme.category === 'sports') {
            teamTotals[teamCode].sportsPoints += points;
            teamTotals[teamCode].sportsResults += 1;
          }
        }
      }
    };

    // Helper function to check if result matches category filter
    const matchesCategoryFilter = (result: any) => {
      const programme = programmes.find((p: any) => 
        p._id.toString() === result.programmeId?.toString()
      );
      
      if (!programme) return false;
      
      if (category === 'arts') {
        if (subcategory === 'stage') {
          return programme.category === 'arts' && programme.subcategory === 'stage';
        } else if (subcategory === 'non-stage') {
          return programme.category === 'arts' && programme.subcategory === 'non-stage';
        } else {
          return programme.category === 'arts';
        }
      } else if (category === 'sports') {
        return programme.category === 'sports';
      }
      return true; // 'all' category
    };
    
    // Process published results
    results.filter(matchesCategoryFilter).forEach((result: any) => {
      // Process individual winners - use candidate lookup like MarksSummary
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.firstPoints || 5) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, result);
          }
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.secondPoints || 3) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, result);
          }
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.thirdPoints || 1) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, result);
          }
        });
      }
      
      // Process team winners
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.firstPoints || 5) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.secondPoints || 3) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.thirdPoints || 1) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
    });

    // Calculate final results based on category filter
    const grandMarks = Object.entries(teamTotals)
      .map(([code, data]) => {
        let displayPoints = 0;
        let displayResults = 0;
        
        if (category === 'sports') {
          displayPoints = data.sportsPoints;
          displayResults = data.sportsResults;
        } else if (category === 'arts') {
          displayPoints = data.artsPoints;
          displayResults = data.artsResults;
        } else {
          // For 'all' category, combine both
          displayPoints = data.artsPoints + data.sportsPoints;
          displayResults = data.artsResults + data.sportsResults;
        }
        
        return { 
          teamCode: code, 
          name: data.name,
          points: displayPoints,
          results: displayResults,
          artsPoints: data.artsPoints,
          sportsPoints: data.sportsPoints,
          artsResults: data.artsResults,
          sportsResults: data.sportsResults,
          color: data.color
        };
      })
      .filter(team => team.points > 0) // Only show teams with points
      .sort((a, b) => b.points - a.points);

    return NextResponse.json(grandMarks);
  } catch (error) {
    console.error('Error fetching grand marks:', error);
    return NextResponse.json({ error: 'Failed to fetch grand marks' }, { status: 500 });
  }
}
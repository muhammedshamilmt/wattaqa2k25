import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getGradePoints } from '@/utils/markingSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category') || 'arts-total'; // 'arts-total', 'arts-stage', 'arts-non-stage', 'sports'

    const db = await getDatabase();
    
    // Fetch all required data - same as admin checklist
    const [results, teams, candidates, programmes] = await Promise.all([
      db.collection('results').find({ status: 'published' }).toArray(),
      db.collection('teams').find({}).toArray(),
      db.collection('candidates').find({}).toArray(),
      db.collection('programmes').find({}).toArray()
    ]);

    // Enrich results with programme information - same as admin checklist
    const enrichedResults = results.map((result: any) => {
      const programme = programmes.find((p: any) => {
        const programmeIdStr = p._id?.toString();
        const resultProgrammeIdStr = result.programmeId?.toString();
        return programmeIdStr === resultProgrammeIdStr;
      });
      
      return {
        ...result,
        programmeName: programme?.name,
        programmeCode: programme?.code,
        programmeCategory: programme?.category,
        programmeSection: programme?.section,
        programmeSubcategory: programme?.subcategory
      };
    });

    const teamTotals: { [teamCode: string]: { 
      name: string; 
      points: number; 
      results: number;
      artsPoints: number;
      sportsPoints: number;
      artsResults: number;
      sportsResults: number;
    } } = {};
    
    teams.forEach((team: any) => {
      teamTotals[team.code] = { 
        name: team.name, 
        points: 0, 
        results: 0,
        artsPoints: 0,
        sportsPoints: 0,
        artsResults: 0,
        sportsResults: 0
      };
    });
    
    // Helper function to add points to team totals - same as admin checklist
    const addPointsToTeam = (teamCode: string, points: number, result: any) => {
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

    // Helper function to check if result matches current category filter - same as admin checklist
    const matchesCategoryFilter = (result: any) => {
      if (categoryFilter === 'arts-total') {
        return result.programmeCategory === 'arts';
      } else if (categoryFilter === 'arts-stage') {
        return result.programmeCategory === 'arts' && result.programmeSubcategory === 'stage';
      } else if (categoryFilter === 'arts-non-stage') {
        return result.programmeCategory === 'arts' && result.programmeSubcategory === 'non-stage';
      } else if (categoryFilter === 'sports') {
        return result.programmeCategory === 'sports';
      }
      return true;
    };

    // Helper function to get team code from chest number - same as admin checklist
    const getTeamCodeFromChestNumber = (chestNumber: string) => {
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
      
      const availableTeamCodes = teams.map((t: any) => t.code.toUpperCase());
      for (const teamCode of availableTeamCodes) {
        if (upperChestNumber.includes(teamCode)) {
          return teamCode;
        }
      }
      
      return '';
    };
    
    // Process published results (only those matching category filter) - same as admin checklist
    enrichedResults.filter(matchesCategoryFilter).forEach((result: any) => {
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach((winner: any) => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.firstPoints + gradePoints;
          addPointsToTeam(teamCode, totalPoints, result);
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach((winner: any) => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.secondPoints + gradePoints;
          addPointsToTeam(teamCode, totalPoints, result);
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach((winner: any) => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.thirdPoints + gradePoints;
          addPointsToTeam(teamCode, totalPoints, result);
        });
      }
      
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.firstPoints + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.secondPoints + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = result.thirdPoints + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, result);
        });
      }
    });

    const preview = Object.entries(teamTotals)
      .map(([code, data]) => {
        const teamData = teams.find((t: any) => t.code === code);
        
        // Set points and results based on active category filter - same as admin checklist
        let displayPoints = 0;
        let displayResults = 0;
        
        if (categoryFilter === 'sports') {
          displayPoints = data.sportsPoints;
          displayResults = data.sportsResults;
        } else {
          // For arts-total, arts-stage, arts-non-stage - show arts points
          displayPoints = data.artsPoints;
          displayResults = data.artsResults;
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
          color: teamData?.color || '#6366f1'
        };
      })
      .filter(team => team.points > 0) // Only show teams with points in the selected category
      .sort((a, b) => b.points - a.points);

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Error fetching admin checklist marks:', error);
    return NextResponse.json({ error: 'Failed to fetch admin checklist marks' }, { status: 500 });
  }
}
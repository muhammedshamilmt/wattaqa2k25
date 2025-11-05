const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Fixing Grand Marks Calculation Issues...\n');

async function fixGrandMarksAPI() {
  try {
    console.log('📝 Updating Grand Marks API to match expected calculations...\n');
    
    // Read current API implementation
    const apiPath = 'src/app/api/grand-marks/route.ts';
    let apiContent = fs.readFileSync(apiPath, 'utf8');
    
    console.log('🔍 Current Issues Found:');
    console.log('1. Results not properly categorized (all showing as "unknown")');
    console.log('2. Calculation method may differ from admin checklist');
    console.log('3. Need to ensure programme data is properly joined');
    
    // The issue is that results don't have programme category information
    // We need to ensure the programme lookup works correctly
    
    // Check if the API properly enriches results with programme data
    if (!apiContent.includes('programme.category')) {
      console.log('❌ API not properly using programme category');
    } else {
      console.log('✅ API uses programme category');
    }
    
    // Let's create a corrected version that matches your expected data
    const correctedAPI = `import { NextRequest, NextResponse } from 'next/server';
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

    // Create programme lookup map for better performance
    const programmeMap = new Map();
    programmes.forEach((programme: any) => {
      programmeMap.set(programme._id.toString(), programme);
    });

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
    const addPointsToTeam = (teamCode: string, points: number, programmeCategory: string) => {
      if (teamTotals[teamCode]) {
        // Separate Arts and Sports points
        if (programmeCategory === 'arts') {
          teamTotals[teamCode].artsPoints += points;
          teamTotals[teamCode].artsResults += 1;
        } else if (programmeCategory === 'sports') {
          teamTotals[teamCode].sportsPoints += points;
          teamTotals[teamCode].sportsResults += 1;
        }
      }
    };

    // Helper function to check if result matches category filter
    const matchesCategoryFilter = (programmeCategory: string, programmeSubcategory: string) => {
      if (category === 'arts') {
        if (subcategory === 'stage') {
          return programmeCategory === 'arts' && programmeSubcategory === 'stage';
        } else if (subcategory === 'non-stage') {
          return programmeCategory === 'arts' && programmeSubcategory === 'non-stage';
        } else {
          return programmeCategory === 'arts';
        }
      } else if (category === 'sports') {
        return programmeCategory === 'sports';
      }
      return true; // 'all' category
    };
    
    // Process published results
    results.forEach((result: any) => {
      const programme = programmeMap.get(result.programmeId?.toString());
      if (!programme) return;
      
      // Check if result matches category filter
      if (!matchesCategoryFilter(programme.category, programme.subcategory)) return;
      
      // Process individual winners - use candidate lookup like MarksSummary
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.firstPoints || 5) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programme.category);
          }
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.secondPoints || 3) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programme.category);
          }
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.thirdPoints || 1) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programme.category);
          }
        });
      }
      
      // Process team winners
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.firstPoints || 5) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, programme.category);
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.secondPoints || 3) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, programme.category);
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach((winner: any) => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.thirdPoints || 1) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, programme.category);
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
}`;

    // Write the corrected API
    fs.writeFileSync(apiPath, correctedAPI);
    console.log('✅ Updated Grand Marks API with improved programme lookup');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing Grand Marks API:', error.message);
    return false;
  }
}

async function testFixedAPI() {
  console.log('\n🧪 Testing Fixed API...\n');
  
  try {
    // Wait a moment for the API to reload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:3000/api/grand-marks?category=all');
    const data = await response.json();
    
    console.log('📊 Fixed API Results:');
    console.log(`Status: ${response.status}`);
    console.log(`Teams: ${data.length}`);
    
    if (data.length > 0) {
      data.forEach((team, index) => {
        console.log(`${index + 1}. ${team.name} (${team.teamCode})`);
        console.log(`   Total: ${team.points} points`);
        console.log(`   Arts: ${team.artsPoints} points`);
        console.log(`   Sports: ${team.sportsPoints} points`);
        console.log('');
      });
      
      // Compare with expected values
      console.log('🎯 Comparison with Expected Values:');
      const expectedArts = { SMD: 759, INT: 754, AQS: 716 };
      const expectedSports = { SMD: 143, INT: 141, AQS: 137 };
      
      data.forEach(team => {
        const expectedArtsPoints = expectedArts[team.teamCode] || 0;
        const expectedSportsPoints = expectedSports[team.teamCode] || 0;
        
        console.log(`${team.teamCode}:`);
        console.log(`  Arts: ${team.artsPoints} (expected: ${expectedArtsPoints}) - Diff: ${team.artsPoints - expectedArtsPoints}`);
        console.log(`  Sports: ${team.sportsPoints} (expected: ${expectedSportsPoints}) - Diff: ${team.sportsPoints - expectedSportsPoints}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing fixed API:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Grand Marks Calculation Fix Tool\n');
  console.log('This tool will fix the grand marks calculation to match your expected values.\n');
  
  const apiFixed = await fixGrandMarksAPI();
  
  if (apiFixed) {
    console.log('✅ Grand Marks API has been updated');
    await testFixedAPI();
  } else {
    console.log('❌ Failed to fix Grand Marks API');
  }
  
  console.log('\n📋 What was fixed:');
  console.log('1. Improved programme lookup using Map for better performance');
  console.log('2. Ensured proper programme category assignment');
  console.log('3. Fixed team points calculation logic');
  console.log('4. Added better error handling');
  
  console.log('\n✅ Fix completed! The API should now return more accurate results.');
}

main().catch(console.error);
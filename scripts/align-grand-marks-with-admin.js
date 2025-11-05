const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Aligning Grand Marks API with Admin MarksSummary Calculation...\n');

async function updateGrandMarksAPI() {
  try {
    console.log('📝 Updating Grand Marks API to match MarksSummary calculation method...\n');
    
    // Create the aligned API implementation
    const alignedAPI = `import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getGradePoints } from '@/utils/markingSystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all'; // 'arts', 'sports', 'all'
    const subcategory = searchParams.get('subcategory') || 'all'; // 'stage', 'non-stage', 'all'

    const db = await getDatabase();
    
    // Fetch all required data - same as MarksSummary
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
    
    // Initialize team totals - same as MarksSummary
    teams.forEach((team: any) => {
      let teamColor = '#6B7280'; // Default gray
      
      // Set team colors based on team names
      if (team.name.toLowerCase().includes('sumud')) {
        teamColor = '#22C55E'; // Green
      } else if (team.name.toLowerCase().includes('aqsa')) {
        teamColor = '#374151'; // Gray
      } else if (team.name.toLowerCase().includes('inthifada')) {
        teamColor = '#E11D48'; // Red
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
    
    // Helper function to get programme details - same as MarksSummary
    const getProgrammeDetails = (result: any) => {
      if (result.programmeId && programmes.length > 0) {
        const programme = programmes.find((p: any) => 
          p._id?.toString() === result.programmeId?.toString() ||
          p.id?.toString() === result.programmeId?.toString()
        );
        if (programme) {
          return {
            name: programme.name,
            category: programme.category || 'Unknown',
            section: programme.section || result.section || 'Unknown'
          };
        }
      }

      return {
        name: result.programmeName || 'Unknown Programme',
        category: result.programmeCategory || 'Unknown',
        section: result.section || 'Unknown'
      };
    };
    
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
    
    // Process published results - SAME METHOD AS MARKSSUMMARY
    results.forEach((result: any) => {
      const programmeDetails = getProgrammeDetails(result);
      const programmeCategory = programmeDetails.category;
      const programmeSubcategory = programmeDetails.section;
      
      // Check if result matches category filter
      if (!matchesCategoryFilter(programmeCategory, programmeSubcategory)) return;
      
      // Process individual winners - EXACT SAME LOGIC AS MARKSSUMMARY
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team && teamTotals[candidate.team]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.firstPoints || 5) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programmeCategory);
          }
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team && teamTotals[candidate.team]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.secondPoints || 3) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programmeCategory);
          }
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach((winner: any) => {
          const candidate = candidates.find((c: any) => c.chestNumber === winner.chestNumber);
          if (candidate && candidate.team && teamTotals[candidate.team]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.thirdPoints || 1) + gradePoints;
            addPointsToTeam(candidate.team, totalPoints, programmeCategory);
          }
        });
      }
      
      // Process team winners - EXACT SAME LOGIC AS MARKSSUMMARY
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach((winner: any) => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.firstPoints || 5) + gradePoints;
            addPointsToTeam(winner.teamCode, totalPoints, programmeCategory);
          }
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach((winner: any) => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.secondPoints || 3) + gradePoints;
            addPointsToTeam(winner.teamCode, totalPoints, programmeCategory);
          }
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach((winner: any) => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.thirdPoints || 1) + gradePoints;
            addPointsToTeam(winner.teamCode, totalPoints, programmeCategory);
          }
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
          points: Math.round(displayPoints), // Round to match expected values
          results: displayResults,
          artsPoints: Math.round(data.artsPoints),
          sportsPoints: Math.round(data.sportsPoints),
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

    // Write the aligned API
    const apiPath = 'src/app/api/grand-marks/route.ts';
    fs.writeFileSync(apiPath, alignedAPI);
    console.log('✅ Updated Grand Marks API to match MarksSummary calculation method');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating Grand Marks API:', error.message);
    return false;
  }
}

async function testAlignedAPI() {
  console.log('\n🧪 Testing Aligned API...\n');
  
  try {
    // Wait a moment for the API to reload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test all categories
    const tests = [
      { endpoint: '/api/grand-marks?category=all', name: 'All Categories' },
      { endpoint: '/api/grand-marks?category=arts', name: 'Arts Only' },
      { endpoint: '/api/grand-marks?category=sports', name: 'Sports Only' }
    ];
    
    for (const test of tests) {
      console.log(`📊 Testing ${test.name}:`);
      const response = await fetch(`http://localhost:3000${test.endpoint}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        data.forEach((team, index) => {
          console.log(`  ${index + 1}. ${team.name} (${team.teamCode}): ${team.points} points`);
          if (test.name === 'All Categories') {
            console.log(`     Arts: ${team.artsPoints}, Sports: ${team.sportsPoints}`);
          }
        });
      } else {
        console.log('  No data returned');
      }
      console.log('');
    }
    
    // Compare with expected values
    console.log('🎯 Comparison with Your Expected Values:');
    const allResponse = await fetch('http://localhost:3000/api/grand-marks?category=all');
    const allData = await allResponse.json();
    
    const expectedArts = { SMD: 759, INT: 754, AQS: 716 };
    const expectedSports = { SMD: 143, INT: 141, AQS: 137 };
    
    console.log('Expected vs Actual:');
    ['SMD', 'INT', 'AQS'].forEach(teamCode => {
      const team = allData.find(t => t.teamCode === teamCode);
      if (team) {
        console.log(`${teamCode}:`);
        console.log(`  Arts: ${team.artsPoints} (expected: ${expectedArts[teamCode]}) - Diff: ${team.artsPoints - expectedArts[teamCode]}`);
        console.log(`  Sports: ${team.sportsPoints} (expected: ${expectedSports[teamCode]}) - Diff: ${team.sportsPoints - expectedSports[teamCode]}`);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing aligned API:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Grand Marks API Alignment Tool\n');
  console.log('This tool aligns the Grand Marks API with the MarksSummary calculation method.\n');
  
  const apiUpdated = await updateGrandMarksAPI();
  
  if (apiUpdated) {
    console.log('✅ Grand Marks API has been aligned with MarksSummary');
    await testAlignedAPI();
  } else {
    console.log('❌ Failed to update Grand Marks API');
  }
  
  console.log('\n📋 Key Changes Made:');
  console.log('1. Uses exact same calculation logic as MarksSummary component');
  console.log('2. Uses candidate lookup for team assignment (not chest number parsing)');
  console.log('3. Uses getGradePoints from markingSystem utility');
  console.log('4. Processes individual and team winners separately');
  console.log('5. Rounds final values to match expected integers');
  console.log('6. Uses correct team colors');
  
  console.log('\n✅ Alignment completed! The API should now match admin calculations.');
}

main().catch(console.error);
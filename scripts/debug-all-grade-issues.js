/**
 * Debug All Grade Issues
 * This script checks all the places where grade points should be included
 */

const { MongoClient } = require('mongodb');

// Grade points mapping
const GRADE_POINTS = { A: 5, B: 3, C: 1 };

function getGradePoints(grade) {
  if (!grade) return 0;
  const normalizedGrade = grade.toUpperCase().charAt(0);
  return GRADE_POINTS[normalizedGrade] || 0;
}

async function debugAllGradeIssues() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 DEBUGGING ALL GRADE POINT ISSUES');
    console.log('=' .repeat(60));
    
    // Get data
    const publishedResults = await db.collection('results').find({ published: true }).toArray();
    const checkedResults = await db.collection('results').find({ status: 'checked' }).toArray();
    
    console.log(`📊 Data Summary:`);
    console.log(`   Published Results: ${publishedResults.length}`);
    console.log(`   Checked Results: ${checkedResults.length}`);
    console.log('');
    
    // Function to analyze results
    function analyzeResults(results, tabName) {
      console.log(`🔍 ANALYZING ${tabName.toUpperCase()}:`);
      console.log('-'.repeat(40));
      
      if (results.length === 0) {
        console.log(`❌ No ${tabName.toLowerCase()} results found`);
        console.log('');
        return;
      }
      
      let totalPositionPoints = 0;
      let totalGradePoints = 0;
      let totalWinners = 0;
      let winnersWithGrades = 0;
      let programmeDetails = [];
      
      results.forEach((result, idx) => {
        const programmeName = result.programmeName || `Programme ${idx + 1}`;
        let programmePositionPoints = 0;
        let programmeGradePoints = 0;
        let programmeWinners = 0;
        let programmeWinnersWithGrades = 0;
        
        // Individual winners
        ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, posIndex) => {
          if (result[position]) {
            result[position].forEach(winner => {
              const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              
              totalPositionPoints += points;
              totalGradePoints += gradePoints;
              totalWinners++;
              
              programmePositionPoints += points;
              programmeGradePoints += gradePoints;
              programmeWinners++;
              
              if (winner.grade) {
                winnersWithGrades++;
                programmeWinnersWithGrades++;
              }
              
              if (idx < 3) { // Show details for first 3 programmes
                console.log(`     ${winner.chestNumber} (${position.replace('Place', '')}): ${points} + ${gradePoints} = ${points + gradePoints} pts`);
              }
            });
          }
        });
        
        // Team winners
        ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, posIndex) => {
          if (result[position]) {
            result[position].forEach(winner => {
              const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              
              totalPositionPoints += points;
              totalGradePoints += gradePoints;
              totalWinners++;
              
              programmePositionPoints += points;
              programmeGradePoints += gradePoints;
              programmeWinners++;
              
              if (winner.grade) {
                winnersWithGrades++;
                programmeWinnersWithGrades++;
              }
              
              if (idx < 3) { // Show details for first 3 programmes
                console.log(`     ${winner.teamCode} Team (${position.replace('PlaceTeams', '')}): ${points} + ${gradePoints} = ${points + gradePoints} pts`);
              }
            });
          }
        });
        
        programmeDetails.push({
          name: programmeName,
          winners: programmeWinners,
          winnersWithGrades: programmeWinnersWithGrades,
          positionPoints: programmePositionPoints,
          gradePoints: programmeGradePoints,
          totalPoints: programmePositionPoints + programmeGradePoints
        });
        
        if (idx < 3) {
          console.log(`   ${idx + 1}. ${programmeName}:`);
          console.log(`      Winners: ${programmeWinners} (${programmeWinnersWithGrades} with grades)`);
          console.log(`      Position Points: ${programmePositionPoints}`);
          console.log(`      Grade Points: ${programmeGradePoints}`);
          console.log(`      Total Points: ${programmePositionPoints + programmeGradePoints}`);
          console.log('');
        }
      });
      
      console.log(`📊 ${tabName} Summary:`);
      console.log(`   Total Programmes: ${results.length}`);
      console.log(`   Total Winners: ${totalWinners}`);
      console.log(`   Winners with Grades: ${winnersWithGrades} (${Math.round(winnersWithGrades/totalWinners*100)}%)`);
      console.log(`   Position Points: ${totalPositionPoints}`);
      console.log(`   Grade Points: ${totalGradePoints}`);
      console.log(`   Total Points (With Grades): ${totalPositionPoints + totalGradePoints}`);
      console.log(`   Grade Bonus: +${totalGradePoints} pts (${Math.round(totalGradePoints/totalPositionPoints*100)}% increase)`);
      console.log('');
      
      // Check for issues
      console.log(`🔍 ${tabName} Issues Check:`);
      if (totalGradePoints === 0) {
        console.log(`   ⚠️  No grade points found - winners may not have grades assigned`);
      } else {
        console.log(`   ✅ Grade points are present and calculated`);
      }
      
      if (winnersWithGrades < totalWinners) {
        console.log(`   ⚠️  ${totalWinners - winnersWithGrades} winners don't have grades assigned`);
      } else {
        console.log(`   ✅ All winners have grades assigned`);
      }
      console.log('');
      
      return {
        totalWinners,
        winnersWithGrades,
        positionPoints: totalPositionPoints,
        gradePoints: totalGradePoints,
        totalPoints: totalPositionPoints + totalGradePoints,
        programmeDetails
      };
    }
    
    // Analyze both tabs
    const publishedAnalysis = analyzeResults(publishedResults, 'Published Summary');
    const checkedAnalysis = analyzeResults(checkedResults, 'Checked Marks Summary');
    
    // Test filtering scenarios
    console.log('🔍 TESTING FILTERING SCENARIOS:');
    console.log('=' .repeat(40));
    
    if (publishedResults.length > 0) {
      console.log('Published Results Filtering:');
      
      // Test section filter
      const seniorResults = publishedResults.filter(r => r.section === 'senior');
      if (seniorResults.length > 0) {
        const seniorAnalysis = analyzeResults(seniorResults, 'Senior Section Filter');
        console.log(`   Senior Filter: ${seniorAnalysis.totalPoints} pts (${seniorAnalysis.gradePoints} grade bonus)`);
      }
      
      // Test category filter
      const artsResults = publishedResults.filter(r => r.programmeCategory === 'arts');
      if (artsResults.length > 0) {
        const artsAnalysis = analyzeResults(artsResults, 'Arts Category Filter');
        console.log(`   Arts Filter: ${artsAnalysis.totalPoints} pts (${artsAnalysis.gradePoints} grade bonus)`);
      }
      console.log('');
    }
    
    console.log('🎯 RECOMMENDATIONS:');
    console.log('=' .repeat(30));
    
    if (publishedResults.length === 0 && checkedResults.length === 0) {
      console.log('1. ❌ No results found - add and publish/check some results first');
    } else {
      console.log('1. ✅ Results data is available');
      
      if (publishedAnalysis && publishedAnalysis.gradePoints === 0) {
        console.log('2. ⚠️  Published results have no grade points - assign grades to winners');
      } else if (publishedAnalysis) {
        console.log('2. ✅ Published results include grade points');
      }
      
      if (checkedAnalysis && checkedAnalysis.gradePoints === 0) {
        console.log('3. ⚠️  Checked results have no grade points - assign grades to winners');
      } else if (checkedAnalysis) {
        console.log('3. ✅ Checked results include grade points');
      }
    }
    
    console.log('');
    console.log('📋 What to Check in UI:');
    console.log('1. Programme cards should show individual winner points with grades');
    console.log('2. "🎯 Total Points" should match calculated totals above');
    console.log('3. "📊 Filtered Results Summary" should include grade bonuses');
    console.log('4. Team totals should include grade points for their winners');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  debugAllGradeIssues().catch(console.error);
}

module.exports = { debugAllGradeIssues };
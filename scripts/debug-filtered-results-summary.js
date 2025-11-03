/**
 * Debug Filtered Results Summary
 * This script will help identify why filtered results summary might not show correct points
 */

const { MongoClient } = require('mongodb');

// Grade points mapping (copied from markingSystem.ts)
const GRADE_POINTS = {
  A: 5,
  B: 3,
  C: 1
};

function getGradePoints(grade) {
  if (!grade) return 0;
  const normalizedGrade = grade.toUpperCase().charAt(0);
  return GRADE_POINTS[normalizedGrade] || 0;
}

async function debugFilteredResultsSummary() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 DEBUGGING FILTERED RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    // Get published results
    const publishedResults = await db.collection('results').find({ published: true }).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    
    console.log(`📊 Data Summary:`);
    console.log(`   Published Results: ${publishedResults.length}`);
    console.log(`   Programmes: ${programmes.length}`);
    console.log('');
    
    if (publishedResults.length === 0) {
      console.log('❌ No published results found - cannot test filtering');
      return;
    }
    
    // Test different filter scenarios
    const testFilters = [
      { name: 'No Filter', section: '', category: '', type: '' },
      { name: 'Senior Section', section: 'senior', category: '', type: '' },
      { name: 'Arts Category', section: '', category: 'arts', type: '' },
      { name: 'Individual Type', section: '', category: '', type: 'individual' },
      { name: 'Senior + Arts', section: 'senior', category: 'arts', type: '' }
    ];
    
    testFilters.forEach(filter => {
      console.log(`🔍 Testing Filter: ${filter.name}`);
      console.log('-'.repeat(40));
      
      // Filter results based on criteria
      const filteredResults = publishedResults.filter(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId);
        const programmeName = programme ? `${programme.name} (${programme.code})` : result.programmeName || 'Unknown Programme';
        
        const matchesSection = filter.section === '' || result.section === filter.section;
        const matchesCategory = filter.category === '' || result.programmeCategory === filter.category;
        const matchesType = filter.type === '' || result.positionType === filter.type;
        
        return matchesSection && matchesCategory && matchesType;
      });
      
      console.log(`   Filtered Results: ${filteredResults.length} of ${publishedResults.length}`);
      
      if (filteredResults.length === 0) {
        console.log('   No results match this filter');
        console.log('');
        return;
      }
      
      // Calculate total points with grades (same logic as component)
      let totalWinners = 0;
      let totalPoints = 0;
      
      filteredResults.forEach(result => {
        // Individual winners
        if (result.firstPlace) {
          result.firstPlace.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.firstPoints + gradePoints;
            console.log(`     ${winner.chestNumber} (1st, Grade ${winner.grade || 'None'}): ${result.firstPoints} + ${gradePoints} = ${result.firstPoints + gradePoints} pts`);
          });
        }
        if (result.secondPlace) {
          result.secondPlace.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.secondPoints + gradePoints;
            console.log(`     ${winner.chestNumber} (2nd, Grade ${winner.grade || 'None'}): ${result.secondPoints} + ${gradePoints} = ${result.secondPoints + gradePoints} pts`);
          });
        }
        if (result.thirdPlace) {
          result.thirdPlace.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.thirdPoints + gradePoints;
            console.log(`     ${winner.chestNumber} (3rd, Grade ${winner.grade || 'None'}): ${result.thirdPoints} + ${gradePoints} = ${result.thirdPoints + gradePoints} pts`);
          });
        }
        
        // Team winners
        if (result.firstPlaceTeams) {
          result.firstPlaceTeams.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.firstPoints + gradePoints;
            console.log(`     ${winner.teamCode} Team (1st, Grade ${winner.grade || 'None'}): ${result.firstPoints} + ${gradePoints} = ${result.firstPoints + gradePoints} pts`);
          });
        }
        if (result.secondPlaceTeams) {
          result.secondPlaceTeams.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.secondPoints + gradePoints;
            console.log(`     ${winner.teamCode} Team (2nd, Grade ${winner.grade || 'None'}): ${result.secondPoints} + ${gradePoints} = ${result.secondPoints + gradePoints} pts`);
          });
        }
        if (result.thirdPlaceTeams) {
          result.thirdPlaceTeams.forEach(winner => {
            totalWinners++;
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += result.thirdPoints + gradePoints;
            console.log(`     ${winner.teamCode} Team (3rd, Grade ${winner.grade || 'None'}): ${result.thirdPoints} + ${gradePoints} = ${result.thirdPoints + gradePoints} pts`);
          });
        }
      });
      
      console.log(`   📊 Summary:`);
      console.log(`     Total Winners: ${totalWinners}`);
      console.log(`     Total Points (With Grades): ${Math.round(totalPoints)}`);
      console.log('');
    });
    
    console.log('🎯 RECOMMENDATIONS:');
    console.log('=' .repeat(40));
    console.log('1. Check if the issue is with specific filter combinations');
    console.log('2. Verify that results have grade data populated');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Compare the calculated values above with what you see in the UI');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  debugFilteredResultsSummary().catch(console.error);
}

module.exports = { debugFilteredResultsSummary };
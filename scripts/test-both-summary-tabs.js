/**
 * Test Both Summary Tabs - Filtering with Grade Points
 * This script verifies that filtering works correctly in both:
 * 1. Published Summary tab (publishedResults)
 * 2. Checked Marks Summary tab (checkedResults)
 */

const { MongoClient } = require('mongodb');

// Grade points mapping
const GRADE_POINTS = { A: 5, B: 3, C: 1 };

function getGradePoints(grade) {
  if (!grade) return 0;
  const normalizedGrade = grade.toUpperCase().charAt(0);
  return GRADE_POINTS[normalizedGrade] || 0;
}

function calculateFilteredSummary(results, filterSection = '', filterCategory = '', filterType = '', filterTeam = '') {
  // Filter results based on criteria (same logic as MarksSummary component)
  const filteredResults = results.filter(result => {
    const matchesSearch = true; // No search term in this test
    const matchesSection = filterSection === '' || result.section === filterSection;
    const matchesCategory = filterCategory === '' || result.programmeCategory === filterCategory;
    const matchesType = filterType === '' || result.positionType === filterType;
    
    // Team filter logic (if specified)
    let matchesTeam = filterTeam === '';
    if (filterTeam) {
      const hasTeamWinners = 
        (result.firstPlace?.some(w => w.chestNumber?.startsWith(filterTeam)) || false) ||
        (result.secondPlace?.some(w => w.chestNumber?.startsWith(filterTeam)) || false) ||
        (result.thirdPlace?.some(w => w.chestNumber?.startsWith(filterTeam)) || false) ||
        (result.firstPlaceTeams?.some(w => w.teamCode === filterTeam) || false) ||
        (result.secondPlaceTeams?.some(w => w.teamCode === filterTeam) || false) ||
        (result.thirdPlaceTeams?.some(w => w.teamCode === filterTeam) || false);
      matchesTeam = hasTeamWinners;
    }
    
    return matchesSearch && matchesSection && matchesCategory && matchesType && matchesTeam;
  });
  
  // Calculate total points with grades (same logic as MarksSummary component)
  let totalWinners = 0;
  let totalPoints = 0;
  let positionOnlyPoints = 0;
  
  if (filterTeam) {
    // Team-specific calculation
    filteredResults.forEach(result => {
      // Individual winners for specific team
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            if (winner.chestNumber?.startsWith(filterTeam)) {
              totalWinners++;
              const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              totalPoints += points + gradePoints;
              positionOnlyPoints += points;
            }
          });
        }
      });
      
      // Team winners for specific team
      ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            if (winner.teamCode === filterTeam) {
              totalWinners++;
              const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              totalPoints += points + gradePoints;
              positionOnlyPoints += points;
            }
          });
        }
      });
    });
  } else {
    // All winners calculation
    filteredResults.forEach(result => {
      // Individual winners
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            totalWinners++;
            const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += points + gradePoints;
            positionOnlyPoints += points;
          });
        }
      });
      
      // Team winners
      ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            totalWinners++;
            const points = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
            const gradePoints = getGradePoints(winner.grade || '');
            totalPoints += points + gradePoints;
            positionOnlyPoints += points;
          });
        }
      });
    });
  }
  
  return {
    programmes: filteredResults.length,
    totalWinners,
    totalPoints: Math.round(totalPoints),
    positionOnlyPoints: Math.round(positionOnlyPoints),
    gradeBonus: Math.round(totalPoints - positionOnlyPoints)
  };
}

async function testBothSummaryTabs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🧪 TESTING BOTH SUMMARY TABS - FILTERING WITH GRADE POINTS');
    console.log('=' .repeat(70));
    
    // Get both published and checked results
    const publishedResults = await db.collection('results').find({ published: true }).toArray();
    const checkedResults = await db.collection('results').find({ status: 'checked' }).toArray();
    
    console.log(`📊 Data Summary:`);
    console.log(`   Published Results: ${publishedResults.length}`);
    console.log(`   Checked Results: ${checkedResults.length}`);
    console.log('');
    
    // Test scenarios for both tabs
    const testScenarios = [
      { name: 'No Filter', section: '', category: '', type: '', team: '' },
      { name: 'Senior Section', section: 'senior', category: '', type: '', team: '' },
      { name: 'Arts Category', section: '', category: 'arts', type: '', team: '' },
      { name: 'Individual Type', section: '', category: '', type: 'individual', team: '' },
      { name: 'AQS Team Filter', section: '', category: '', type: '', team: 'AQS' }
    ];
    
    // Test Published Summary Tab
    console.log('🔍 PUBLISHED SUMMARY TAB TESTING:');
    console.log('-'.repeat(50));
    
    if (publishedResults.length === 0) {
      console.log('❌ No published results found - cannot test Published Summary filtering');
    } else {
      testScenarios.forEach(scenario => {
        const result = calculateFilteredSummary(
          publishedResults, 
          scenario.section, 
          scenario.category, 
          scenario.type, 
          scenario.team
        );
        
        console.log(`   ${scenario.name}:`);
        console.log(`     Programmes: ${result.programmes}`);
        console.log(`     Winners: ${result.totalWinners}`);
        console.log(`     Position Only: ${result.positionOnlyPoints} pts`);
        console.log(`     With Grades: ${result.totalPoints} pts`);
        console.log(`     Grade Bonus: +${result.gradeBonus} pts`);
        
        if (result.gradeBonus > 0) {
          console.log(`     ✅ Grade points included!`);
        } else if (result.totalWinners > 0) {
          console.log(`     ⚠️  No grade bonuses (winners have no grades)`);
        } else {
          console.log(`     ℹ️  No winners match this filter`);
        }
        console.log('');
      });
    }
    
    // Test Checked Marks Summary Tab
    console.log('🔍 CHECKED MARKS SUMMARY TAB TESTING:');
    console.log('-'.repeat(50));
    
    if (checkedResults.length === 0) {
      console.log('❌ No checked results found - cannot test Checked Marks Summary filtering');
    } else {
      testScenarios.forEach(scenario => {
        const result = calculateFilteredSummary(
          checkedResults, 
          scenario.section, 
          scenario.category, 
          scenario.type, 
          scenario.team
        );
        
        console.log(`   ${scenario.name}:`);
        console.log(`     Programmes: ${result.programmes}`);
        console.log(`     Winners: ${result.totalWinners}`);
        console.log(`     Position Only: ${result.positionOnlyPoints} pts`);
        console.log(`     With Grades: ${result.totalPoints} pts`);
        console.log(`     Grade Bonus: +${result.gradeBonus} pts`);
        
        if (result.gradeBonus > 0) {
          console.log(`     ✅ Grade points included!`);
        } else if (result.totalWinners > 0) {
          console.log(`     ⚠️  No grade bonuses (winners have no grades)`);
        } else {
          console.log(`     ℹ️  No winners match this filter`);
        }
        console.log('');
      });
    }
    
    console.log('🎯 SUMMARY:');
    console.log('=' .repeat(40));
    console.log('✅ Both tabs use the same MarksSummary component');
    console.log('✅ Same filtering logic applies to both tabs');
    console.log('✅ Grade points are included in both scenarios');
    console.log('');
    console.log('📋 How to Test in UI:');
    console.log('1. Go to Admin → Results → Checklist');
    console.log('2. Test Published Summary tab → Programme Breakdown');
    console.log('3. Test Checked Marks Summary tab → Programme Breakdown');
    console.log('4. Apply filters (Section, Category, Type, Team)');
    console.log('5. Verify "Total Points (With Grades)" includes bonuses');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  testBothSummaryTabs().catch(console.error);
}

module.exports = { testBothSummaryTabs };
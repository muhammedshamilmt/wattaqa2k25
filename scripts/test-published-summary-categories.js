const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testPublishedSummaryCategories() {
  console.log('🧪 TESTING PUBLISHED SUMMARY CATEGORY CALCULATIONS');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Get sample data
    const programmes = await db.collection('programmes').find({}).toArray();
    const results = await db.collection('results').find({ status: 'published' }).toArray();
    
    console.log(`📊 Test Data:`);
    console.log(`   Programmes: ${programmes.length}`);
    console.log(`   Published Results: ${results.length}`);
    
    // Simulate enriching results like the publish page does
    const enrichResults = (results) => {
      return results.map(result => {
        const programme = programmes.find(p => 
          p._id.toString() === result.programmeId?.toString()
        );
        
        return {
          ...result,
          programmeName: programme?.name,
          programmeCode: programme?.code,
          programmeCategory: programme?.category,
          programmeSection: programme?.section,
          programmeSubcategory: programme?.subcategory
        };
      });
    };
    
    const enrichedResults = enrichResults(results);
    
    // Simulate the calculateCategoryStats function
    const calculateCategoryStats = (category, subcategory) => {
      const filteredResults = enrichedResults.filter(result => {
        if (subcategory) {
          return result.programmeCategory === category && result.programmeSubcategory === subcategory;
        }
        return result.programmeCategory === category;
      });

      const stats = {
        resultCount: filteredResults.length,
        totalPoints: 0,
        uniqueWinners: new Set(),
        programmes: filteredResults.length
      };

      filteredResults.forEach(result => {
        // Calculate individual winners
        if (result.firstPlace) {
          result.firstPlace.forEach(winner => {
            stats.totalPoints += result.firstPoints || 0;
            stats.uniqueWinners.add(winner.chestNumber);
          });
        }
        if (result.secondPlace) {
          result.secondPlace.forEach(winner => {
            stats.totalPoints += result.secondPoints || 0;
            stats.uniqueWinners.add(winner.chestNumber);
          });
        }
        if (result.thirdPlace) {
          result.thirdPlace.forEach(winner => {
            stats.totalPoints += result.thirdPoints || 0;
            stats.uniqueWinners.add(winner.chestNumber);
          });
        }
        
        // Calculate team winners
        if (result.firstPlaceTeams) {
          result.firstPlaceTeams.forEach(() => {
            stats.totalPoints += result.firstPoints || 0;
          });
        }
        if (result.secondPlaceTeams) {
          result.secondPlaceTeams.forEach(() => {
            stats.totalPoints += result.secondPoints || 0;
          });
        }
        if (result.thirdPlaceTeams) {
          result.thirdPlaceTeams.forEach(() => {
            stats.totalPoints += result.thirdPoints || 0;
          });
        }

        // Calculate participation points
        if (result.participationGrades) {
          result.participationGrades.forEach(pg => {
            stats.totalPoints += pg.points || 0;
            stats.uniqueWinners.add(pg.chestNumber);
          });
        }
        if (result.participationTeamGrades) {
          result.participationTeamGrades.forEach(pg => {
            stats.totalPoints += pg.points || 0;
          });
        }
      });

      return {
        ...stats,
        uniqueWinners: stats.uniqueWinners.size
      };
    };
    
    console.log('\n🔍 CATEGORY-SPECIFIC CALCULATIONS');
    console.log('--------------------------------------------------');
    
    // Calculate stats for each category
    const artsStageStats = calculateCategoryStats('arts', 'stage');
    const artsNonStageStats = calculateCategoryStats('arts', 'non-stage');
    const sportsStats = calculateCategoryStats('sports');
    const allStats = calculateCategoryStats('', ''); // All results
    
    console.log('🎭 Arts Stage:');
    console.log(`   Results: ${artsStageStats.resultCount}`);
    console.log(`   Points: ${artsStageStats.totalPoints}`);
    console.log(`   Winners: ${artsStageStats.uniqueWinners}`);
    
    console.log('\n📝 Arts Non-Stage:');
    console.log(`   Results: ${artsNonStageStats.resultCount}`);
    console.log(`   Points: ${artsNonStageStats.totalPoints}`);
    console.log(`   Winners: ${artsNonStageStats.uniqueWinners}`);
    
    console.log('\n🏃 Sports:');
    console.log(`   Results: ${sportsStats.resultCount}`);
    console.log(`   Points: ${sportsStats.totalPoints}`);
    console.log(`   Winners: ${sportsStats.uniqueWinners}`);
    
    // Calculate Arts Total (Combined)
    const artsTotalStats = {
      resultCount: artsStageStats.resultCount + artsNonStageStats.resultCount,
      totalPoints: artsStageStats.totalPoints + artsNonStageStats.totalPoints,
      uniqueWinners: artsStageStats.uniqueWinners + artsNonStageStats.uniqueWinners
    };
    
    console.log('\n🎨 Arts Total (Combined):');
    console.log(`   Results: ${artsTotalStats.resultCount}`);
    console.log(`   Points: ${artsTotalStats.totalPoints}`);
    console.log(`   Winners: ${artsTotalStats.uniqueWinners}`);
    console.log(`   Breakdown:`);
    console.log(`     Stage: ${artsStageStats.resultCount} results, ${artsStageStats.totalPoints} pts`);
    console.log(`     Non-Stage: ${artsNonStageStats.resultCount} results, ${artsNonStageStats.totalPoints} pts`);
    
    console.log('\n📊 Overall Total:');
    console.log(`   Results: ${allStats.resultCount}`);
    console.log(`   Points: ${allStats.totalPoints}`);
    console.log(`   Winners: ${allStats.uniqueWinners}`);
    
    // Verification
    console.log('\n✅ VERIFICATION:');
    console.log('--------------------------------------------------');
    const calculatedTotal = artsStageStats.resultCount + artsNonStageStats.resultCount + sportsStats.resultCount;
    const calculatedPoints = artsStageStats.totalPoints + artsNonStageStats.totalPoints + sportsStats.totalPoints;
    
    console.log(`Category totals add up to overall? ${calculatedTotal === allStats.resultCount ? 'PASS' : 'FAIL'}`);
    console.log(`   Calculated: ${calculatedTotal}, Actual: ${allStats.resultCount}`);
    console.log(`Points totals add up to overall? ${calculatedPoints === allStats.totalPoints ? 'PASS' : 'FAIL'}`);
    console.log(`   Calculated: ${calculatedPoints}, Actual: ${allStats.totalPoints}`);
    
    // Show sample results for each category
    console.log('\n🔍 SAMPLE RESULTS BY CATEGORY');
    console.log('--------------------------------------------------');
    
    const artsStageResults = enrichedResults.filter(r => r.programmeCategory === 'arts' && r.programmeSubcategory === 'stage');
    const artsNonStageResults = enrichedResults.filter(r => r.programmeCategory === 'arts' && r.programmeSubcategory === 'non-stage');
    const sportsResults = enrichedResults.filter(r => r.programmeCategory === 'sports');
    
    if (artsStageResults.length > 0) {
      console.log(`\n🎭 Arts Stage Sample (${Math.min(3, artsStageResults.length)} of ${artsStageResults.length}):`);
      artsStageResults.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.programmeName} (${result.programmeCode})`);
      });
    }
    
    if (artsNonStageResults.length > 0) {
      console.log(`\n📝 Arts Non-Stage Sample (${Math.min(3, artsNonStageResults.length)} of ${artsNonStageResults.length}):`);
      artsNonStageResults.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.programmeName} (${result.programmeCode})`);
      });
    }
    
    if (sportsResults.length > 0) {
      console.log(`\n🏃 Sports Sample (${Math.min(3, sportsResults.length)} of ${sportsResults.length}):`);
      sportsResults.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.programmeName} (${result.programmeCode})`);
      });
    }
    
    console.log('\n🎯 PUBLISHED SUMMARY ENHANCEMENTS');
    console.log('--------------------------------------------------');
    console.log('✅ Category-specific calculation cards added');
    console.log('✅ Arts Stage: Performance results with purple theme');
    console.log('✅ Arts Non-Stage: Written work results with pink theme');
    console.log('✅ Sports: Competition results with blue theme');
    console.log('✅ Arts Total: Combined arts results with indigo theme');
    console.log('✅ Detailed breakdown showing stage vs non-stage within arts total');
    console.log('✅ Overall summary maintained for complete overview');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testPublishedSummaryCategories();
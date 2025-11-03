/**
 * Debug Daily Progress Issues
 * This script will help identify why daily progress is not working
 */

const { MongoClient } = require('mongodb');

async function debugDailyProgress() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 DEBUGGING DAILY PROGRESS ISSUES');
    console.log('=' .repeat(60));
    
    // Get published results
    const publishedResults = await db.collection('results').find({ published: true }).toArray();
    const checkedResults = await db.collection('results').find({ status: 'checked' }).toArray();
    
    console.log(`📊 Data Summary:`);
    console.log(`   Published Results: ${publishedResults.length}`);
    console.log(`   Checked Results: ${checkedResults.length}`);
    console.log('');
    
    // Check dates in published results
    console.log('📅 PUBLISHED RESULTS DATE ANALYSIS:');
    console.log('-'.repeat(50));
    
    if (publishedResults.length === 0) {
      console.log('❌ No published results found - this explains why daily progress is empty');
    } else {
      const dateGroups = {};
      publishedResults.forEach((result, idx) => {
        const createdAt = result.createdAt || result.updatedAt || 'No date';
        const dateStr = createdAt !== 'No date' ? new Date(createdAt).toDateString() : 'Invalid Date';
        
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = [];
        }
        dateGroups[dateStr].push(result);
        
        if (idx < 5) { // Show first 5 results
          console.log(`   ${idx + 1}. ${result.programmeName || 'Unknown'}`);
          console.log(`      Created: ${createdAt}`);
          console.log(`      Date String: ${dateStr}`);
          console.log(`      Winners: ${(result.firstPlace?.length || 0) + (result.secondPlace?.length || 0) + (result.thirdPlace?.length || 0)}`);
          console.log('');
        }
      });
      
      console.log('📊 DATE GROUPS SUMMARY:');
      Object.entries(dateGroups).forEach(([date, results]) => {
        console.log(`   ${date}: ${results.length} results`);
      });
    }
    
    console.log('');
    console.log('📅 CHECKED RESULTS DATE ANALYSIS:');
    console.log('-'.repeat(50));
    
    if (checkedResults.length === 0) {
      console.log('❌ No checked results found - this explains why daily progress is empty in checklist');
    } else {
      const dateGroups = {};
      checkedResults.forEach((result, idx) => {
        const createdAt = result.createdAt || result.updatedAt || 'No date';
        const dateStr = createdAt !== 'No date' ? new Date(createdAt).toDateString() : 'Invalid Date';
        
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = [];
        }
        dateGroups[dateStr].push(result);
        
        if (idx < 5) { // Show first 5 results
          console.log(`   ${idx + 1}. ${result.programmeName || 'Unknown'}`);
          console.log(`      Created: ${createdAt}`);
          console.log(`      Date String: ${dateStr}`);
          console.log(`      Winners: ${(result.firstPlace?.length || 0) + (result.secondPlace?.length || 0) + (result.thirdPlace?.length || 0)}`);
          console.log('');
        }
      });
      
      console.log('📊 DATE GROUPS SUMMARY:');
      Object.entries(dateGroups).forEach(([date, results]) => {
        console.log(`   ${date}: ${results.length} results`);
      });
    }
    
    console.log('');
    console.log('🎯 RECOMMENDATIONS:');
    console.log('=' .repeat(40));
    
    if (publishedResults.length === 0 && checkedResults.length === 0) {
      console.log('1. ❌ No results found - add some results first');
    } else if (publishedResults.length === 0) {
      console.log('1. ✅ Checked results exist, but no published results');
      console.log('   - Daily progress in "Published Summary" will be empty');
      console.log('   - Daily progress in "Checked Marks Summary" should work');
    } else if (checkedResults.length === 0) {
      console.log('1. ✅ Published results exist, but no checked results');
      console.log('   - Daily progress in "Published Summary" should work');
      console.log('   - Daily progress in "Checked Marks Summary" will be empty');
    } else {
      console.log('1. ✅ Both published and checked results exist');
      console.log('   - Both daily progress views should work');
    }
    
    console.log('2. 🔧 If daily progress still doesn\'t work:');
    console.log('   - Check browser console for errors');
    console.log('   - Verify results have valid createdAt dates');
    console.log('   - Check if teams data is loading properly');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  debugDailyProgress().catch(console.error);
}

module.exports = { debugDailyProgress };
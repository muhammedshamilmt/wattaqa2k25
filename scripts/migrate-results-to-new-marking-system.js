const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Marking system functions
function getPositionPoints(section, positionType) {
  const normalizedSection = section.toLowerCase();
  const normalizedPositionType = positionType.toLowerCase();

  if (normalizedSection === 'general') {
    if (normalizedPositionType === 'individual') {
      return { first: 10, second: 6, third: 3 };
    } else if (normalizedPositionType === 'group' || normalizedPositionType === 'general') {
      return { first: 15, second: 10, third: 5 };
    }
  }
  
  if (['senior', 'junior', 'sub-junior'].includes(normalizedSection)) {
    if (normalizedPositionType === 'individual') {
      return { first: 3, second: 2, third: 1 };
    } else if (normalizedPositionType === 'group' || normalizedPositionType === 'general') {
      return { first: 5, second: 3, third: 1 };
    }
  }

  return { first: 1, second: 1, third: 1 };
}

async function migrateResultsToNewMarkingSystem() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔄 MIGRATING RESULTS TO NEW MARKING SYSTEM\n');
    
    const db = client.db('wattaqa-festival-2k25');
    const resultsCollection = db.collection('results');
    const programmesCollection = db.collection('programmes');
    
    // Get all results and programmes
    const results = await resultsCollection.find({}).toArray();
    const programmes = await programmesCollection.find({}).toArray();
    
    console.log(`📊 Found ${results.length} results to check`);
    console.log(`📋 Found ${programmes.length} programmes for reference\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const result of results) {
      try {
        // Find the programme for this result
        let programme = null;
        
        // Method 1: Try to match by programmeId
        if (result.programmeId) {
          programme = programmes.find(p => p._id.toString() === result.programmeId);
        }
        
        // Method 2: Try to match by programme name/code
        if (!programme && result.programme) {
          programme = programmes.find(p => 
            result.programme.includes(p.name) || 
            result.programme.includes(p.code) ||
            p.name.includes(result.programme) ||
            p.code.includes(result.programme)
          );
        }
        
        if (programme) {
          // Calculate correct points based on programme
          const correctPoints = getPositionPoints(programme.section, programme.positionType);
          
          // Check if points need updating
          const needsUpdate = 
            result.firstPoints !== correctPoints.first ||
            result.secondPoints !== correctPoints.second ||
            result.thirdPoints !== correctPoints.third;
          
          if (needsUpdate) {
            console.log(`🔄 Updating: ${result.programme || programme.name}`);
            console.log(`   Old Points: 1st=${result.firstPoints}, 2nd=${result.secondPoints}, 3rd=${result.thirdPoints}`);
            console.log(`   New Points: 1st=${correctPoints.first}, 2nd=${correctPoints.second}, 3rd=${correctPoints.third}`);
            
            // Update the result
            await resultsCollection.updateOne(
              { _id: result._id },
              {
                $set: {
                  firstPoints: correctPoints.first,
                  secondPoints: correctPoints.second,
                  thirdPoints: correctPoints.third,
                  // Also update programmeId if it was missing
                  ...(result.programmeId ? {} : { programmeId: programme._id.toString() }),
                  // Update section and positionType to match programme
                  section: programme.section,
                  positionType: programme.positionType,
                  updatedAt: new Date()
                }
              }
            );
            
            updatedCount++;
          } else {
            console.log(`✅ Correct: ${result.programme || programme.name} (no update needed)`);
            skippedCount++;
          }
        } else {
          console.log(`❌ No programme found for result: ${result.programme || 'Unknown'}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`❌ Error processing result ${result._id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('=====================================');
    console.log(`✅ Results Updated: ${updatedCount}`);
    console.log(`⏭️  Results Skipped (already correct): ${skippedCount}`);
    console.log(`❌ Results with Errors: ${errorCount}`);
    console.log(`📊 Total Results Processed: ${results.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('All results now use the correct marking system points.');
    } else if (skippedCount === results.length) {
      console.log('\n✨ All results were already using the correct marking system!');
    } else {
      console.log('\n⚠️  Migration completed with some issues.');
      console.log('Please review the error messages above.');
    }
    
    // Verify the migration
    console.log('\n🔍 VERIFICATION:');
    console.log('=====================================');
    
    const updatedResults = await resultsCollection.find({}).toArray();
    let verificationPassed = 0;
    let verificationFailed = 0;
    
    for (const result of updatedResults) {
      const programme = programmes.find(p => 
        p._id.toString() === result.programmeId ||
        (result.programme && (
          result.programme.includes(p.name) || 
          result.programme.includes(p.code)
        ))
      );
      
      if (programme) {
        const expectedPoints = getPositionPoints(programme.section, programme.positionType);
        
        if (result.firstPoints === expectedPoints.first && 
            result.secondPoints === expectedPoints.second && 
            result.thirdPoints === expectedPoints.third) {
          verificationPassed++;
        } else {
          verificationFailed++;
        }
      }
    }
    
    console.log(`✅ Verified Correct: ${verificationPassed}`);
    console.log(`❌ Still Incorrect: ${verificationFailed}`);
    
    if (verificationFailed === 0) {
      console.log('\n🎊 PERFECT! All results are now using the correct marking system!');
    }
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await client.close();
  }
}

// Run with confirmation
console.log('⚠️  WARNING: This script will update existing results in the database.');
console.log('Make sure you have a backup before proceeding.\n');

migrateResultsToNewMarkingSystem();
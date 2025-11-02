const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function debugProgrammeNames() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';
  console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('=== DEBUGGING PROGRAMME NAMES ISSUE ===\n');
    
    // Check programmes collection
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log('1. PROGRAMMES COLLECTION:');
    console.log(`   Total programmes: ${programmes.length}`);
    
    if (programmes.length > 0) {
      console.log('   Sample programmes:');
      programmes.slice(0, 5).forEach(prog => {
        console.log(`   - ID: ${prog._id}, Name: "${prog.name}", Code: "${prog.code}"`);
      });
    } else {
      console.log('   ❌ No programmes found!');
    }
    
    // Check results collection
    const results = await db.collection('results').find({ status: 'published' }).toArray();
    console.log(`\n2. PUBLISHED RESULTS (${results.length} total):`);
    
    if (results.length > 0) {
      console.log('   Sample results with programme info:');
      results.slice(0, 5).forEach((result, idx) => {
        console.log(`   Result ${idx + 1}:`);
        console.log(`     - Programme ID: ${result.programmeId}`);
        console.log(`     - Programme Name: "${result.programmeName || 'NOT SET'}"`);
        console.log(`     - Programme Code: "${result.programmeCode || 'NOT SET'}"`);
        console.log(`     - Category: "${result.programmeCategory || 'NOT SET'}"`);
        console.log(`     - Section: "${result.section || 'NOT SET'}"`);
        console.log(`     - Position Type: "${result.positionType || 'NOT SET'}"`);
        
        // Try to find matching programme
        if (result.programmeId) {
          const matchingProg = programmes.find(p => 
            p._id.toString() === result.programmeId.toString()
          );
          if (matchingProg) {
            console.log(`     ✅ Found matching programme: "${matchingProg.name}"`);
          } else {
            console.log(`     ❌ No matching programme found for ID: ${result.programmeId}`);
          }
        } else {
          console.log(`     ❌ No programmeId field in result`);
        }
        console.log('');
      });
    } else {
      console.log('   ❌ No published results found!');
    }
    
    // Check if programme IDs match
    console.log('3. PROGRAMME ID MATCHING:');
    const resultProgrammeIds = [...new Set(results.map(r => r.programmeId).filter(Boolean))];
    const programmeIds = programmes.map(p => p._id.toString());
    
    console.log(`   Result programme IDs: ${resultProgrammeIds.length}`);
    console.log(`   Available programme IDs: ${programmeIds.length}`);
    
    const matchingIds = resultProgrammeIds.filter(id => 
      programmeIds.includes(id.toString())
    );
    
    console.log(`   Matching IDs: ${matchingIds.length}`);
    
    if (matchingIds.length === 0 && resultProgrammeIds.length > 0) {
      console.log('   ❌ NO MATCHING PROGRAMME IDs FOUND!');
      console.log('   This explains why all programmes show as "Unknown Programme"');
      
      console.log('\n   Sample result programme IDs:');
      resultProgrammeIds.slice(0, 3).forEach(id => {
        console.log(`     - "${id}" (type: ${typeof id})`);
      });
      
      console.log('\n   Sample programme IDs:');
      programmeIds.slice(0, 3).forEach(id => {
        console.log(`     - "${id}" (type: ${typeof id})`);
      });
    } else {
      console.log('   ✅ Programme IDs match correctly');
    }
    
    // Summary and recommendations
    console.log('\n4. SUMMARY & RECOMMENDATIONS:');
    
    if (programmes.length === 0) {
      console.log('   🔧 No programmes found - run: node scripts/init-db.js');
    } else if (results.length === 0) {
      console.log('   🔧 No published results found - publish some results first');
    } else if (matchingIds.length === 0) {
      console.log('   🔧 Programme IDs don\'t match - results may be from different database');
      console.log('   🔧 Try re-creating results or updating programme IDs in results');
    } else {
      console.log('   ✅ Data looks correct - issue might be in the frontend code');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the debug function
debugProgrammeNames().catch(console.error);
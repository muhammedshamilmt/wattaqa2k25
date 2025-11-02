const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function fixProgrammeNamesInResults() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';
  console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('=== FIXING PROGRAMME NAMES IN RESULTS ===\n');
    
    // Get all programmes
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`Found ${programmes.length} programmes in database`);
    
    // Get all results that need fixing
    const results = await db.collection('results').find({
      $or: [
        { programmeName: { $exists: false } },
        { programmeName: null },
        { programmeName: "" },
        { programmeName: "NOT SET" }
      ]
    }).toArray();
    
    console.log(`Found ${results.length} results that need programme name fixes`);
    
    if (results.length === 0) {
      console.log('✅ All results already have programme names set');
      return;
    }
    
    // Since programme IDs don't match, we'll need to map by section and position type
    // This is a best-guess mapping based on the programme structure
    const programmeMapping = {
      // Senior programmes
      'senior-individual': programmes.filter(p => p.section === 'senior' && p.positionType === 'individual'),
      'senior-group': programmes.filter(p => p.section === 'senior' && p.positionType === 'group'),
      
      // Junior programmes  
      'junior-individual': programmes.filter(p => p.section === 'junior' && p.positionType === 'individual'),
      'junior-group': programmes.filter(p => p.section === 'junior' && p.positionType === 'group'),
      
      // Sub-junior programmes
      'sub-junior-individual': programmes.filter(p => p.section === 'sub-junior' && p.positionType === 'individual'),
      'sub-junior-group': programmes.filter(p => p.section === 'sub-junior' && p.positionType === 'group'),
      
      // General programmes
      'general-individual': programmes.filter(p => p.section === 'general' && p.positionType === 'individual'),
      'general-group': programmes.filter(p => p.section === 'general' && p.positionType === 'group'),
    };
    
    console.log('\nProgramme mapping:');
    Object.keys(programmeMapping).forEach(key => {
      console.log(`- ${key}: ${programmeMapping[key].length} programmes`);
    });
    
    let updatedCount = 0;
    
    // Update each result with a matching programme
    for (const result of results) {
      const key = `${result.section}-${result.positionType}`;
      const availablePrograms = programmeMapping[key] || [];
      
      if (availablePrograms.length > 0) {
        // Use the first available programme for this section/type combination
        // In a real scenario, you might want more sophisticated matching
        const programme = availablePrograms[updatedCount % availablePrograms.length];
        
        const updateData = {
          programmeId: programme._id,
          programmeName: programme.name,
          programmeCode: programme.code,
          programmeCategory: programme.category,
          programmeSection: programme.section
        };
        
        await db.collection('results').updateOne(
          { _id: result._id },
          { $set: updateData }
        );
        
        console.log(`✅ Updated result ${result._id}: "${programme.name}" (${programme.code})`);
        updatedCount++;
      } else {
        console.log(`❌ No matching programme found for ${key}`);
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} results with programme information`);
    
    // Verify the fix
    const verifyResults = await db.collection('results').find({
      programmeName: { $exists: true, $ne: null, $ne: "", $ne: "NOT SET" }
    }).toArray();
    
    console.log(`\n✅ Verification: ${verifyResults.length} results now have programme names`);
    
    if (verifyResults.length > 0) {
      console.log('\nSample updated results:');
      verifyResults.slice(0, 3).forEach((result, idx) => {
        console.log(`${idx + 1}. "${result.programmeName}" (${result.programmeCode}) - ${result.section} ${result.positionType}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixProgrammeNamesInResults().catch(console.error);
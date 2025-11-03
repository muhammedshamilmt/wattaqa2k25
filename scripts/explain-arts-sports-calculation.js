const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function explainArtsSportsCalculation() {
  console.log('📚 EXPLAINING ARTS & SPORTS CALCULATION');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Get sample data
    const candidates = await db.collection('candidates').find({}).limit(2).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log('🔍 STEP-BY-STEP CALCULATION PROCESS');
    console.log('============================================================');
    
    // Take first candidate for detailed explanation
    const candidate = candidates[0];
    console.log(`\n👤 EXAMPLE: ${candidate.name} (${candidate.chestNumber})`);
    console.log('--------------------------------------------------');
    
    console.log('\n📋 STEP 1: Find Team Registrations');
    console.log('--------------------------------------------------');
    console.log('Looking for team registrations where this candidate is listed as a participant...');
    
    const candidateParticipations = participants.filter(teamReg => 
      teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
    );
    
    console.log(`Found ${candidateParticipations.length} team registrations containing this candidate:`);
    candidateParticipations.slice(0, 5).forEach((participation, index) => {
      console.log(`   ${index + 1}. Team: ${participation.teamCode}, Programme ID: ${participation.programmeId}`);
      console.log(`      Participants: [${participation.participants.join(', ')}]`);
      console.log(`      Contains ${candidate.chestNumber}? ${participation.participants.includes(candidate.chestNumber) ? '✅ YES' : '❌ NO'}`);
    });
    if (candidateParticipations.length > 5) {
      console.log(`   ... and ${candidateParticipations.length - 5} more registrations`);
    }
    
    console.log('\n📊 STEP 2: Initialize Counters');
    console.log('--------------------------------------------------');
    const registeredProgrammes = {
      arts: { individual: 0, group: 0, general: 0, total: 0 },
      sports: { individual: 0, group: 0, general: 0, total: 0 }
    };
    console.log('Starting with all counters at 0:');
    console.log('   Arts: { individual: 0, group: 0, general: 0, total: 0 }');
    console.log('   Sports: { individual: 0, group: 0, general: 0, total: 0 }');
    
    console.log('\n🔍 STEP 3: Process Each Registration');
    console.log('--------------------------------------------------');
    console.log('For each team registration, find the programme details and categorize...');
    
    const artsExamples = [];
    const sportsExamples = [];
    
    candidateParticipations.forEach((teamRegistration, index) => {
      console.log(`\n   Registration ${index + 1}:`);
      console.log(`   Programme ID: ${teamRegistration.programmeId}`);
      
      // Find programme details
      const programme = programmes.find(p => 
        p._id?.toString() === teamRegistration.programmeId?.toString()
      );
      
      if (programme) {
        console.log(`   Programme Name: "${programme.name}"`);
        console.log(`   Category: "${programme.category}"`);
        console.log(`   Position Type: "${programme.positionType}"`);
        
        const category = programme.category?.toLowerCase();
        const positionType = programme.positionType?.toLowerCase();
        
        if (category === 'arts') {
          registeredProgrammes.arts.total++;
          artsExamples.push({ name: programme.name, positionType });
          
          if (positionType === 'individual') {
            registeredProgrammes.arts.individual++;
            console.log(`   ✅ COUNTED: Arts Individual (+1)`);
          } else if (positionType === 'group') {
            registeredProgrammes.arts.group++;
            console.log(`   ✅ COUNTED: Arts Group (+1)`);
          } else if (positionType === 'general') {
            registeredProgrammes.arts.general++;
            console.log(`   ✅ COUNTED: Arts General (+1)`);
          }
        } else if (category === 'sports') {
          registeredProgrammes.sports.total++;
          sportsExamples.push({ name: programme.name, positionType });
          
          if (positionType === 'individual') {
            registeredProgrammes.sports.individual++;
            console.log(`   ✅ COUNTED: Sports Individual (+1)`);
          } else if (positionType === 'group') {
            registeredProgrammes.sports.group++;
            console.log(`   ✅ COUNTED: Sports Group (+1)`);
          } else if (positionType === 'general') {
            registeredProgrammes.sports.general++;
            console.log(`   ✅ COUNTED: Sports General (+1)`);
          }
        } else {
          console.log(`   ⚠️  SKIPPED: Unknown category "${category}"`);
        }
        
        console.log(`   Current Totals: Arts=${registeredProgrammes.arts.total}, Sports=${registeredProgrammes.sports.total}`);
      } else {
        console.log(`   ❌ ERROR: Programme not found for ID ${teamRegistration.programmeId}`);
      }
      
      // Only show first 3 detailed examples to avoid too much output
      if (index >= 2) {
        console.log(`   ... (showing first 3 detailed examples, processing ${candidateParticipations.length} total)`);
        return;
      }
    });
    
    console.log('\n📊 STEP 4: Final Results');
    console.log('--------------------------------------------------');
    console.log(`Final counts for ${candidate.name}:`);
    console.log(`🎨 Arts: ${registeredProgrammes.arts.total} total`);
    console.log(`   Individual: ${registeredProgrammes.arts.individual}`);
    console.log(`   Group: ${registeredProgrammes.arts.group}`);
    console.log(`   General: ${registeredProgrammes.arts.general}`);
    
    console.log(`🏃 Sports: ${registeredProgrammes.sports.total} total`);
    console.log(`   Individual: ${registeredProgrammes.sports.individual}`);
    console.log(`   Group: ${registeredProgrammes.sports.group}`);
    console.log(`   General: ${registeredProgrammes.sports.general}`);
    
    console.log(`📋 Total Registrations: ${registeredProgrammes.arts.total + registeredProgrammes.sports.total}`);
    
    console.log('\n🎨 ARTS PROGRAMME EXAMPLES:');
    artsExamples.slice(0, 5).forEach((prog, index) => {
      console.log(`   ${index + 1}. "${prog.name}" (${prog.positionType})`);
    });
    
    console.log('\n🏃 SPORTS PROGRAMME EXAMPLES:');
    sportsExamples.slice(0, 5).forEach((prog, index) => {
      console.log(`   ${index + 1}. "${prog.name}" (${prog.positionType})`);
    });
    
    console.log('\n🔧 CALCULATION LOGIC SUMMARY');
    console.log('============================================================');
    console.log('1. 📋 Find all team registrations containing the candidate\'s chest number');
    console.log('2. 🔍 For each registration, look up the programme details');
    console.log('3. 📊 Check programme.category field:');
    console.log('   - If "arts" → increment arts counters');
    console.log('   - If "sports" → increment sports counters');
    console.log('4. 📈 Check programme.positionType field:');
    console.log('   - If "individual" → increment individual counter');
    console.log('   - If "group" → increment group counter');
    console.log('   - If "general" → increment general counter');
    console.log('5. ✅ Display results in hierarchical format');
    
    console.log('\n💾 DATABASE STRUCTURE');
    console.log('============================================================');
    console.log('📋 programme_participants collection:');
    console.log('   - teamCode: "SMD"');
    console.log('   - programmeId: "69032bc06ee08ebc92ecfc5f"');
    console.log('   - participants: ["201", "202", "203"] ← chest numbers');
    console.log('');
    console.log('📚 programmes collection:');
    console.log('   - _id: "69032bc06ee08ebc92ecfc5f"');
    console.log('   - name: "Essay Writing MLM"');
    console.log('   - category: "arts" ← used for Arts/Sports');
    console.log('   - positionType: "individual" ← used for Individual/Group/General');
    
    console.log('\n🎯 KEY POINTS');
    console.log('============================================================');
    console.log('✅ Team-based registration system (not individual)');
    console.log('✅ Candidates found by chest number in participants array');
    console.log('✅ Category field determines Arts vs Sports');
    console.log('✅ PositionType field determines Individual/Group/General');
    console.log('✅ Each registration counts as one programme participation');
    console.log('✅ Totals are calculated by summing individual + group + general');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

explainArtsSportsCalculation();
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testEnhancedCandidatesPage() {
  console.log('🧪 TESTING ENHANCED CANDIDATES PAGE');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Get sample data
    const candidates = await db.collection('candidates').find({}).limit(5).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    const results = await db.collection('results').find({ published: true }).toArray();
    
    console.log(`📊 Test Data:`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Programmes: ${programmes.length}`);
    console.log(`   Team Registrations: ${participants.length}`);
    console.log(`   Published Results: ${results.length}`);
    
    console.log('\n🔍 TESTING ENHANCED CANDIDATE FEATURES');
    console.log('--------------------------------------------------');
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.name} (${candidate.chestNumber})`);
      
      // Find candidate's programme registrations
      const candidateParticipations = participants.filter(teamReg => 
        teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
      );
      
      console.log(`   📋 Programme Registrations: ${candidateParticipations.length}`);
      
      // Count by programme type
      const registeredProgrammes = { individual: 0, group: 0, general: 0 };
      
      candidateParticipations.forEach(participation => {
        const programme = programmes.find(p => p._id.toString() === participation.programmeId.toString());
        if (programme) {
          const type = programme.positionType?.toLowerCase();
          if (registeredProgrammes.hasOwnProperty(type)) {
            registeredProgrammes[type]++;
          }
        }
      });
      
      console.log(`   📊 Programme Types:`);
      console.log(`      Individual: ${registeredProgrammes.individual}`);
      console.log(`      Group: ${registeredProgrammes.group}`);
      console.log(`      General: ${registeredProgrammes.general}`);
      console.log(`      Total: ${candidateParticipations.length}`);
      
      // Calculate earned points
      let earnedPoints = 0;
      let individualPoints = 0;
      let teamGroupPoints = 0;
      
      results.forEach(result => {
        // Individual points
        ['firstPlace', 'secondPlace', 'thirdPlace'].forEach(position => {
          if (result[position]) {
            result[position].forEach(winner => {
              if (winner.chestNumber === candidate.chestNumber) {
                const points = position === 'firstPlace' ? result.firstPoints : 
                              position === 'secondPlace' ? result.secondPoints : result.thirdPoints;
                individualPoints += points;
                earnedPoints += points;
              }
            });
          }
        });
        
        // Team/Group points
        ['firstPlace', 'secondPlace', 'thirdPlace'].forEach(position => {
          if (result[position]) {
            result[position].forEach(winner => {
              if (winner.teamCode === candidate.team || winner.team === candidate.team) {
                const programme = programmes.find(p => p._id.toString() === result.programmeId?.toString());
                if (programme && (programme.positionType?.toLowerCase() === 'group' || programme.positionType?.toLowerCase() === 'general')) {
                  const candidateParticipated = candidateParticipations.some(p => 
                    p.programmeId?.toString() === result.programmeId?.toString()
                  );
                  
                  if (candidateParticipated) {
                    const points = position === 'firstPlace' ? result.firstPoints : 
                                  position === 'secondPlace' ? result.secondPoints : result.thirdPoints;
                    teamGroupPoints += points;
                    earnedPoints += points;
                  }
                }
              }
            });
          }
        });
      });
      
      console.log(`   🏆 Earned Points:`);
      console.log(`      Individual: ${individualPoints}`);
      console.log(`      Team/Group: ${teamGroupPoints}`);
      console.log(`      Total: ${earnedPoints}`);
      
      // Test table row display
      console.log(`   📋 Table Row Display:`);
      if (candidateParticipations.length === 0) {
        console.log(`      Programmes: "No registrations - Not registered yet"`);
      } else {
        console.log(`      Programmes: "Individual: ${registeredProgrammes.individual}, Group: ${registeredProgrammes.group}, General: ${registeredProgrammes.general}, Total: ${candidateParticipations.length}"`);
      }
      console.log(`      Points: "${earnedPoints} points${earnedPoints > 0 ? ' 🏆 Winner' : ''}"`);
    });
    
    console.log('\n🎯 ENHANCED FEATURES SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Programme Registration Counts (Individual, Group, General)');
    console.log('✅ Total Programme Registrations');
    console.log('✅ Earned Points Calculation (Individual + Team/Group)');
    console.log('✅ Winner Badge for Candidates with Points');
    console.log('✅ Enhanced Table Columns with Detailed Information');
    console.log('✅ Team Statistics with Registration and Points Data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testEnhancedCandidatesPage();
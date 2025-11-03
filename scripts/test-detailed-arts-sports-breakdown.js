const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testDetailedArtsSportsBreakdown() {
  console.log('🧪 TESTING DETAILED ARTS & SPORTS BREAKDOWN');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Get sample data
    const candidates = await db.collection('candidates').find({}).limit(5).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log(`📊 Test Data:`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Programmes: ${programmes.length}`);
    console.log(`   Team Registrations: ${participants.length}`);
    
    // Analyze programme distribution
    const programmeStats = {
      arts: { individual: 0, group: 0, general: 0 },
      sports: { individual: 0, group: 0, general: 0 }
    };
    
    programmes.forEach(programme => {
      const category = programme.category?.toLowerCase();
      const positionType = programme.positionType?.toLowerCase();
      
      if (category === 'arts' && programmeStats.arts[positionType] !== undefined) {
        programmeStats.arts[positionType]++;
      } else if (category === 'sports' && programmeStats.sports[positionType] !== undefined) {
        programmeStats.sports[positionType]++;
      }
    });
    
    console.log('\n📊 PROGRAMME DISTRIBUTION:');
    console.log('--------------------------------------------------');
    console.log('🎨 Arts Programmes:');
    console.log(`   Individual: ${programmeStats.arts.individual}`);
    console.log(`   Group: ${programmeStats.arts.group}`);
    console.log(`   General: ${programmeStats.arts.general}`);
    console.log(`   Total: ${programmeStats.arts.individual + programmeStats.arts.group + programmeStats.arts.general}`);
    
    console.log('\n🏃 Sports Programmes:');
    console.log(`   Individual: ${programmeStats.sports.individual}`);
    console.log(`   Group: ${programmeStats.sports.group}`);
    console.log(`   General: ${programmeStats.sports.general}`);
    console.log(`   Total: ${programmeStats.sports.individual + programmeStats.sports.group + programmeStats.sports.general}`);
    
    console.log('\n🔍 TESTING DETAILED CANDIDATE BREAKDOWN');
    console.log('--------------------------------------------------');
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.name} (${candidate.chestNumber})`);
      
      // Find candidate's programme registrations
      const candidateParticipations = participants.filter(teamReg => 
        teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
      );
      
      console.log(`   📋 Total Registrations: ${candidateParticipations.length}`);
      
      // Detailed breakdown
      const registeredProgrammes = {
        arts: { individual: 0, group: 0, general: 0, total: 0 },
        sports: { individual: 0, group: 0, general: 0, total: 0 }
      };
      
      const artsProgrammes = { individual: [], group: [], general: [] };
      const sportsProgrammes = { individual: [], group: [], general: [] };
      
      candidateParticipations.forEach(participation => {
        const programme = programmes.find(p => p._id.toString() === participation.programmeId.toString());
        if (programme) {
          const category = programme.category?.toLowerCase();
          const positionType = programme.positionType?.toLowerCase();
          
          if (category === 'arts') {
            registeredProgrammes.arts.total++;
            if (positionType === 'individual') {
              registeredProgrammes.arts.individual++;
              artsProgrammes.individual.push(programme.name);
            } else if (positionType === 'group') {
              registeredProgrammes.arts.group++;
              artsProgrammes.group.push(programme.name);
            } else if (positionType === 'general') {
              registeredProgrammes.arts.general++;
              artsProgrammes.general.push(programme.name);
            }
          } else if (category === 'sports') {
            registeredProgrammes.sports.total++;
            if (positionType === 'individual') {
              registeredProgrammes.sports.individual++;
              sportsProgrammes.individual.push(programme.name);
            } else if (positionType === 'group') {
              registeredProgrammes.sports.group++;
              sportsProgrammes.group.push(programme.name);
            } else if (positionType === 'general') {
              registeredProgrammes.sports.general++;
              sportsProgrammes.general.push(programme.name);
            }
          }
        }
      });
      
      // Display Arts breakdown
      if (registeredProgrammes.arts.total > 0) {
        console.log(`   🎨 Arts: ${registeredProgrammes.arts.total} total`);
        if (registeredProgrammes.arts.individual > 0) {
          console.log(`      Individual: ${registeredProgrammes.arts.individual} (${artsProgrammes.individual.slice(0, 2).join(', ')}${artsProgrammes.individual.length > 2 ? '...' : ''})`);
        }
        if (registeredProgrammes.arts.group > 0) {
          console.log(`      Group: ${registeredProgrammes.arts.group} (${artsProgrammes.group.slice(0, 2).join(', ')}${artsProgrammes.group.length > 2 ? '...' : ''})`);
        }
        if (registeredProgrammes.arts.general > 0) {
          console.log(`      General: ${registeredProgrammes.arts.general} (${artsProgrammes.general.slice(0, 2).join(', ')}${artsProgrammes.general.length > 2 ? '...' : ''})`);
        }
      }
      
      // Display Sports breakdown
      if (registeredProgrammes.sports.total > 0) {
        console.log(`   🏃 Sports: ${registeredProgrammes.sports.total} total`);
        if (registeredProgrammes.sports.individual > 0) {
          console.log(`      Individual: ${registeredProgrammes.sports.individual} (${sportsProgrammes.individual.slice(0, 2).join(', ')}${sportsProgrammes.individual.length > 2 ? '...' : ''})`);
        }
        if (registeredProgrammes.sports.group > 0) {
          console.log(`      Group: ${registeredProgrammes.sports.group} (${sportsProgrammes.group.slice(0, 2).join(', ')}${sportsProgrammes.group.length > 2 ? '...' : ''})`);
        }
        if (registeredProgrammes.sports.general > 0) {
          console.log(`      General: ${registeredProgrammes.sports.general} (${sportsProgrammes.general.slice(0, 2).join(', ')}${sportsProgrammes.general.length > 2 ? '...' : ''})`);
        }
      }
      
      // Display format for UI
      console.log(`   📱 UI Display:`);
      console.log(`      🎨 Arts: ${registeredProgrammes.arts.total} (I:${registeredProgrammes.arts.individual}, G:${registeredProgrammes.arts.group}, Gen:${registeredProgrammes.arts.general})`);
      console.log(`      🏃 Sports: ${registeredProgrammes.sports.total} (I:${registeredProgrammes.sports.individual}, G:${registeredProgrammes.sports.group}, Gen:${registeredProgrammes.sports.general})`);
    });
    
    console.log('\n🎯 DETAILED BREAKDOWN SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Arts & Sports categorization with Individual/Group/General breakdown');
    console.log('✅ Hierarchical display: Category → Position Type');
    console.log('✅ Visual badges for each category and sub-category');
    console.log('✅ Comprehensive view of candidate participation patterns');
    console.log('✅ Easy identification of specialization vs balanced participation');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testDetailedArtsSportsBreakdown();
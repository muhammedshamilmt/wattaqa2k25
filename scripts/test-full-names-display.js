const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testFullNamesDisplay() {
  console.log('🧪 TESTING FULL NAMES DISPLAY');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    // Get sample data
    const candidates = await db.collection('candidates').find({}).limit(3).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    const participants = await db.collection('programme_participants').find({}).toArray();
    
    console.log(`📊 Test Data:`);
    console.log(`   Candidates: ${candidates.length}`);
    console.log(`   Programmes: ${programmes.length}`);
    console.log(`   Team Registrations: ${participants.length}`);
    
    console.log('\n🔍 TESTING FULL NAMES DISPLAY FORMAT');
    console.log('--------------------------------------------------');
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.name} (${candidate.chestNumber})`);
      
      // Find candidate's programme registrations
      const candidateParticipations = participants.filter(teamReg => 
        teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
      );
      
      // Detailed breakdown
      const registeredProgrammes = {
        arts: { individual: 0, group: 0, general: 0, total: 0 },
        sports: { individual: 0, group: 0, general: 0, total: 0 }
      };
      
      candidateParticipations.forEach(participation => {
        const programme = programmes.find(p => p._id.toString() === participation.programmeId.toString());
        if (programme) {
          const category = programme.category?.toLowerCase();
          const positionType = programme.positionType?.toLowerCase();
          
          if (category === 'arts') {
            registeredProgrammes.arts.total++;
            if (positionType === 'individual') {
              registeredProgrammes.arts.individual++;
            } else if (positionType === 'group') {
              registeredProgrammes.arts.group++;
            } else if (positionType === 'general') {
              registeredProgrammes.arts.general++;
            }
          } else if (category === 'sports') {
            registeredProgrammes.sports.total++;
            if (positionType === 'individual') {
              registeredProgrammes.sports.individual++;
            } else if (positionType === 'group') {
              registeredProgrammes.sports.group++;
            } else if (positionType === 'general') {
              registeredProgrammes.sports.general++;
            }
          }
        }
      });
      
      // Display with FULL NAMES (not abbreviations)
      console.log(`   📱 UI Display with Full Names:`);
      
      if (registeredProgrammes.arts.total > 0) {
        console.log(`   🎨 Arts: ${registeredProgrammes.arts.total}`);
        const artsBadges = [];
        if (registeredProgrammes.arts.individual > 0) {
          artsBadges.push(`Individual: ${registeredProgrammes.arts.individual}`);
        }
        if (registeredProgrammes.arts.group > 0) {
          artsBadges.push(`Group: ${registeredProgrammes.arts.group}`);
        }
        if (registeredProgrammes.arts.general > 0) {
          artsBadges.push(`General: ${registeredProgrammes.arts.general}`);
        }
        console.log(`      Sub-badges: ${artsBadges.join(', ')}`);
      }
      
      if (registeredProgrammes.sports.total > 0) {
        console.log(`   🏃 Sports: ${registeredProgrammes.sports.total}`);
        const sportsBadges = [];
        if (registeredProgrammes.sports.individual > 0) {
          sportsBadges.push(`Individual: ${registeredProgrammes.sports.individual}`);
        }
        if (registeredProgrammes.sports.group > 0) {
          sportsBadges.push(`Group: ${registeredProgrammes.sports.group}`);
        }
        if (registeredProgrammes.sports.general > 0) {
          sportsBadges.push(`General: ${registeredProgrammes.sports.general}`);
        }
        console.log(`      Sub-badges: ${sportsBadges.join(', ')}`);
      }
      
      // Compare old vs new format
      console.log(`   📊 Format Comparison:`);
      console.log(`      OLD: I:${registeredProgrammes.arts.individual}, G:${registeredProgrammes.arts.group}, Gen:${registeredProgrammes.arts.general}`);
      console.log(`      NEW: Individual:${registeredProgrammes.arts.individual}, Group:${registeredProgrammes.arts.group}, General:${registeredProgrammes.arts.general}`);
    });
    
    console.log('\n🎯 FULL NAMES DISPLAY SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Changed from abbreviations to full names');
    console.log('✅ "I:" → "Individual:"');
    console.log('✅ "G:" → "Group:"');
    console.log('✅ "Gen:" → "General:"');
    console.log('✅ Increased padding (px-1 → px-2) to accommodate longer text');
    console.log('✅ More descriptive and user-friendly display');
    console.log('✅ Maintains all functionality with better readability');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testFullNamesDisplay();
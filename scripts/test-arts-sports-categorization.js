const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testArtsSportsCategorization() {
  console.log('🧪 TESTING ARTS & SPORTS CATEGORIZATION');
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
    console.log(`   Programmes: ${programmes.length} (Arts: ${programmes.filter(p => p.category === 'arts').length}, Sports: ${programmes.filter(p => p.category === 'sports').length})`);
    console.log(`   Team Registrations: ${participants.length}`);
    
    console.log('\n🔍 TESTING ARTS & SPORTS CATEGORIZATION');
    console.log('--------------------------------------------------');
    
    candidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.name} (${candidate.chestNumber})`);
      
      // Find candidate's programme registrations
      const candidateParticipations = participants.filter(teamReg => 
        teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
      );
      
      console.log(`   📋 Total Registrations: ${candidateParticipations.length}`);
      
      // Count by category (Arts vs Sports)
      const registeredProgrammes = { arts: 0, sports: 0, other: 0 };
      const artsProgrammes = [];
      const sportsProgrammes = [];
      const otherProgrammes = [];
      
      candidateParticipations.forEach(participation => {
        const programme = programmes.find(p => p._id.toString() === participation.programmeId.toString());
        if (programme) {
          const category = programme.category?.toLowerCase();
          if (category === 'arts') {
            registeredProgrammes.arts++;
            artsProgrammes.push(programme.name);
          } else if (category === 'sports') {
            registeredProgrammes.sports++;
            sportsProgrammes.push(programme.name);
          } else {
            registeredProgrammes.other++;
            otherProgrammes.push(programme.name);
          }
        }
      });
      
      console.log(`   🎨 Arts Programmes: ${registeredProgrammes.arts}`);
      if (artsProgrammes.length > 0) {
        console.log(`      Sample: ${artsProgrammes.slice(0, 3).join(', ')}${artsProgrammes.length > 3 ? '...' : ''}`);
      }
      
      console.log(`   🏃 Sports Programmes: ${registeredProgrammes.sports}`);
      if (sportsProgrammes.length > 0) {
        console.log(`      Sample: ${sportsProgrammes.slice(0, 3).join(', ')}${sportsProgrammes.length > 3 ? '...' : ''}`);
      }
      
      if (registeredProgrammes.other > 0) {
        console.log(`   ❓ Other Programmes: ${registeredProgrammes.other}`);
        console.log(`      Sample: ${otherProgrammes.slice(0, 3).join(', ')}${otherProgrammes.length > 3 ? '...' : ''}`);
      }
      
      console.log(`   📊 Display: "🎨 Arts: ${registeredProgrammes.arts}, 🏃 Sports: ${registeredProgrammes.sports}, Total: ${candidateParticipations.length}"`);
    });
    
    // Overall statistics
    console.log('\n📊 OVERALL STATISTICS:');
    console.log('--------------------------------------------------');
    
    let totalArts = 0;
    let totalSports = 0;
    let totalOther = 0;
    
    candidates.forEach(candidate => {
      const candidateParticipations = participants.filter(teamReg => 
        teamReg.participants && teamReg.participants.includes(candidate.chestNumber)
      );
      
      candidateParticipations.forEach(participation => {
        const programme = programmes.find(p => p._id.toString() === participation.programmeId.toString());
        if (programme) {
          const category = programme.category?.toLowerCase();
          if (category === 'arts') {
            totalArts++;
          } else if (category === 'sports') {
            totalSports++;
          } else {
            totalOther++;
          }
        }
      });
    });
    
    console.log(`Total Arts Registrations: ${totalArts}`);
    console.log(`Total Sports Registrations: ${totalSports}`);
    console.log(`Total Other Registrations: ${totalOther}`);
    console.log(`Total Registrations: ${totalArts + totalSports + totalOther}`);
    
    console.log('\n🎯 CATEGORIZATION SUMMARY:');
    console.log('--------------------------------------------------');
    console.log('✅ Changed from Individual/Group/General to Arts/Sports');
    console.log('✅ Using programme.category field for categorization');
    console.log('✅ Arts programmes include: Essay, Poetry, Speech, Drawing, etc.');
    console.log('✅ Sports programmes include: Running, Jumping, Cricket, Football, etc.');
    console.log('✅ Visual indicators: 🎨 for Arts, 🏃 for Sports');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testArtsSportsCategorization();
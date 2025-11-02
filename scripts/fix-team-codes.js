const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function fixTeamCodes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';
  console.log('Connecting to:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'wattaqa-festival-2k25');
    
    console.log('=== FIXING TEAM CODES ===\n');
    
    // Check current teams
    const teamsCollection = db.collection('teams');
    const teams = await teamsCollection.find({}).toArray();
    
    console.log('Current teams:');
    teams.forEach(team => {
      console.log(`- ID: ${team._id}, Code: "${team.code}", Name: "${team.name}"`);
    });
    
    // Fix team codes based on names
    const updates = [];
    
    for (const team of teams) {
      let newCode = null;
      
      if (team.name && team.name.toLowerCase().includes('sumud')) {
        newCode = 'SMD';
      } else if (team.name && team.name.toLowerCase().includes('aqsa')) {
        newCode = 'AQS';
      } else if (team.name && team.name.toLowerCase().includes('inthifada')) {
        newCode = 'INT';
      }
      
      if (newCode && team.code !== newCode) {
        updates.push({
          _id: team._id,
          oldCode: team.code,
          newCode: newCode,
          name: team.name
        });
      }
    }
    
    if (updates.length === 0) {
      console.log('\n✅ All team codes are already correct.');
      return;
    }
    
    console.log('\nTeam codes to be updated:');
    updates.forEach(update => {
      console.log(`- "${update.name}": "${update.oldCode}" → "${update.newCode}"`);
    });
    
    // Apply updates
    for (const update of updates) {
      await teamsCollection.updateOne(
        { _id: update._id },
        { $set: { code: update.newCode } }
      );
      console.log(`✅ Updated ${update.name} code to ${update.newCode}`);
    }
    
    // Verify the fix
    const updatedTeams = await teamsCollection.find({}).toArray();
    console.log('\nFinal teams:');
    updatedTeams.forEach(team => {
      console.log(`- Code: "${team.code}", Name: "${team.name}"`);
    });
    
    console.log('\n🎉 Team codes fixed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixTeamCodes().catch(console.error);
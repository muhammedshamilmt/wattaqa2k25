/**
 * Database setup script to set team captain email
 * Run this to configure mikdadmk95@gmail.com as team captain
 */

console.log('📧 Team Captain Email Setup');
console.log('===========================');

const setupInstructions = {
  email: 'mikdadmk95@gmail.com',
  teams: [
    { code: 'SMD', name: 'SUMUD' },
    { code: 'INT', name: 'INTIFADA' },
    { code: 'AQS', name: 'AQSA' }
  ]
};

console.log(`\n📋 Setting up captain email: ${setupInstructions.email}`);
console.log('\n🔧 MongoDB Commands to Run:');
console.log('============================');

// Option 1: Set for SMD team (recommended)
console.log('\n1. Set as SMD Team Captain (Recommended):');
console.log('```javascript');
console.log('db.teams.updateOne(');
console.log('  { code: "SMD" },');
console.log(`  { $set: { captainEmail: "${setupInstructions.email}" } }`);
console.log(');');
console.log('```');

// Option 2: Set for INT team
console.log('\n2. Alternative - Set as INT Team Captain:');
console.log('```javascript');
console.log('db.teams.updateOne(');
console.log('  { code: "INT" },');
console.log(`  { $set: { captainEmail: "${setupInstructions.email}" } }`);
console.log(');');
console.log('```');

// Option 3: Set for AQS team
console.log('\n3. Alternative - Set as AQS Team Captain:');
console.log('```javascript');
console.log('db.teams.updateOne(');
console.log('  { code: "AQS" },');
console.log(`  { $set: { captainEmail: "${setupInstructions.email}" } }`);
console.log(');');
console.log('```');

// Verification commands
console.log('\n🔍 Verification Commands:');
console.log('=========================');

console.log('\n1. Check if update was successful:');
console.log('```javascript');
console.log('db.teams.findOne({ code: "SMD" });');
console.log('```');

console.log('\n2. List all teams with captain emails:');
console.log('```javascript');
console.log('db.teams.find(');
console.log('  { captainEmail: { $exists: true, $ne: null, $ne: "" } },');
console.log('  { code: 1, name: 1, captainEmail: 1 }');
console.log(');');
console.log('```');

console.log('\n3. Check specific email:');
console.log('```javascript');
console.log(`db.teams.findOne({ captainEmail: "${setupInstructions.email}" });`);
console.log('```');

// Step-by-step instructions
console.log('\n📝 Step-by-Step Instructions:');
console.log('==============================');

console.log('\n1. Connect to MongoDB:');
console.log('   - Open MongoDB Compass or mongo shell');
console.log('   - Connect to your database');
console.log('   - Select the correct database (usually wattaqa2k25)');

console.log('\n2. Run the Update Command:');
console.log('   - Copy one of the update commands above');
console.log('   - Paste and execute in MongoDB shell');
console.log('   - Should see: { acknowledged: true, modifiedCount: 1 }');

console.log('\n3. Verify the Update:');
console.log('   - Run the verification command');
console.log(`   - Should see captainEmail: "${setupInstructions.email}"`);

console.log('\n4. Test the System:');
console.log('   - Go to /team-admin (no team parameter)');
console.log(`   - Sign in with ${setupInstructions.email}`);
console.log('   - Should auto-redirect to team portal');

// Troubleshooting
console.log('\n🚨 Troubleshooting:');
console.log('===================');

console.log('\nIf the update doesn\'t work:');
console.log('1. Check if team exists:');
console.log('   db.teams.find({ code: "SMD" });');

console.log('\n2. Check current team structure:');
console.log('   db.teams.findOne({ code: "SMD" });');

console.log('\n3. If team doesn\'t exist, create it first:');
console.log('```javascript');
console.log('db.teams.insertOne({');
console.log('  code: "SMD",');
console.log('  name: "SUMUD",');
console.log(`  captainEmail: "${setupInstructions.email}",`);
console.log('  captain: "Team Captain",');
console.log('  description: "SUMUD Team",');
console.log('  color: "#3B82F6",');
console.log('  members: 0,');
console.log('  points: 0');
console.log('});');
console.log('```');

// Expected results
console.log('\n✅ Expected Results After Setup:');
console.log('=================================');
console.log(`- ${setupInstructions.email} can access team portal`);
console.log('- Auto-redirect works from /team-admin');
console.log('- No "Team Code Required" errors');
console.log('- Secure access based on email verification');

console.log('\n🎯 Quick Test:');
console.log('==============');
console.log('1. Run the MongoDB update command');
console.log('2. Go to /team-admin in browser');
console.log(`3. Sign in with ${setupInstructions.email}`);
console.log('4. Should automatically redirect to team portal');

console.log('\n🚀 Team Captain Email Setup Complete!');
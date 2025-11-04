#!/usr/bin/env node

/**
 * Comprehensive diagnostic script for programme registration issue
 * Tests all APIs and data connections to identify the root cause
 */

console.log('🔍 COMPREHENSIVE PROGRAMME REGISTRATION DIAGNOSIS\n');

console.log('📋 ISSUE SUMMARY:');
console.log('- Programme registrations exist in database');
console.log('- Team admin portal shows programmes as "not registered"');
console.log('- Admin results page shows no registered programmes');
console.log('- Cannot add results because no registrations visible\n');

console.log('🎯 DIAGNOSIS PLAN:');
console.log('1. Test all API endpoints');
console.log('2. Check data structure and formats');
console.log('3. Verify ID matching logic');
console.log('4. Test with specific team codes');
console.log('5. Identify the exact disconnect\n');

// Test function for API endpoints
async function testAPIs() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 TESTING API ENDPOINTS:\n');
  
  try {
    // Test 1: All programme participants
    console.log('1️⃣ Testing /api/programme-participants');
    const allParticipantsRes = await fetch(`${baseUrl}/api/programme-participants`);
    console.log(`   Status: ${allParticipantsRes.status}`);
    
    if (allParticipantsRes.ok) {
      const allParticipants = await allParticipantsRes.json();
      console.log(`   Total participants: ${Array.isArray(allParticipants) ? allParticipants.length : 'Not array'}`);
      
      if (Array.isArray(allParticipants) && allParticipants.length > 0) {
        console.log('   Sample participant:');
        console.log('   ', JSON.stringify(allParticipants[0], null, 4));
        
        // Show team distribution
        const teamCounts = {};
        allParticipants.forEach(p => {
          teamCounts[p.teamCode] = (teamCounts[p.teamCode] || 0) + 1;
        });
        console.log('   Team distribution:', teamCounts);
      } else {
        console.log('   ❌ NO PARTICIPANTS FOUND - This is the problem!');
      }
    } else {
      console.log(`   ❌ API Error: ${allParticipantsRes.statusText}`);
    }
    console.log('');

    // Test 2: Specific team participants
    console.log('2️⃣ Testing /api/programme-participants?team=SMD');
    const smdParticipantsRes = await fetch(`${baseUrl}/api/programme-participants?team=SMD`);
    console.log(`   Status: ${smdParticipantsRes.status}`);
    
    if (smdParticipantsRes.ok) {
      const smdParticipants = await smdParticipantsRes.json();
      console.log(`   SMD participants: ${Array.isArray(smdParticipants) ? smdParticipants.length : 'Not array'}`);
      
      if (Array.isArray(smdParticipants) && smdParticipants.length > 0) {
        console.log('   SMD registrations:');
        smdParticipants.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.programmeName} (${p.programmeCode}) - ${p.participants?.length || 0} participants`);
        });
      } else {
        console.log('   ❌ NO SMD PARTICIPANTS FOUND');
      }
    }
    console.log('');

    // Test 3: All programmes
    console.log('3️⃣ Testing /api/programmes');
    const programmesRes = await fetch(`${baseUrl}/api/programmes`);
    console.log(`   Status: ${programmesRes.status}`);
    
    if (programmesRes.ok) {
      const programmes = await programmesRes.json();
      console.log(`   Total programmes: ${Array.isArray(programmes) ? programmes.length : 'Not array'}`);
      
      if (Array.isArray(programmes) && programmes.length > 0) {
        console.log('   Sample programme ID format:');
        console.log(`   Type: ${typeof programmes[0]._id}`);
        console.log(`   Value: ${programmes[0]._id}`);
        console.log(`   String: ${programmes[0]._id?.toString()}`);
      }
    }
    console.log('');

    // Test 4: Teams
    console.log('4️⃣ Testing /api/teams');
    const teamsRes = await fetch(`${baseUrl}/api/teams`);
    console.log(`   Status: ${teamsRes.status}`);
    
    if (teamsRes.ok) {
      const teams = await teamsRes.json();
      console.log(`   Total teams: ${Array.isArray(teams) ? teams.length : 'Not array'}`);
      
      if (Array.isArray(teams) && teams.length > 0) {
        console.log('   Team codes:', teams.map(t => t.code).join(', '));
      }
    }
    console.log('');

    // Test 5: Candidates
    console.log('5️⃣ Testing /api/candidates');
    const candidatesRes = await fetch(`${baseUrl}/api/candidates`);
    console.log(`   Status: ${candidatesRes.status}`);
    
    if (candidatesRes.ok) {
      const candidates = await candidatesRes.json();
      console.log(`   Total candidates: ${Array.isArray(candidates) ? candidates.length : 'Not array'}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ ERROR TESTING APIs:', error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Make sure development server is running: npm run dev');
    console.log('2. Check if MongoDB is connected');
    console.log('3. Verify database has data in programme_participants collection');
    console.log('4. Check server logs for errors');
  }
}

console.log('🔧 COMMON CAUSES AND SOLUTIONS:\n');

console.log('1️⃣ EMPTY API RESPONSE:');
console.log('   Cause: Database connection issue or empty collection');
console.log('   Solution: Check MongoDB connection and verify data exists');
console.log('   Command: Check programme_participants collection in MongoDB\n');

console.log('2️⃣ ID MISMATCH:');
console.log('   Cause: programme._id format different from participant.programmeId');
console.log('   Solution: Ensure consistent ID format (ObjectId vs string)');
console.log('   Check: Compare programme._id with participant.programmeId\n');

console.log('3️⃣ CASE SENSITIVITY:');
console.log('   Cause: Team codes like "SMD" vs "smd"');
console.log('   Solution: Ensure consistent casing in database');
console.log('   Check: Verify teamCode field in database\n');

console.log('4️⃣ FIELD NAME MISMATCH:');
console.log('   Cause: Wrong field names in database or API');
console.log('   Solution: Verify field names match API expectations');
console.log('   Check: programmeId, teamCode, participants fields\n');

console.log('5️⃣ API ROUTE ISSUES:');
console.log('   Cause: API route not working correctly');
console.log('   Solution: Check server logs and API implementation');
console.log('   Check: /api/programme-participants route\n');

console.log('🚀 RUNNING DIAGNOSIS...\n');

// Run the diagnosis
testAPIs().then(() => {
  console.log('\n✅ DIAGNOSIS COMPLETE');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Review the API test results above');
  console.log('2. If APIs return empty data, check database directly');
  console.log('3. If data exists but IDs don\'t match, fix ID format');
  console.log('4. If team codes don\'t match, fix case sensitivity');
  console.log('5. Test again after fixes');
}).catch(error => {
  console.error('\n❌ DIAGNOSIS FAILED:', error);
});
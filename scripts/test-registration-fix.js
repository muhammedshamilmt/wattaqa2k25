#!/usr/bin/env node

/**
 * Test script to verify the programme registration fix
 */

console.log('🧪 TESTING PROGRAMME REGISTRATION FIX\n');

async function testFix() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('1️⃣ Testing programme participants API after fix...');
    
    // Test all participants
    const allResponse = await fetch(`${baseUrl}/api/programme-participants`);
    console.log(`   GET /api/programme-participants: ${allResponse.status}`);
    
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`   Total participants: ${Array.isArray(allData) ? allData.length : 'Not array'}`);
      
      if (Array.isArray(allData) && allData.length > 0) {
        console.log('   ✅ SUCCESS: API now returns participant data!');
        
        // Show team distribution
        const teamCounts = {};
        allData.forEach(p => {
          teamCounts[p.teamCode] = (teamCounts[p.teamCode] || 0) + 1;
        });
        console.log('   Team registrations:', teamCounts);
        
        // Test specific team
        console.log('\n2️⃣ Testing team-specific query...');
        const teamResponse = await fetch(`${baseUrl}/api/programme-participants?team=SMD`);
        console.log(`   GET /api/programme-participants?team=SMD: ${teamResponse.status}`);
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          console.log(`   SMD registrations: ${Array.isArray(teamData) ? teamData.length : 'Not array'}`);
          
          if (Array.isArray(teamData) && teamData.length > 0) {
            console.log('   ✅ SUCCESS: Team-specific query works!');
            console.log('   SMD programmes:');
            teamData.forEach((p, i) => {
              console.log(`   ${i + 1}. ${p.programmeName} (${p.programmeCode})`);
              console.log(`      Participants: ${p.participants?.join(', ') || 'None'}`);
            });
          } else {
            console.log('   ⚠️  No SMD registrations found');
          }
        }
        
      } else {
        console.log('   ❌ STILL NO DATA: API returns empty array');
        console.log('   Check if database collection name is still incorrect');
      }
    } else {
      console.log(`   ❌ API ERROR: ${allResponse.statusText}`);
    }
    
    console.log('\n3️⃣ Testing programmes API...');
    const programmesResponse = await fetch(`${baseUrl}/api/programmes`);
    console.log(`   GET /api/programmes: ${programmesResponse.status}`);
    
    if (programmesResponse.ok) {
      const programmes = await programmesResponse.json();
      console.log(`   Total programmes: ${Array.isArray(programmes) ? programmes.length : 'Not array'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Make sure development server is running: npm run dev');
    console.log('2. Check server console for error messages');
    console.log('3. Verify MongoDB is running and accessible');
  }
}

console.log('🔧 CHANGES MADE:');
console.log('- Fixed collection name from "programme-participants" to "programme_participants"');
console.log('- Updated all API routes to use correct collection name');
console.log('- Added comprehensive debugging\n');

console.log('🎯 EXPECTED RESULTS:');
console.log('- API should now return programme participant data');
console.log('- Team admin portal should show registered programmes');
console.log('- Admin results page should show registered programmes');
console.log('- Registration status should display correctly\n');

console.log('🚀 Running test...\n');
testFix();
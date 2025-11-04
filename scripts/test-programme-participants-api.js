#!/usr/bin/env node

/**
 * Test script to verify programme participants API functionality
 */

console.log('🧪 Testing Programme Participants API...\n');

// Test the API endpoints
async function testAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('1. Testing GET /api/programme-participants (all participants)');
    const allResponse = await fetch(`${baseUrl}/api/programme-participants`);
    const allData = await allResponse.json();
    console.log(`   Status: ${allResponse.status}`);
    console.log(`   Count: ${Array.isArray(allData) ? allData.length : 'Not array'}`);
    if (Array.isArray(allData) && allData.length > 0) {
      console.log('   Sample participant:', JSON.stringify(allData[0], null, 2));
    }
    console.log('');

    console.log('2. Testing GET /api/programme-participants?team=SMD');
    const teamResponse = await fetch(`${baseUrl}/api/programme-participants?team=SMD`);
    const teamData = await teamResponse.json();
    console.log(`   Status: ${teamResponse.status}`);
    console.log(`   Count: ${Array.isArray(teamData) ? teamData.length : 'Not array'}`);
    if (Array.isArray(teamData) && teamData.length > 0) {
      console.log('   SMD participants:', JSON.stringify(teamData, null, 2));
    }
    console.log('');

    console.log('3. Testing GET /api/programmes (to compare IDs)');
    const programmesResponse = await fetch(`${baseUrl}/api/programmes`);
    const programmesData = await programmesResponse.json();
    console.log(`   Status: ${programmesResponse.status}`);
    console.log(`   Count: ${Array.isArray(programmesData) ? programmesData.length : 'Not array'}`);
    if (Array.isArray(programmesData) && programmesData.length > 0) {
      console.log('   Sample programme ID format:', typeof programmesData[0]._id, programmesData[0]._id);
    }
    console.log('');

    // Compare ID formats
    if (Array.isArray(allData) && allData.length > 0 && Array.isArray(programmesData) && programmesData.length > 0) {
      console.log('4. Comparing ID formats:');
      console.log(`   Participant programmeId: ${typeof allData[0].programmeId} - ${allData[0].programmeId}`);
      console.log(`   Programme _id: ${typeof programmesData[0]._id} - ${programmesData[0]._id}`);
      
      // Check if any participant programmeId matches any programme _id
      const matchFound = allData.some(participant => 
        programmesData.some(programme => 
          programme._id?.toString() === participant.programmeId?.toString()
        )
      );
      console.log(`   ID Match Found: ${matchFound}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
    console.log('   or');
    console.log('   yarn dev');
  }
}

// Run the test
testAPI();
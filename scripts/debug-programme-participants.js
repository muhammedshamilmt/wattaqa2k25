#!/usr/bin/env node

/**
 * Debug script for programme participants issue
 * Investigates why registered programmes are not showing in team admin portal
 */

console.log('🔍 Debugging Programme Participants Issue...\n');

console.log('📋 Issue Analysis:');
console.log('- Team admin portal shows programmes for registration');
console.log('- Many programmes already registered in database');
console.log('- Data stored in "programme_participants" collection');
console.log('- But registered programmes not showing as registered\n');

console.log('🔧 Potential Causes:');
console.log('1. API Response Issues:');
console.log('   - /api/programme-participants?team=TEAMCODE not returning data');
console.log('   - Database connection problems');
console.log('   - Query filtering issues\n');

console.log('2. Data Structure Mismatch:');
console.log('   - programmeId field mismatch between programmes and participants');
console.log('   - Team code case sensitivity issues');
console.log('   - Missing or incorrect field mappings\n');

console.log('3. Frontend Logic Issues:');
console.log('   - Participant matching logic in ProgrammeCard component');
console.log('   - State management problems');
console.log('   - Component re-rendering issues\n');

console.log('🧪 Debug Steps to Perform:');
console.log('1. Check API Response:');
console.log('   - Open browser dev tools');
console.log('   - Navigate to /team-admin/programmes?team=TEAMCODE');
console.log('   - Check Network tab for API calls');
console.log('   - Verify /api/programme-participants?team=TEAMCODE response\n');

console.log('2. Verify Database Data:');
console.log('   - Check programme_participants collection in MongoDB');
console.log('   - Verify teamCode field matches exactly');
console.log('   - Check programmeId field format (ObjectId vs string)\n');

console.log('3. Test API Endpoints:');
console.log('   - Test: GET /api/programme-participants');
console.log('   - Test: GET /api/programme-participants?team=SMD');
console.log('   - Test: GET /api/programmes');
console.log('   - Compare programmeId formats between collections\n');

console.log('4. Check Component Logic:');
console.log('   - Verify existingParticipant matching logic');
console.log('   - Check if programme._id matches participant.programmeId');
console.log('   - Ensure proper data types (string vs ObjectId)\n');

console.log('🔍 Key Code Locations:');
console.log('- API: wattaqa2k25/src/app/api/programme-participants/route.ts');
console.log('- Component: wattaqa2k25/src/app/team-admin/programmes/page.tsx');
console.log('- Matching Logic: Line ~400 in ProgrammeCard component');
console.log('- Database Query: Line ~25 in API route\n');

console.log('🎯 Expected Behavior:');
console.log('1. API should return array of programme participants for team');
console.log('2. Each participant should have programmeId matching programme._id');
console.log('3. ProgrammeCard should show "Registered Successfully" for existing participants');
console.log('4. Registered programmes should show participant details\n');

console.log('🚨 Common Issues:');
console.log('1. ObjectId vs String Mismatch:');
console.log('   - programme._id is ObjectId');
console.log('   - participant.programmeId might be string');
console.log('   - Need .toString() comparison\n');

console.log('2. Case Sensitivity:');
console.log('   - teamCode "SMD" vs "smd"');
console.log('   - Ensure consistent casing\n');

console.log('3. Empty Response:');
console.log('   - API returns [] instead of actual data');
console.log('   - Database connection issues');
console.log('   - Query filter problems\n');

console.log('🔧 Quick Fixes to Try:');
console.log('1. Add console.log in API route to debug query');
console.log('2. Add console.log in component to check participants array');
console.log('3. Verify programmeId matching logic');
console.log('4. Check database directly for sample data\n');

console.log('📝 Manual Testing Steps:');
console.log('1. Open browser dev tools');
console.log('2. Go to /team-admin/programmes?team=SMD');
console.log('3. Check Network tab for API calls');
console.log('4. Look for /api/programme-participants?team=SMD');
console.log('5. Verify response contains participant data');
console.log('6. Check if programmeId matches programme._id');
console.log('7. Verify component state updates correctly\n');

console.log('🎯 Expected API Response Format:');
console.log(`[
  {
    "_id": "ObjectId",
    "programmeId": "programme_object_id",
    "programmeCode": "P001",
    "programmeName": "Programme Name",
    "teamCode": "SMD",
    "participants": ["SMD001", "SMD002"],
    "status": "registered",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]`);

console.log('\n🚀 Start debugging with these steps to identify the root cause!');
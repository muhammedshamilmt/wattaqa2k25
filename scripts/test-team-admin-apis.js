#!/usr/bin/env node

/**
 * Test script to verify team admin API endpoints are working
 * Run this to check if the APIs are responding correctly
 */

console.log('🧪 Testing Team Admin API Endpoints\n');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TEAM = 'SMD'; // Change this to your test team

console.log('📋 Test Configuration:');
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   Test Team: ${TEST_TEAM}\n`);

console.log('🔍 Manual Testing Instructions:\n');

console.log('1️⃣ TEST PUBLIC ENDPOINTS (No Auth Required):');
console.log('   Open these URLs in your browser:\n');

console.log('   📊 Programmes API:');
console.log(`   ${BASE_URL}/api/programmes`);
console.log('   Expected: JSON array of programmes\n');

console.log('   🏆 Teams API:');
console.log(`   ${BASE_URL}/api/teams`);
console.log('   Expected: JSON array with SMD, INT, AQS teams\n');

console.log('   👥 Programme Participants API:');
console.log(`   ${BASE_URL}/api/programme-participants?team=${TEST_TEAM}`);
console.log('   Expected: JSON array of team registrations\n');

console.log('2️⃣ TEST AUTHENTICATED ENDPOINTS (Auth Required):');
console.log('   Use browser developer tools or Postman:\n');

console.log('   🔐 Get Auth Token:');
console.log('   1. Log in as team captain in browser');
console.log('   2. Open developer tools → Console');
console.log('   3. Run: localStorage.getItem("authToken")');
console.log('   4. Copy the token value\n');

console.log('   👥 Team Candidates API:');
console.log(`   GET ${BASE_URL}/api/team-admin/candidates?team=${TEST_TEAM}`);
console.log('   Headers: { "Authorization": "Bearer YOUR_TOKEN" }');
console.log('   Expected: JSON array of team candidates\n');

console.log('   🏅 Team Results API:');
console.log(`   GET ${BASE_URL}/api/team-admin/results?status=published`);
console.log('   Headers: { "Authorization": "Bearer YOUR_TOKEN" }');
console.log('   Expected: JSON array of published results\n');

console.log('3️⃣ BROWSER CONSOLE TESTING:');
console.log('   Run this in browser console after logging in:\n');

console.log('   ```javascript');
console.log('   // Test public APIs');
console.log('   fetch("/api/programmes").then(r => r.json()).then(console.log);');
console.log('   fetch("/api/teams").then(r => r.json()).then(console.log);');
console.log(`   fetch("/api/programme-participants?team=${TEST_TEAM}").then(r => r.json()).then(console.log);`);
console.log('   ');
console.log('   // Test authenticated APIs');
console.log('   const token = localStorage.getItem("authToken");');
console.log('   const headers = { "Authorization": `Bearer ${token}` };');
console.log('   ');
console.log(`   fetch("/api/team-admin/candidates?team=${TEST_TEAM}", { headers })`);
console.log('     .then(r => r.json()).then(console.log);');
console.log('   ');
console.log('   fetch("/api/team-admin/results?status=published", { headers })');
console.log('     .then(r => r.json()).then(console.log);');
console.log('   ```\n');

console.log('4️⃣ EXPECTED RESPONSES:\n');

console.log('   ✅ SUCCESS (200 OK):');
console.log('   - Programmes: Array of programme objects');
console.log('   - Teams: Array with 3 teams (SMD, INT, AQS)');
console.log('   - Participants: Array of team registrations');
console.log('   - Candidates: Array of team members');
console.log('   - Results: Array of published results\n');

console.log('   ❌ COMMON ERROR RESPONSES:');
console.log('   - 401 Unauthorized: Invalid or missing auth token');
console.log('   - 403 Forbidden: User not team captain or wrong team');
console.log('   - 404 Not Found: API endpoint doesn\'t exist');
console.log('   - 500 Server Error: Database or server issues\n');

console.log('5️⃣ TROUBLESHOOTING:\n');

console.log('   🔧 If APIs return empty arrays:');
console.log('   1. Check if database has data');
console.log('   2. Verify team code exists');
console.log('   3. Add test data through admin panel\n');

console.log('   🔧 If APIs return 401/403:');
console.log('   1. Verify user is logged in as team captain');
console.log('   2. Check auth token is valid');
console.log('   3. Ensure team is assigned to user\n');

console.log('   🔧 If APIs return 500:');
console.log('   1. Check server console for errors');
console.log('   2. Verify MongoDB connection');
console.log('   3. Check API route implementations\n');

console.log('6️⃣ DATABASE VERIFICATION:');
console.log('   If you have MongoDB access, check these collections:');
console.log('   - candidates: Should have team field matching team codes');
console.log('   - programme-participants: Should have teamCode field');
console.log('   - programmes: Should have programme definitions');
console.log('   - results: Should have published results');
console.log('   - teams: Should have SMD, INT, AQS teams\n');

console.log('7️⃣ SAMPLE DATA CHECK:');
console.log('   Ensure your database has:');
console.log('   ✅ At least 1 candidate with team="SMD"');
console.log('   ✅ At least 1 programme in programmes collection');
console.log('   ✅ At least 1 registration in programme-participants');
console.log('   ✅ At least 1 published result in results collection');
console.log('   ✅ Teams SMD, INT, AQS in teams collection\n');

console.log('🎯 QUICK TEST CHECKLIST:');
console.log('   □ Server is running (npm run dev)');
console.log('   □ MongoDB is connected');
console.log('   □ User is logged in as team captain');
console.log('   □ Team is assigned to user');
console.log('   □ Database has sample data');
console.log('   □ API endpoints return 200 status');
console.log('   □ Browser console shows success messages\n');

console.log('✨ Run these tests to identify the exact issue!');
console.log('📝 Check each API endpoint individually to isolate problems.');
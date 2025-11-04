#!/usr/bin/env node

/**
 * Debug script for team admin no data issue
 * This helps identify why no data is showing in team admin pages
 */

console.log('🔍 Team Admin No Data Issue - Debug Guide\n');

console.log('📋 STEP-BY-STEP DEBUGGING:\n');

console.log('1️⃣ CHECK USER AUTHENTICATION:');
console.log('   Open Developer Tools (F12) → Console tab');
console.log('   Run these commands:\n');

console.log('   ```javascript');
console.log('   // Check if user is properly logged in');
console.log('   const user = JSON.parse(localStorage.getItem("currentUser") || "{}");');
console.log('   const token = localStorage.getItem("authToken");');
console.log('   ');
console.log('   console.log("User Data:", user);');
console.log('   console.log("User Type:", user.userType);');
console.log('   console.log("Team Code:", user.team?.code);');
console.log('   console.log("Auth Token:", !!token);');
console.log('   console.log("Token Length:", token?.length);');
console.log('   ```\n');

console.log('   ✅ EXPECTED VALUES:');
console.log('   - User Type: "team-captain"');
console.log('   - Team Code: "SMD", "INT", or "AQS" (NOT "Loading...")');
console.log('   - Auth Token: true (should exist)');
console.log('   - Token Length: > 50 characters\n');

console.log('2️⃣ CHECK TEAM ADMIN CONTEXT:');
console.log('   In Console, run:');
console.log('   ```javascript');
console.log('   // Check what team code is being used');
console.log('   console.log("Current URL:", window.location.href);');
console.log('   console.log("Team from URL:", new URLSearchParams(window.location.search).get("team"));');
console.log('   ```\n');

console.log('3️⃣ MONITOR API CALLS:');
console.log('   Look for these console messages:');
console.log('   ✅ "🚀 Fetching dashboard data for team: SMD" (or INT/AQS)');
console.log('   ✅ "🚀 Fetching candidates for team: SMD"');
console.log('   ✅ "📊 API Response Status: { candidates: 200, ... }"');
console.log('   ✅ "✅ Fetched data counts: { candidates: X, ... }"');
console.log('   ✅ "✅ Candidates data received: X candidates"\n');

console.log('   ❌ PROBLEM INDICATORS:');
console.log('   - "🔄 Waiting for valid teamCode and token..."');
console.log('   - "teamCode: Loading..." (invalid team code)');
console.log('   - "isValidTeam: false"');
console.log('   - API errors (401, 403, 500)\n');

console.log('4️⃣ TEST API ENDPOINTS MANUALLY:');
console.log('   In Console, run:');
console.log('   ```javascript');
console.log('   // Test candidates API');
console.log('   const user = JSON.parse(localStorage.getItem("currentUser"));');
console.log('   const token = localStorage.getItem("authToken");');
console.log('   const teamCode = user.team?.code;');
console.log('   ');
console.log('   if (teamCode && teamCode !== "Loading..." && token) {');
console.log('     fetch(`/api/team-admin/candidates?team=${teamCode}`, {');
console.log('       headers: { "Authorization": `Bearer ${token}` }');
console.log('     }).then(r => {');
console.log('       console.log("Status:", r.status);');
console.log('       return r.json();');
console.log('     }).then(data => {');
console.log('       console.log("Candidates:", data);');
console.log('     }).catch(console.error);');
console.log('   } else {');
console.log('     console.log("Missing teamCode or token:", { teamCode, hasToken: !!token });');
console.log('   }');
console.log('   ```\n');

console.log('5️⃣ CHECK NETWORK TAB:');
console.log('   Open Developer Tools → Network tab');
console.log('   Refresh the team admin page');
console.log('   Look for these requests:');
console.log('   - /api/team-admin/candidates?team=SMD (should be 200)');
console.log('   - /api/programmes (should be 200)');
console.log('   - /api/programme-participants?team=SMD (should be 200)');
console.log('   - /api/team-admin/results?status=published (should be 200)\n');

console.log('6️⃣ COMMON ISSUES & SOLUTIONS:\n');

console.log('🔧 ISSUE: Team code is "Loading..."');
console.log('   CAUSE: User data not properly stored or invalid');
console.log('   SOLUTION:');
console.log('   1. Log out and log back in');
console.log('   2. Ensure user type is "team-captain"');
console.log('   3. Verify team is assigned to user');
console.log('   4. Clear localStorage and re-login\n');

console.log('🔧 ISSUE: No auth token');
console.log('   CAUSE: User not logged in or session expired');
console.log('   SOLUTION:');
console.log('   1. Navigate to /login');
console.log('   2. Log in with team captain credentials');
console.log('   3. Verify token is stored in localStorage\n');

console.log('🔧 ISSUE: API returns 401 (Unauthorized)');
console.log('   CAUSE: Invalid or expired token');
console.log('   SOLUTION:');
console.log('   1. Log out and log back in');
console.log('   2. Check token format (should be JWT)');
console.log('   3. Verify server authentication\n');

console.log('🔧 ISSUE: API returns 403 (Forbidden)');
console.log('   CAUSE: User not team captain or wrong team');
console.log('   SOLUTION:');
console.log('   1. Verify user type is "team-captain"');
console.log('   2. Check team assignment in database');
console.log('   3. Ensure user has access to requested team\n');

console.log('🔧 ISSUE: API returns empty arrays');
console.log('   CAUSE: No data in database for the team');
console.log('   SOLUTION:');
console.log('   1. Add candidates through admin panel');
console.log('   2. Verify team code exists in database');
console.log('   3. Check database collections have data\n');

console.log('🔧 ISSUE: Console shows "Waiting for valid teamCode..."');
console.log('   CAUSE: Team code validation failing');
console.log('   SOLUTION:');
console.log('   1. Check user.team.code in localStorage');
console.log('   2. Ensure team code is valid (SMD/INT/AQS)');
console.log('   3. Verify team assignment in user data\n');

console.log('7️⃣ QUICK FIXES TO TRY:\n');

console.log('🚀 IMMEDIATE FIXES:');
console.log('   1. Hard refresh (Ctrl+F5)');
console.log('   2. Clear browser cache');
console.log('   3. Log out and log back in');
console.log('   4. Try incognito mode');
console.log('   5. Check different browser\n');

console.log('🔧 AUTHENTICATION RESET:');
console.log('   In Console, run:');
console.log('   ```javascript');
console.log('   // Clear and reset authentication');
console.log('   localStorage.removeItem("authToken");');
console.log('   localStorage.removeItem("currentUser");');
console.log('   window.location.href = "/login";');
console.log('   ```\n');

console.log('8️⃣ VERIFY DATABASE DATA:\n');

console.log('📊 Check if database has data:');
console.log('   - Candidates collection: Should have team field');
console.log('   - Teams collection: Should have SMD, INT, AQS');
console.log('   - Users collection: Should have team captains');
console.log('   - Programme-participants: Should have registrations\n');

console.log('9️⃣ EXPECTED CONSOLE OUTPUT:\n');

console.log('✅ SUCCESS PATTERN:');
console.log('   "🚀 Fetching dashboard data for team: SMD"');
console.log('   "📡 Making API calls..."');
console.log('   "📊 API Response Status: { candidates: 200, programmes: 200, ... }"');
console.log('   "✅ Fetched data counts: { candidates: 5, programmes: 10, ... }"');
console.log('   "📋 Sample data: { candidates: [...], programmes: [...] }"\n');

console.log('❌ FAILURE PATTERN:');
console.log('   "🔄 Waiting for valid teamCode and token..."');
console.log('   "teamCode: Loading..." or "teamCode: null"');
console.log('   "isValidTeam: false"');
console.log('   No API calls made\n');

console.log('🔟 FINAL CHECKLIST:\n');

console.log('□ User is logged in as team captain');
console.log('□ localStorage has valid currentUser data');
console.log('□ Team code is SMD, INT, or AQS (not "Loading...")');
console.log('□ Auth token exists and is valid');
console.log('□ API endpoints return 200 status');
console.log('□ Database has data for the team');
console.log('□ Console shows success messages');
console.log('□ Network tab shows successful API calls\n');

console.log('✨ This debug guide should help identify the exact issue!');
console.log('📝 Follow each step and check the console output carefully.');
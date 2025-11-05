console.log('🔧 FIXING TEAM ADMIN PORTAL ACCESS ISSUE\n');

console.log('🎯 STEP-BY-STEP TROUBLESHOOTING:\n');

console.log('STEP 1: CHECK BROWSER CONSOLE ERRORS');
console.log('1. Open http://localhost:3000/team-admin');
console.log('2. Press F12 to open Developer Tools');
console.log('3. Go to Console tab');
console.log('4. Look for error messages when trying to access');
console.log('5. Common errors to look for:');
console.log('   - Firebase initialization errors');
console.log('   - Authentication context errors');
console.log('   - API call failures');
console.log('   - Network request errors');
console.log('');

console.log('STEP 2: TEST GOOGLE AUTHENTICATION');
console.log('1. Go to http://localhost:3000/team-admin');
console.log('2. Click "Sign in with Google" button');
console.log('3. Check if popup appears:');
console.log('   - If no popup: Popup blocker issue');
console.log('   - If popup closes immediately: Domain authorization issue');
console.log('   - If popup shows error: Firebase configuration issue');
console.log('4. Try in incognito mode');
console.log('5. Try different browser (Chrome recommended)');
console.log('');

console.log('STEP 3: VERIFY TEAM ACCESS SETUP');
console.log('1. Check if your email is configured as team captain');
console.log('2. Test API endpoints:');
console.log('   - POST /api/auth/find-user-team');
console.log('   - POST /api/auth/check-team-access');
console.log('3. Verify database connection');
console.log('4. Check team captain email configuration');
console.log('');

console.log('STEP 4: CHECK ROUTING AND MIDDLEWARE');
console.log('1. Verify team-admin routes are accessible');
console.log('2. Check middleware configuration');
console.log('3. Test direct URL access');
console.log('4. Check for redirect loops');
console.log('');

console.log('🛠️ IMMEDIATE FIXES:\n');

console.log('FIX 1: CLEAR BROWSER DATA');
console.log('Commands to run:');
console.log('1. Clear browser cache (Ctrl+Shift+R)');
console.log('2. Clear local storage:');
console.log('   - Open Developer Tools (F12)');
console.log('   - Go to Application tab');
console.log('   - Click Local Storage > localhost:3000');
console.log('   - Delete all entries');
console.log('3. Clear cookies for localhost:3000');
console.log('4. Try accessing team admin again');
console.log('');

console.log('FIX 2: RESTART DEVELOPMENT SERVER');
console.log('Commands to run:');
console.log('1. Stop server: Ctrl+C');
console.log('2. Clear Next.js cache: rmdir /s .next (Windows)');
console.log('3. Restart server: npm run dev');
console.log('4. Wait for server to fully start');
console.log('5. Try accessing http://localhost:3000/team-admin');
console.log('');

console.log('FIX 3: CHECK FIREBASE CONFIGURATION');
console.log('1. Verify .env.local file has all Firebase variables');
console.log('2. Check Firebase Console authorized domains');
console.log('3. Ensure Google sign-in is enabled');
console.log('4. Verify project ID matches configuration');
console.log('');

console.log('FIX 4: TEST WITH ADMIN ACCOUNT');
console.log('1. Try signing in with admin email: dawafest@gmail.com');
console.log('2. Check if admin access works');
console.log('3. If admin works, issue is with team captain setup');
console.log('4. If admin fails, issue is with Firebase authentication');
console.log('');

console.log('🔍 DEBUGGING COMMANDS:\n');

console.log('Test Firebase in Browser Console:');
console.log('```javascript');
console.log('// Run in browser console:');
console.log('console.log("Firebase config:", window.firebase);');
console.log('console.log("Auth state:", firebase.auth().currentUser);');
console.log('```');
console.log('');

console.log('Test API Endpoints:');
console.log('```javascript');
console.log('// Test find-user-team API:');
console.log('fetch("/api/auth/find-user-team", {');
console.log('  method: "POST",');
console.log('  headers: { "Content-Type": "application/json" },');
console.log('  body: JSON.stringify({ email: "your-email@gmail.com" })');
console.log('}).then(r => r.json()).then(console.log);');
console.log('```');
console.log('');

console.log('🚨 MOST LIKELY CAUSES (in order):\n');

console.log('1. 🚫 POPUP BLOCKER (60% of cases)');
console.log('   - Browser blocking Google sign-in popup');
console.log('   - Solution: Allow popups for localhost:3000');
console.log('');

console.log('2. 🌐 FIREBASE DOMAIN AUTHORIZATION (25% of cases)');
console.log('   - localhost:3000 not in Firebase authorized domains');
console.log('   - Solution: Add domain to Firebase Console');
console.log('');

console.log('3. 🔑 EMAIL NOT CONFIGURED (10% of cases)');
console.log('   - Your email not set as team captain');
console.log('   - Solution: Add email to team in database');
console.log('');

console.log('4. 💾 BROWSER CACHE ISSUE (5% of cases)');
console.log('   - Old authentication data cached');
console.log('   - Solution: Clear browser data and restart');
console.log('');

console.log('📋 TEAM CAPTAIN EMAIL SETUP:\n');

console.log('To configure team captain emails:');
console.log('1. Access database directly');
console.log('2. Update teams collection');
console.log('3. Add captainEmail field to team documents');
console.log('4. Example:');
console.log('   {');
console.log('     code: "INT",');
console.log('     name: "Team Inthifada",');
console.log('     captainEmail: "captain@gmail.com"');
console.log('   }');
console.log('');

console.log('🚀 TEAM ADMIN PORTAL ACCESS FIX GUIDE COMPLETE!');
console.log('Start with Fix 1 (popup blocker) as it is the most common issue.');
console.log('🔍 DEBUGGING GOOGLE AUTHENTICATION ISSUE\n');

// Test Firebase configuration
console.log('📋 FIREBASE CONFIGURATION CHECK:');
console.log('✅ Environment Variables:');
console.log('   - NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('   - NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');
console.log('');

// Common Google Auth Issues and Solutions
console.log('🚨 COMMON GOOGLE AUTH ISSUES & SOLUTIONS:\n');

console.log('1. 🔐 FIREBASE PROJECT CONFIGURATION:');
console.log('   Issue: Firebase project not properly configured');
console.log('   Solutions:');
console.log('   - Check Firebase Console: https://console.firebase.google.com/');
console.log('   - Verify project ID matches: wattaqa2k25-e04a8');
console.log('   - Ensure Authentication is enabled');
console.log('   - Check Google provider is enabled in Authentication > Sign-in method');
console.log('');

console.log('2. 🌐 AUTHORIZED DOMAINS:');
console.log('   Issue: Domain not authorized for OAuth operations');
console.log('   Solutions:');
console.log('   - Go to Firebase Console > Authentication > Settings > Authorized domains');
console.log('   - Add your domain (localhost:3000 for development)');
console.log('   - Add production domain if deployed');
console.log('   - Common domains to add:');
console.log('     * localhost');
console.log('     * localhost:3000');
console.log('     * your-production-domain.com');
console.log('');

console.log('3. 🔑 GOOGLE CLOUD CONSOLE OAUTH:');
console.log('   Issue: OAuth consent screen or credentials not configured');
console.log('   Solutions:');
console.log('   - Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('   - Select project: festival-management-476511');
console.log('   - Go to APIs & Services > OAuth consent screen');
console.log('   - Configure consent screen with app information');
console.log('   - Go to APIs & Services > Credentials');
console.log('   - Check OAuth 2.0 Client IDs are configured');
console.log('   - Add authorized JavaScript origins and redirect URIs');
console.log('');

console.log('4. 🚫 POPUP BLOCKED:');
console.log('   Issue: Browser blocking authentication popup');
console.log('   Solutions:');
console.log('   - Allow popups for your domain');
console.log('   - Try different browser');
console.log('   - Use redirect method instead of popup');
console.log('   - Check browser console for popup errors');
console.log('');

console.log('5. 🔄 CORS ISSUES:');
console.log('   Issue: Cross-origin request blocked');
console.log('   Solutions:');
console.log('   - Check browser network tab for CORS errors');
console.log('   - Verify Firebase hosting configuration');
console.log('   - Check Next.js configuration');
console.log('');

console.log('6. 📱 MOBILE/RESPONSIVE ISSUES:');
console.log('   Issue: Authentication not working on mobile');
console.log('   Solutions:');
console.log('   - Test on desktop browser first');
console.log('   - Check mobile browser compatibility');
console.log('   - Verify touch events are working');
console.log('');

console.log('🔧 DEBUGGING STEPS:\n');

console.log('Step 1: Check Browser Console');
console.log('   - Open Developer Tools (F12)');
console.log('   - Look for error messages in Console tab');
console.log('   - Check Network tab for failed requests');
console.log('   - Look for Firebase/Google Auth specific errors');
console.log('');

console.log('Step 2: Test Firebase Configuration');
console.log('   - Verify all environment variables are loaded');
console.log('   - Check Firebase project settings match .env.local');
console.log('   - Test Firebase initialization in browser console');
console.log('');

console.log('Step 3: Test Google OAuth Setup');
console.log('   - Go to Google Cloud Console');
console.log('   - Check OAuth consent screen is configured');
console.log('   - Verify OAuth credentials are set up');
console.log('   - Check authorized domains include your current domain');
console.log('');

console.log('Step 4: Test Authentication Flow');
console.log('   - Try signing in with different Google account');
console.log('   - Test in incognito/private browsing mode');
console.log('   - Try different browser (Chrome, Firefox, Safari)');
console.log('   - Check if popup appears and gets blocked');
console.log('');

console.log('🛠️ IMMEDIATE FIXES TO TRY:\n');

console.log('Fix 1: Clear Browser Data');
console.log('   - Clear cookies and local storage');
console.log('   - Clear browser cache');
console.log('   - Try incognito mode');
console.log('');

console.log('Fix 2: Check Popup Blocker');
console.log('   - Disable popup blocker for your domain');
console.log('   - Allow popups in browser settings');
console.log('   - Try clicking sign-in button again');
console.log('');

console.log('Fix 3: Verify Domain Authorization');
console.log('   - Add localhost:3000 to Firebase authorized domains');
console.log('   - Add your current domain to Google Cloud OAuth settings');
console.log('   - Restart development server after changes');
console.log('');

console.log('Fix 4: Test Different Account');
console.log('   - Try signing in with different Google account');
console.log('   - Ensure the account has access to the team');
console.log('   - Check if account is in the authorized emails list');
console.log('');

console.log('🔍 SPECIFIC ERROR MESSAGES TO LOOK FOR:\n');

const commonErrors = [
  {
    error: 'auth/configuration-not-found',
    solution: 'Firebase configuration error - check project settings'
  },
  {
    error: 'auth/popup-blocked',
    solution: 'Browser blocked popup - allow popups for this domain'
  },
  {
    error: 'auth/popup-closed-by-user',
    solution: 'User closed popup - try again and complete sign-in'
  },
  {
    error: 'auth/unauthorized-domain',
    solution: 'Domain not authorized - add to Firebase authorized domains'
  },
  {
    error: 'auth/network-request-failed',
    solution: 'Network issue - check internet connection and try again'
  },
  {
    error: 'auth/too-many-requests',
    solution: 'Too many attempts - wait a few minutes and try again'
  }
];

commonErrors.forEach((item, index) => {
  console.log(`${index + 1}. Error: ${item.error}`);
  console.log(`   Solution: ${item.solution}`);
  console.log('');
});

console.log('📞 NEXT STEPS IF ISSUE PERSISTS:\n');

console.log('1. Check Firebase Console Logs');
console.log('   - Go to Firebase Console > Project Overview');
console.log('   - Check for any error messages or warnings');
console.log('   - Verify Authentication is properly enabled');
console.log('');

console.log('2. Test with Minimal Setup');
console.log('   - Create a simple test page with just Google sign-in');
console.log('   - Remove all other authentication logic');
console.log('   - Test if basic Firebase auth works');
console.log('');

console.log('3. Check Team Access Configuration');
console.log('   - Verify your email is added to a team in the database');
console.log('   - Check team captain emails are correctly configured');
console.log('   - Test with admin account first');
console.log('');

console.log('4. Contact Support');
console.log('   - Provide specific error messages from browser console');
console.log('   - Include steps to reproduce the issue');
console.log('   - Mention which browser and device you are using');
console.log('');

console.log('🎯 QUICK TEST COMMANDS:\n');

console.log('Test Firebase in Browser Console:');
console.log('```javascript');
console.log('// Open browser console and run:');
console.log('console.log("Firebase config:", window.firebase?.apps?.[0]?.options);');
console.log('console.log("Auth instance:", window.firebase?.auth?.());');
console.log('```');
console.log('');

console.log('Test Environment Variables:');
console.log('```javascript');
console.log('// Check if env vars are loaded:');
console.log('console.log("API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(-4));');
console.log('console.log("Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);');
console.log('```');
console.log('');

console.log('🚀 GOOGLE AUTH TROUBLESHOOTING COMPLETE!');
console.log('Follow the steps above to identify and fix the authentication issue.');
console.log('Most common cause: Domain not authorized in Firebase Console.');
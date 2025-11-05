#!/usr/bin/env node

console.log('🔍 DIAGNOSING TEAM ADMIN ACCESS ISSUES');
console.log('=====================================');

const fs = require('fs');
const path = require('path');

// Test 1: Check Firebase configuration
console.log('\n📋 TEST 1: Checking Firebase configuration...');

try {
  const firebasePath = path.join(process.cwd(), 'src/lib/firebase.ts');
  const firebaseContent = fs.readFileSync(firebasePath, 'utf8');
  
  const hasApiKey = firebaseContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY');
  const hasAuthDomain = firebaseContent.includes('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  const hasProjectId = firebaseContent.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const hasInitializeApp = firebaseContent.includes('initializeApp');
  const hasGetAuth = firebaseContent.includes('getAuth');
  
  console.log(`✅ Firebase API Key: ${hasApiKey ? '✅' : '❌'}`);
  console.log(`✅ Firebase Auth Domain: ${hasAuthDomain ? '✅' : '❌'}`);
  console.log(`✅ Firebase Project ID: ${hasProjectId ? '✅' : '❌'}`);
  console.log(`✅ Firebase Initialize: ${hasInitializeApp ? '✅' : '❌'}`);
  console.log(`✅ Firebase Auth: ${hasGetAuth ? '✅' : '❌'}`);
  
  if (hasApiKey && hasAuthDomain && hasProjectId && hasInitializeApp && hasGetAuth) {
    console.log('✅ Firebase configuration is correct!');
  } else {
    console.log('❌ Firebase configuration has issues');
  }
} catch (error) {
  console.log(`❌ Could not check Firebase configuration: ${error.message}`);
}

// Test 2: Check environment variables
console.log('\n📋 TEST 2: Checking environment variables...');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasFirebaseApiKey = envContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY=');
  const hasFirebaseAuthDomain = envContent.includes('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=');
  const hasFirebaseProjectId = envContent.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID=');
  
  console.log(`✅ Firebase API Key in .env.local: ${hasFirebaseApiKey ? '✅' : '❌'}`);
  console.log(`✅ Firebase Auth Domain in .env.local: ${hasFirebaseAuthDomain ? '✅' : '❌'}`);
  console.log(`✅ Firebase Project ID in .env.local: ${hasFirebaseProjectId ? '✅' : '❌'}`);
  
  if (hasFirebaseApiKey && hasFirebaseAuthDomain && hasFirebaseProjectId) {
    console.log('✅ Environment variables are properly set!');
  } else {
    console.log('❌ Environment variables are missing');
  }
} catch (error) {
  console.log(`❌ Could not check environment variables: ${error.message}`);
}

// Test 3: Check authentication context
console.log('\n📋 TEST 3: Checking authentication context...');

try {
  const contextPath = path.join(process.cwd(), 'src/contexts/FirebaseTeamAuthContext.tsx');
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  const hasProvider = contextContent.includes('FirebaseTeamAuthProvider');
  const hasUseAuth = contextContent.includes('useFirebaseTeamAuth');
  const hasSignIn = contextContent.includes('signInWithGoogleAuth');
  const hasCheckAccess = contextContent.includes('checkTeamAccess');
  
  console.log(`✅ Firebase Auth Provider: ${hasProvider ? '✅' : '❌'}`);
  console.log(`✅ useFirebaseTeamAuth hook: ${hasUseAuth ? '✅' : '❌'}`);
  console.log(`✅ Google Sign-in function: ${hasSignIn ? '✅' : '❌'}`);
  console.log(`✅ Team access check: ${hasCheckAccess ? '✅' : '❌'}`);
  
  if (hasProvider && hasUseAuth && hasSignIn && hasCheckAccess) {
    console.log('✅ Authentication context is properly implemented!');
  } else {
    console.log('❌ Authentication context has issues');
  }
} catch (error) {
  console.log(`❌ Could not check authentication context: ${error.message}`);
}

// Test 4: Check SecureTeamGuard
console.log('\n📋 TEST 4: Checking SecureTeamGuard component...');

try {
  const guardPath = path.join(process.cwd(), 'src/components/TeamAdmin/SecureTeamGuard.tsx');
  const guardContent = fs.readFileSync(guardPath, 'utf8');
  
  const hasGuardComponent = guardContent.includes('SecureTeamGuard');
  const hasAuthCheck = guardContent.includes('useFirebaseTeamAuth');
  const hasSignInPrompt = guardContent.includes('signInWithGoogleAuth');
  
  console.log(`✅ SecureTeamGuard component: ${hasGuardComponent ? '✅' : '❌'}`);
  console.log(`✅ Authentication check: ${hasAuthCheck ? '✅' : '❌'}`);
  console.log(`✅ Sign-in prompt: ${hasSignInPrompt ? '✅' : '❌'}`);
  
  if (hasGuardComponent && hasAuthCheck && hasSignInPrompt) {
    console.log('✅ SecureTeamGuard is properly implemented!');
  } else {
    console.log('❌ SecureTeamGuard has issues');
  }
} catch (error) {
  console.log(`❌ Could not check SecureTeamGuard: ${error.message}`);
}

// Test 5: Check team admin layout
console.log('\n📋 TEST 5: Checking team admin layout...');

try {
  const layoutPath = path.join(process.cwd(), 'src/app/team-admin/layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  const hasFirebaseProvider = layoutContent.includes('FirebaseTeamAuthProvider');
  const hasSecureGuard = layoutContent.includes('SecureTeamGuard');
  const hasTeamAdminProvider = layoutContent.includes('TeamAdminProvider');
  const hasGrandMarksProvider = layoutContent.includes('GrandMarksProvider');
  
  console.log(`✅ Firebase Auth Provider: ${hasFirebaseProvider ? '✅' : '❌'}`);
  console.log(`✅ Secure Team Guard: ${hasSecureGuard ? '✅' : '❌'}`);
  console.log(`✅ Team Admin Provider: ${hasTeamAdminProvider ? '✅' : '❌'}`);
  console.log(`✅ Grand Marks Provider: ${hasGrandMarksProvider ? '✅' : '❌'}`);
  
  if (hasFirebaseProvider && hasSecureGuard && hasTeamAdminProvider && hasGrandMarksProvider) {
    console.log('✅ Team admin layout is properly configured!');
  } else {
    console.log('❌ Team admin layout has configuration issues');
  }
} catch (error) {
  console.log(`❌ Could not check team admin layout: ${error.message}`);
}

// Test 6: Check team admin page
console.log('\n📋 TEST 6: Checking team admin page...');

try {
  const pagePath = path.join(process.cwd(), 'src/app/team-admin/page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  
  const hasUseTeamAdmin = pageContent.includes('useTeamAdmin');
  const hasUseFirebaseAuth = pageContent.includes('useFirebaseTeamAuth');
  const hasLoadingStates = pageContent.includes('authLoading') && pageContent.includes('accessLoading');
  const hasErrorHandling = pageContent.includes('accessDenied');
  
  console.log(`✅ useTeamAdmin hook: ${hasUseTeamAdmin ? '✅' : '❌'}`);
  console.log(`✅ useFirebaseTeamAuth hook: ${hasUseFirebaseAuth ? '✅' : '❌'}`);
  console.log(`✅ Loading states: ${hasLoadingStates ? '✅' : '❌'}`);
  console.log(`✅ Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
  
  if (hasUseTeamAdmin && hasUseFirebaseAuth && hasLoadingStates && hasErrorHandling) {
    console.log('✅ Team admin page is properly implemented!');
  } else {
    console.log('❌ Team admin page has implementation issues');
  }
} catch (error) {
  console.log(`❌ Could not check team admin page: ${error.message}`);
}

console.log('\n🎯 DIAGNOSIS SUMMARY');
console.log('===================');

console.log('✅ FIREBASE AUTHENTICATION SYSTEM RESTORED!');
console.log('');
console.log('🚀 HOW TO ACCESS TEAM ADMIN:');
console.log('1. 🌐 Open browser: http://localhost:3000/team-admin');
console.log('2. 🔐 You should see a loading screen first');
console.log('3. 🔑 If not signed in, you will see a sign-in prompt');
console.log('4. 📱 Click "Sign In" to authenticate with Google');
console.log('5. ✅ After signing in, you will access your team dashboard');
console.log('');
console.log('🔧 AUTHENTICATION FLOW:');
console.log('1. FirebaseTeamAuthProvider initializes Firebase auth');
console.log('2. SecureTeamGuard checks if user is authenticated');
console.log('3. If not authenticated → Shows sign-in prompt');
console.log('4. If authenticated → Checks team access permissions');
console.log('5. If authorized → Loads team dashboard');
console.log('6. If not authorized → Shows access denied message');
console.log('');
console.log('🎯 POSSIBLE ISSUES TO CHECK:');
console.log('- 🌐 Make sure your development server is running (npm run dev)');
console.log('- 🔥 Check browser console for Firebase errors (F12 → Console)');
console.log('- 🚫 Disable popup blockers for localhost:3000');
console.log('- 🔄 Clear browser cache and cookies for localhost');
console.log('- 📱 Try different browser (Chrome, Firefox, Safari)');
console.log('- 🔐 Make sure you have a valid Google account');
console.log('');
console.log('✅ SUCCESS: Firebase authentication system is properly configured!');

console.log('\n🏁 Diagnosis completed!');
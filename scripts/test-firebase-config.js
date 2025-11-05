console.log('🔥 TESTING FIREBASE CONFIGURATION\n');

// Import required modules
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.local file found and readable\n');
  
  // Parse environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  
  console.log('🔍 FIREBASE ENVIRONMENT VARIABLES CHECK:\n');
  
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];
  
  let allVarsPresent = true;
  
  firebaseVars.forEach(varName => {
    const value = envVars[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allVarsPresent = false;
    }
  });
  
  console.log('\n📋 FIREBASE CONFIGURATION SUMMARY:\n');
  
  if (allVarsPresent) {
    console.log('✅ All Firebase environment variables are present');
    
    // Validate specific values
    const projectId = envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'];
    const authDomain = envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'];
    const apiKey = envVars['NEXT_PUBLIC_FIREBASE_API_KEY'];
    
    console.log('\n🔍 CONFIGURATION VALIDATION:\n');
    
    if (projectId === 'wattaqa2k25-e04a8') {
      console.log('✅ Project ID matches expected value');
    } else {
      console.log(`❌ Project ID mismatch. Expected: wattaqa2k25-e04a8, Got: ${projectId}`);
    }
    
    if (authDomain === 'wattaqa2k25-e04a8.firebaseapp.com') {
      console.log('✅ Auth domain matches expected value');
    } else {
      console.log(`❌ Auth domain mismatch. Expected: wattaqa2k25-e04a8.firebaseapp.com, Got: ${authDomain}`);
    }
    
    if (apiKey && apiKey.startsWith('AIza')) {
      console.log('✅ API key format looks correct');
    } else {
      console.log('❌ API key format looks incorrect');
    }
    
  } else {
    console.log('❌ Some Firebase environment variables are missing');
  }
  
  console.log('\n🛠️ NEXT STEPS:\n');
  
  if (allVarsPresent) {
    console.log('1. ✅ Environment variables are configured correctly');
    console.log('2. 🔍 Check Firebase Console for project settings');
    console.log('3. 🌐 Verify authorized domains in Firebase Console');
    console.log('4. 🔑 Check Google Cloud Console OAuth settings');
    console.log('5. 🚫 Test if popup blocker is causing issues');
  } else {
    console.log('1. ❌ Fix missing environment variables in .env.local');
    console.log('2. 🔄 Restart development server after fixing');
    console.log('3. 🔍 Verify Firebase project configuration');
  }
  
  console.log('\n🎯 FIREBASE CONSOLE CHECKLIST:\n');
  console.log('□ Go to https://console.firebase.google.com/');
  console.log('□ Select project: wattaqa2k25-e04a8');
  console.log('□ Authentication > Sign-in method > Google enabled');
  console.log('□ Authentication > Settings > Authorized domains includes:');
  console.log('  - localhost');
  console.log('  - localhost:3000');
  console.log('  - your-production-domain.com');
  console.log('□ Project settings match .env.local values');
  
  console.log('\n🎯 GOOGLE CLOUD CONSOLE CHECKLIST:\n');
  console.log('□ Go to https://console.cloud.google.com/');
  console.log('□ Select project: festival-management-476511');
  console.log('□ APIs & Services > OAuth consent screen configured');
  console.log('□ APIs & Services > Credentials > OAuth 2.0 Client IDs exist');
  console.log('□ Authorized JavaScript origins include:');
  console.log('  - http://localhost:3000');
  console.log('  - https://your-domain.com');
  
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  console.log('\n🛠️ TROUBLESHOOTING:\n');
  console.log('1. Ensure .env.local file exists in project root');
  console.log('2. Check file permissions');
  console.log('3. Verify file is not corrupted');
}

console.log('\n🚀 FIREBASE CONFIGURATION TEST COMPLETE!');
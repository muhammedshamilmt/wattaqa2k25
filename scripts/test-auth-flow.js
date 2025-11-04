#!/usr/bin/env node

/**
 * Test script to verify authentication flow
 * This helps debug why no data is showing
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Testing Authentication Flow...\n');

// Test 1: Check if contexts are properly structured
console.log('1. Checking context structure...');

const teamAdminContextPath = path.join(__dirname, '../src/contexts/TeamAdminContext.tsx');
const secureAuthContextPath = path.join(__dirname, '../src/contexts/SecureAuthContext.tsx');

if (fs.existsSync(teamAdminContextPath)) {
  const teamAdminContent = fs.readFileSync(teamAdminContextPath, 'utf8');
  
  const checks = [
    { pattern: 'initialTeamCode', description: 'Team code prop support' },
    { pattern: 'setLoading\\(false\\)', description: 'Loading state management' },
    { pattern: 'useEffect.*initialTeamCode', description: 'Team code effect dependency' }
  ];
  
  checks.forEach(({ pattern, description }) => {
    const regex = new RegExp(pattern);
    console.log(`  ${regex.test(teamAdminContent) ? '✅' : '❌'} ${description}`);
  });
}

if (fs.existsSync(secureAuthContextPath)) {
  const secureAuthContent = fs.readFileSync(secureAuthContextPath, 'utf8');
  
  const checks = [
    { pattern: 'setIsLoading\\(false\\)', description: 'Immediate loading completion' },
    { pattern: 'localStorage\\.getItem.*authToken', description: 'Token retrieval' },
    { pattern: 'localStorage\\.getItem.*currentUser', description: 'User data retrieval' }
  ];
  
  checks.forEach(({ pattern, description }) => {
    const regex = new RegExp(pattern);
    console.log(`  ${regex.test(secureAuthContent) ? '✅' : '❌'} ${description}`);
  });
}

// Test 2: Check layout integration
console.log('\n2. Checking layout integration...');
const layoutPath = path.join(__dirname, '../src/app/team-admin/layout.tsx');

if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  const checks = [
    { pattern: 'initialTeamCode.*selectedTeam', description: 'Team code passing to context' },
    { pattern: 'setIsReady\\(true\\)', description: 'Immediate ready state' },
    { pattern: 'fetchTeamsData\\(\\)', description: 'Non-blocking teams fetch' }
  ];
  
  checks.forEach(({ pattern, description }) => {
    const regex = new RegExp(pattern);
    console.log(`  ${regex.test(layoutContent) ? '✅' : '❌'} ${description}`);
  });
}

// Test 3: Check page data fetching
console.log('\n3. Checking page data fetching...');
const pages = ['page.tsx', 'candidates/page.tsx', 'results/page.tsx'];

pages.forEach(page => {
  const pagePath = path.join(__dirname, `../src/app/team-admin/${page}`);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    const hasTeamCode = pageContent.includes('teamCode');
    const hasToken = pageContent.includes('token');
    const hasFetch = pageContent.includes('fetch');
    const hasAuth = pageContent.includes('Authorization') || pageContent.includes('Bearer');
    
    console.log(`  ${page}:`);
    console.log(`    ${hasTeamCode ? '✅' : '❌'} Uses teamCode`);
    console.log(`    ${hasToken ? '✅' : '❌'} Uses token`);
    console.log(`    ${hasFetch ? '✅' : '❌'} Makes API calls`);
    console.log(`    ${hasAuth ? '✅' : '❌'} Includes auth headers`);
  }
});

console.log('\n🔍 Common Issues and Solutions:');
console.log('1. No data showing:');
console.log('   - Check if localStorage has authToken and currentUser');
console.log('   - Verify API endpoints are responding');
console.log('   - Check browser console for errors');
console.log('   - Ensure team captain is logged in');

console.log('\n2. Loading issues:');
console.log('   - Verify contexts load in correct order');
console.log('   - Check if team code is passed correctly');
console.log('   - Ensure authentication completes quickly');

console.log('\n3. Authentication problems:');
console.log('   - Check if user is logged in as team-captain');
console.log('   - Verify authToken is valid');
console.log('   - Check if team is assigned to user');

console.log('\n🛠️ Debug Steps:');
console.log('1. Open browser developer tools');
console.log('2. Check localStorage: authToken and currentUser');
console.log('3. Check console for errors');
console.log('4. Check network tab for API calls');
console.log('5. Verify user type is "team-captain"');

console.log('\n✨ Authentication flow test complete!');
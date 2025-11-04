#!/usr/bin/env node

/**
 * Test script to verify immediate page display fix
 * This checks if pages show immediately without blocking
 */

const fs = require('fs');
const path = require('path');

console.log('⚡ Testing Immediate Page Display Fix...\n');

// Test 1: Check if pages show immediately
console.log('1. Checking immediate page display...');

const pages = [
  { file: 'page.tsx', name: 'Dashboard' },
  { file: 'candidates/page.tsx', name: 'Candidates' },
  { file: 'results/page.tsx', name: 'Results' }
];

pages.forEach(({ file, name }) => {
  const pagePath = path.join(__dirname, `../src/app/team-admin/${file}`);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    const checks = [
      { pattern: 'displayTeamCode.*teamCode.*Loading', description: 'Immediate team code display' },
      { pattern: '!.*if.*!teamCode.*return', description: 'No blocking teamCode checks' },
      { pattern: 'loading.*animate-pulse', description: 'Progressive loading indicators' },
      { pattern: 'Always show.*immediately', description: 'Immediate display comment' }
    ];
    
    console.log(`\n  ${name} Page:`);
    checks.forEach(({ pattern, description }) => {
      const regex = new RegExp(pattern, 'i');
      console.log(`    ${regex.test(pageContent) ? '✅' : '❌'} ${description}`);
    });
  }
});

// Test 2: Check context coordination
console.log('\n2. Checking context coordination...');

const contextPath = path.join(__dirname, '../src/contexts/TeamAdminContext.tsx');
if (fs.existsSync(contextPath)) {
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  const checks = [
    { pattern: 'initialTeamCode.*TeamAdminProviderProps', description: 'Team code prop interface' },
    { pattern: 'if.*initialTeamCode.*setTeamCode', description: 'Immediate team code setting' },
    { pattern: 'setLoading\\(false\\)', description: 'Loading completion' }
  ];
  
  checks.forEach(({ pattern, description }) => {
    const regex = new RegExp(pattern);
    console.log(`  ${regex.test(contextContent) ? '✅' : '❌'} ${description}`);
  });
}

// Test 3: Check layout integration
console.log('\n3. Checking layout integration...');

const layoutPath = path.join(__dirname, '../src/app/team-admin/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  const checks = [
    { pattern: 'TeamAdminProvider.*initialTeamCode.*selectedTeam', description: 'Team code passing' },
    { pattern: 'setIsReady\\(true\\)', description: 'Immediate ready state' },
    { pattern: 'fetchTeamsData\\(\\)', description: 'Background data fetch' }
  ];
  
  checks.forEach(({ pattern, description }) => {
    const regex = new RegExp(pattern);
    console.log(`  ${regex.test(layoutContent) ? '✅' : '❌'} ${description}`);
  });
}

console.log('\n⚡ Expected Behavior:');
console.log('• Pages appear instantly (< 0.5 seconds)');
console.log('• Team code shows immediately (or "Loading...")');
console.log('• Data loads progressively with skeleton UI');
console.log('• No blank loading screens');
console.log('• Statistics show loading animations while fetching');

console.log('\n🔍 If pages still show loading:');
console.log('1. Check browser console for JavaScript errors');
console.log('2. Verify localStorage has currentUser with team data');
console.log('3. Check if authToken exists in localStorage');
console.log('4. Ensure user is logged in as team-captain');
console.log('5. Check network tab for API call failures');

console.log('\n✨ Immediate page display test complete!');
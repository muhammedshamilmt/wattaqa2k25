#!/usr/bin/env node

/**
 * Debug script for team admin issues
 * This script helps identify why arts/sports marks aren't showing and loading issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Team Admin Issues...\n');

// Test 1: Check if results page has proper arts/sports calculation
console.log('1. Checking results page arts/sports calculation...');
const resultsPath = path.join(__dirname, '../src/app/team-admin/results/page.tsx');
const resultsContent = fs.readFileSync(resultsPath, 'utf8');

const resultsChecks = [
  { check: 'calculatePoints.*artsPoints.*sportsPoints', description: 'Arts/Sports points calculation function' },
  { check: 'programme\\.category.*===.*arts', description: 'Arts category detection' },
  { check: 'programme\\.category.*===.*sports', description: 'Sports category detection' },
  { check: 'pointsBreakdown\\.artsPoints', description: 'Arts points display' },
  { check: 'pointsBreakdown\\.sportsPoints', description: 'Sports points display' },
  { check: 'status.*===.*published', description: 'Published results filtering' }
];

resultsChecks.forEach(({ check, description }) => {
  const regex = new RegExp(check, 'i');
  if (regex.test(resultsContent)) {
    console.log(`  ✅ ${description}`);
  } else {
    console.log(`  ❌ Missing: ${description}`);
  }
});

// Test 2: Check API endpoints
console.log('\n2. Checking API endpoints...');
const apiPaths = [
  'src/app/api/team-admin/results/route.ts',
  'src/app/api/team-admin/candidates/route.ts'
];

apiPaths.forEach(apiPath => {
  const fullPath = path.join(__dirname, `../${apiPath}`);
  if (fs.existsSync(fullPath)) {
    const apiContent = fs.readFileSync(fullPath, 'utf8');
    const hasAuth = apiContent.includes('withAuth');
    const hasPublished = apiContent.includes('published');
    console.log(`  ${apiPath}:`);
    console.log(`    ${hasAuth ? '✅' : '❌'} Authentication protection`);
    console.log(`    ${hasPublished ? '✅' : '❌'} Published results filtering`);
  } else {
    console.log(`  ❌ ${apiPath} not found`);
  }
});

// Test 3: Check for loading issues in pages
console.log('\n3. Checking for loading issues...');
const pages = [
  { file: 'page.tsx', name: 'Dashboard' },
  { file: 'candidates/page.tsx', name: 'Candidates' },
  { file: 'results/page.tsx', name: 'Results' }
];

pages.forEach(({ file, name }) => {
  const pagePath = path.join(__dirname, `../src/app/team-admin/${file}`);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    const hasToken = pageContent.includes('token');
    const hasAuth = pageContent.includes('authenticatedFetch') || pageContent.includes('Authorization');
    const hasLoading = pageContent.includes('loading');
    const hasTeamCode = pageContent.includes('teamCode');
    
    console.log(`  ${name} Page:`);
    console.log(`    ${hasToken ? '✅' : '❌'} Token usage`);
    console.log(`    ${hasAuth ? '✅' : '❌'} Authentication headers`);
    console.log(`    ${hasLoading ? '✅' : '❌'} Loading state management`);
    console.log(`    ${hasTeamCode ? '✅' : '❌'} Team code usage`);
  }
});

// Test 4: Check for common issues
console.log('\n4. Checking for common issues...');

// Check if there are any console.error or console.log statements that might indicate issues
const commonIssues = [
  {
    pattern: 'console\\.error.*authentication',
    description: 'Authentication error logging',
    severity: 'warning'
  },
  {
    pattern: 'window\\.location\\.href.*login',
    description: 'Login redirect on auth failure',
    severity: 'info'
  },
  {
    pattern: 'status.*===.*401',
    description: '401 error handling',
    severity: 'info'
  },
  {
    pattern: 'status.*===.*403',
    description: '403 error handling',
    severity: 'info'
  }
];

pages.forEach(({ file, name }) => {
  const pagePath = path.join(__dirname, `../src/app/team-admin/${file}`);
  if (fs.existsSync(pagePath)) {
    const pageContent = fs.readFileSync(pagePath, 'utf8');
    
    console.log(`\n  ${name} Page Issues:`);
    commonIssues.forEach(({ pattern, description, severity }) => {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(pageContent)) {
        const icon = severity === 'warning' ? '⚠️' : severity === 'error' ? '❌' : 'ℹ️';
        console.log(`    ${icon} ${description}`);
      }
    });
  }
});

console.log('\n🔍 Potential Issues Analysis:');
console.log('1. Arts/Sports marks not showing:');
console.log('   - Check if there are published results in the database');
console.log('   - Verify programme categories are set correctly (arts/sports)');
console.log('   - Ensure API endpoints return proper data');
console.log('   - Check browser console for API errors');

console.log('\n2. Loading issues in other pages:');
console.log('   - Verify authentication tokens are being passed correctly');
console.log('   - Check if API endpoints are responding');
console.log('   - Ensure team code is available before making API calls');
console.log('   - Check network tab for failed requests');

console.log('\n🛠️ Debugging Steps:');
console.log('1. Open browser developer tools');
console.log('2. Check Console tab for JavaScript errors');
console.log('3. Check Network tab for failed API requests');
console.log('4. Verify localStorage has authToken and currentUser');
console.log('5. Check if team has published results in database');

console.log('\n✨ Debug Complete! Check the analysis above for potential issues.');
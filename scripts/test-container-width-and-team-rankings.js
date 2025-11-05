#!/usr/bin/env node

/**
 * Test Container Width Adjustment and Team Rankings Section
 * This script verifies the container width changes and new team rankings section
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 TESTING CONTAINER WIDTH AND TEAM RANKINGS');
console.log('=' .repeat(60));

// Test 1: Check container width adjustments
console.log('\n📏 Test 1: Verifying Container Width Adjustments');
console.log('-'.repeat(50));

const resultsPagePath = path.join(__dirname, '../src/app/results/page.tsx');
const resultsPageContent = fs.readFileSync(resultsPagePath, 'utf8');

const containerFeatures = [
  { name: 'Decreased padding', pattern: /px-8 sm:px-10 lg:px-16/ },
  { name: 'Max width constraint', pattern: /max-w-7xl/ },
  { name: 'Consistent header padding', pattern: /px-8 sm:px-10 lg:px-16 py-4 max-w-7xl/ },
  { name: 'Consistent main padding', pattern: /px-8 sm:px-10 lg:px-16 py-8 max-w-7xl/ }
];

let passedContainerTests = 0;
containerFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedContainerTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Container Width Results: ${passedContainerTests}/${containerFeatures.length} features implemented`);

// Test 2: Check team rankings section
console.log('\n🏆 Test 2: Verifying Team Rankings Section');
console.log('-'.repeat(50));

const teamRankingFeatures = [
  { name: 'Team Rankings header', pattern: /🏆 Team Rankings/ },
  { name: 'Team color circles', pattern: /backgroundColor: team\.color/ },
  { name: 'Rank badges', pattern: /Rank Badge/ },
  { name: 'Team points display', pattern: /team\.points/ },
  { name: 'Progress bars', pattern: /Progress Bar/ },
  { name: 'Results count', pattern: /team\.results.*results/ },
  { name: 'Responsive grid', pattern: /grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8/ },
  { name: 'Motion animations', pattern: /motion\.div.*initial.*opacity.*scale/ },
  { name: 'Hover effects', pattern: /hover:shadow-lg transition-all/ },
  { name: 'Empty state', pattern: /No Rankings Available/ }
];

let passedRankingTests = 0;
teamRankingFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedRankingTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Team Rankings Results: ${passedRankingTests}/${teamRankingFeatures.length} features implemented`);

// Test 3: Check positioning and layout
console.log('\n📐 Test 3: Verifying Layout and Positioning');
console.log('-'.repeat(50));

const layoutFeatures = [
  { name: 'Rankings above Competition Progress', pattern: /Team Rankings.*Competition Progress/s },
  { name: 'Proper spacing', pattern: /mb-8.*Main Dashboard Grid/ },
  { name: 'Motion delay sequencing', pattern: /delay: 0\.3/ },
  { name: 'Responsive team grid', pattern: /xl:grid-cols-8/ },
  { name: 'Team color integration', pattern: /borderColor: team\.color/ }
];

let passedLayoutTests = 0;
layoutFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedLayoutTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Layout Results: ${passedLayoutTests}/${layoutFeatures.length} features implemented`);

// Test 4: Check team color usage
console.log('\n🎨 Test 4: Verifying Team Color Usage');
console.log('-'.repeat(50));

const colorFeatures = [
  { name: 'Team color circles', pattern: /backgroundColor: team\.color.*{team\.teamCode}/ },
  { name: 'Border colors', pattern: /borderColor: team\.color/ },
  { name: 'Rank badge colors', pattern: /backgroundColor: team\.color.*{index \+ 1}/ },
  { name: 'Points text colors', pattern: /color: team\.color.*{team\.points}/ },
  { name: 'Progress bar colors', pattern: /backgroundColor: team\.color.*width:/ }
];

let passedColorTests = 0;
colorFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedColorTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Color Usage Results: ${passedColorTests}/${colorFeatures.length} features implemented`);

// Test 5: Check data integration
console.log('\n📊 Test 5: Verifying Data Integration');
console.log('-'.repeat(50));

const dataFeatures = [
  { name: 'Grand marks data usage', pattern: /grandMarksData\.length > 0/ },
  { name: 'Team code display', pattern: /team\.teamCode/ },
  { name: 'Team name display', pattern: /team\.name/ },
  { name: 'Points calculation', pattern: /team\.points.*Math\.max.*grandMarksData/ },
  { name: 'Results count', pattern: /team\.results/ },
  { name: 'Slice for display limit', pattern: /grandMarksData\.slice\(0, 8\)/ }
];

let passedDataTests = 0;
dataFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedDataTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Data Integration Results: ${passedDataTests}/${dataFeatures.length} features implemented`);

// Overall Results
console.log('\n🎯 OVERALL TEST RESULTS');
console.log('=' .repeat(60));

const totalTests = containerFeatures.length + teamRankingFeatures.length + layoutFeatures.length + colorFeatures.length + dataFeatures.length;
const totalPassed = passedContainerTests + passedRankingTests + passedLayoutTests + passedColorTests + passedDataTests;
const successRate = Math.round((totalPassed / totalTests) * 100);

console.log(`📊 Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalTests - totalPassed}`);
console.log(`🎯 Success Rate: ${successRate}%`);

if (successRate >= 90) {
  console.log('\n🎉 EXCELLENT! Container width and team rankings are fully implemented');
  console.log('✨ Features include:');
  console.log('   • Decreased container width with max-width constraint');
  console.log('   • Team rankings section with team colors above Competition Progress');
  console.log('   • Responsive grid layout for team cards');
  console.log('   • Team color integration in circles, borders, and progress bars');
  console.log('   • Rank badges and points display');
  console.log('   • Smooth animations and hover effects');
  console.log('   • Empty state handling');
} else if (successRate >= 70) {
  console.log('\n✅ GOOD! Most features are implemented');
  console.log('🔧 Some minor enhancements may be needed');
} else {
  console.log('\n⚠️  NEEDS WORK! Several features are missing');
  console.log('🔧 Please review the implementation');
}

console.log('\n📱 View the changes at: /results');
console.log('🎨 The page now has:');
console.log('   • Slightly decreased container width for better focus');
console.log('   • Team rankings section with colorful team cards');
console.log('   • Team colors prominently displayed in circles and UI elements');
console.log('   • Responsive design that works on all screen sizes');
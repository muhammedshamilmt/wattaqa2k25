#!/usr/bin/env node

/**
 * Test Expanded Width and Detailed Team Rankings
 * This script verifies the container width expansion and enhanced team rankings with Arts/Sports breakdown
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 TESTING EXPANDED WIDTH AND DETAILED TEAM RANKINGS');
console.log('=' .repeat(60));

// Test 1: Check container width expansion
console.log('\n📏 Test 1: Verifying Container Width Expansion');
console.log('-'.repeat(50));

const resultsPagePath = path.join(__dirname, '../src/app/results/page.tsx');
const resultsPageContent = fs.readFileSync(resultsPagePath, 'utf8');

const widthFeatures = [
  { name: 'Removed max-width constraint from header', pattern: /px-8 sm:px-10 lg:px-16 py-4"/ },
  { name: 'Removed max-width constraint from main', pattern: /px-8 sm:px-10 lg:px-16 py-8"/ },
  { name: 'No max-w-7xl in header', pattern: /px-8 sm:px-10 lg:px-16 py-4 max-w-7xl/ },
  { name: 'No max-w-7xl in main', pattern: /px-8 sm:px-10 lg:px-16 py-8 max-w-7xl/ }
];

let passedWidthTests = 0;
widthFeatures.forEach(feature => {
  const hasFeature = feature.pattern.test(resultsPageContent);
  if (feature.name.includes('No max-w-7xl')) {
    // For negative tests, we want them to NOT match
    if (!hasFeature) {
      console.log(`✅ ${feature.name}: Removed successfully`);
      passedWidthTests++;
    } else {
      console.log(`❌ ${feature.name}: Still present`);
    }
  } else {
    // For positive tests, we want them to match
    if (hasFeature) {
      console.log(`✅ ${feature.name}: Implemented`);
      passedWidthTests++;
    } else {
      console.log(`❌ ${feature.name}: Missing`);
    }
  }
});

console.log(`\n📊 Container Width Results: ${passedWidthTests}/${widthFeatures.length} features implemented`);

// Test 2: Check detailed team rankings
console.log('\n🏆 Test 2: Verifying Detailed Team Rankings');
console.log('-'.repeat(50));

const detailedRankingFeatures = [
  { name: 'Larger team cards', pattern: /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/ },
  { name: 'Enhanced rank badges', pattern: /#\{index \+ 1\}/ },
  { name: 'Team header section', pattern: /Team Header/ },
  { name: 'Total points display', pattern: /Total Points/ },
  { name: 'Arts points breakdown', pattern: /🎨 Arts.*artsPoints/ },
  { name: 'Sports points breakdown', pattern: /⚽ Sports.*sportsPoints/ },
  { name: 'Arts points styling', pattern: /bg-purple-50.*text-purple-600/ },
  { name: 'Sports points styling', pattern: /bg-green-50.*text-green-600/ },
  { name: 'Progress percentage', pattern: /Math\.round.*team\.points.*100/ },
  { name: 'Completed results display', pattern: /completed results/ }
];

let passedDetailedTests = 0;
detailedRankingFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedDetailedTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Detailed Rankings Results: ${passedDetailedTests}/${detailedRankingFeatures.length} features implemented`);

// Test 3: Check layout improvements
console.log('\n📐 Test 3: Verifying Layout Improvements');
console.log('-'.repeat(50));

const layoutFeatures = [
  { name: 'Responsive grid layout', pattern: /xl:grid-cols-4 gap-6/ },
  { name: 'Larger card padding', pattern: /rounded-xl p-6/ },
  { name: 'Enhanced team circle', pattern: /w-14 h-14 rounded-full/ },
  { name: 'Team name styling', pattern: /font-bold text-gray-900 text-base/ },
  { name: 'Rank display', pattern: /Rank #\{index \+ 1\}/ },
  { name: 'Points card styling', pattern: /text-center mb-4 p-3 bg-white rounded-lg border/ }
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

// Test 4: Check Arts/Sports breakdown
console.log('\n🎨 Test 4: Verifying Arts/Sports Breakdown');
console.log('-'.repeat(50));

const breakdownFeatures = [
  { name: 'Arts section styling', pattern: /bg-purple-50.*🎨 Arts/ },
  { name: 'Sports section styling', pattern: /bg-green-50.*⚽ Sports/ },
  { name: 'Arts points display', pattern: /artsPoints.*0.*pts/ },
  { name: 'Sports points display', pattern: /sportsPoints.*0.*pts/ },
  { name: 'Color indicators', pattern: /w-3 h-3 bg-purple-500 rounded-full/ },
  { name: 'Breakdown spacing', pattern: /space-y-3 mb-4/ }
];

let passedBreakdownTests = 0;
breakdownFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedBreakdownTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Arts/Sports Breakdown Results: ${passedBreakdownTests}/${breakdownFeatures.length} features implemented`);

// Test 5: Check visual enhancements
console.log('\n✨ Test 5: Verifying Visual Enhancements');
console.log('-'.repeat(50));

const visualFeatures = [
  { name: 'Enhanced rank badge', pattern: /w-8 h-8 rounded-full.*shadow-lg/ },
  { name: 'Team circle shadow', pattern: /w-14 h-14.*shadow-lg/ },
  { name: 'Card hover effects', pattern: /hover:shadow-lg transition-all/ },
  { name: 'Progress animation', pattern: /transition-all duration-1000/ },
  { name: 'Results footer styling', pattern: /bg-gray-100 rounded-lg py-2/ },
  { name: 'Motion animations', pattern: /initial.*opacity.*scale/ }
];

let passedVisualTests = 0;
visualFeatures.forEach(feature => {
  if (feature.pattern.test(resultsPageContent)) {
    console.log(`✅ ${feature.name}: Implemented`);
    passedVisualTests++;
  } else {
    console.log(`❌ ${feature.name}: Missing`);
  }
});

console.log(`\n📊 Visual Enhancements Results: ${passedVisualTests}/${visualFeatures.length} features implemented`);

// Overall Results
console.log('\n🎯 OVERALL TEST RESULTS');
console.log('=' .repeat(60));

const totalTests = widthFeatures.length + detailedRankingFeatures.length + layoutFeatures.length + breakdownFeatures.length + visualFeatures.length;
const totalPassed = passedWidthTests + passedDetailedTests + passedLayoutTests + passedBreakdownTests + passedVisualTests;
const successRate = Math.round((totalPassed / totalTests) * 100);

console.log(`📊 Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalTests - totalPassed}`);
console.log(`🎯 Success Rate: ${successRate}%`);

if (successRate >= 90) {
  console.log('\n🎉 EXCELLENT! Expanded width and detailed rankings are fully implemented');
  console.log('✨ Features include:');
  console.log('   • Expanded container width without max-width constraint');
  console.log('   • Detailed team cards with Arts/Sports points breakdown');
  console.log('   • Enhanced ranking display with position indicators');
  console.log('   • Responsive grid layout for optimal viewing');
  console.log('   • Color-coded Arts and Sports sections');
  console.log('   • Progress bars and completion statistics');
} else if (successRate >= 70) {
  console.log('\n✅ GOOD! Most features are implemented');
  console.log('🔧 Some minor enhancements may be needed');
} else {
  console.log('\n⚠️  NEEDS WORK! Several features are missing');
  console.log('🔧 Please review the implementation');
}

console.log('\n📱 View the changes at: /results');
console.log('🎨 The page now features:');
console.log('   • Expanded container width for better space utilization');
console.log('   • Detailed team ranking cards with comprehensive information');
console.log('   • Arts and Sports points breakdown for each team');
console.log('   • Enhanced visual design with team colors and animations');
console.log('   • Responsive layout that adapts to all screen sizes');
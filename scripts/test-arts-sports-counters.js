const fs = require('fs');
const path = require('path');

console.log('🧮 Testing Separate Arts and Sports Counters in Calculation Tab');
console.log('=' .repeat(60));

// Check if the checklist page has been updated with Arts/Sports counters
const checklistPath = path.join(__dirname, '../src/app/admin/results/checklist/page.tsx');

if (!fs.existsSync(checklistPath)) {
  console.log('❌ Checklist page not found');
  process.exit(1);
}

const checklistContent = fs.readFileSync(checklistPath, 'utf8');

console.log('\n1. Checking Arts and Sports data structure...');
const checks = [
  {
    name: 'Arts Points tracking',
    pattern: /artsPoints:\s*number/,
    description: 'Team totals include artsPoints field'
  },
  {
    name: 'Sports Points tracking', 
    pattern: /sportsPoints:\s*number/,
    description: 'Team totals include sportsPoints field'
  },
  {
    name: 'Arts Results tracking',
    pattern: /artsResults:\s*number/,
    description: 'Team totals include artsResults field'
  },
  {
    name: 'Sports Results tracking',
    pattern: /sportsResults:\s*number/,
    description: 'Team totals include sportsResults field'
  },
  {
    name: 'Category-based point allocation',
    pattern: /if \(result\.programmeCategory === 'arts'\)/,
    description: 'Points are allocated based on programme category'
  },
  {
    name: 'Sports category handling',
    pattern: /else if \(result\.programmeCategory === 'sports'\)/,
    description: 'Sports programmes are handled separately'
  },
  {
    name: 'Category-specific ranking',
    pattern: /if \(categoryFilter === 'sports'\)/,
    description: 'Teams are ranked by category-specific points'
  },
  {
    name: 'Arts ranking logic',
    pattern: /displayPoints = data\.artsPoints/,
    description: 'Arts filter shows arts points for ranking'
  },
  {
    name: 'Sports ranking logic',
    pattern: /displayPoints = data\.sportsPoints/,
    description: 'Sports filter shows sports points for ranking'
  }
];

let passedChecks = 0;
checks.forEach(check => {
  if (check.pattern.test(checklistContent)) {
    console.log(`✅ ${check.name}: ${check.description}`);
    passedChecks++;
  } else {
    console.log(`❌ ${check.name}: ${check.description}`);
  }
});

console.log('\n2. Checking UI display components...');
const uiChecks = [
  {
    name: 'Category-specific headers',
    pattern: /Sports Results Checklist.*Arts Results Checklist/,
    description: 'Page headers change based on active category'
  },
  {
    name: 'Sports rankings header',
    pattern: /🏃 Sports Rankings/,
    description: 'Sports rankings header is displayed'
  },
  {
    name: 'Arts rankings header',
    pattern: /🎨 Arts Rankings/,
    description: 'Arts rankings header is displayed'
  },
  {
    name: 'Arts points display',
    pattern: /Math\.round\(team\.artsPoints/,
    description: 'Arts points are displayed'
  },
  {
    name: 'Sports points display',
    pattern: /Math\.round\(team\.sportsPoints/,
    description: 'Sports points are displayed'
  },
  {
    name: 'Arts results count',
    pattern: /team\.artsResults/,
    description: 'Arts results count is displayed'
  },
  {
    name: 'Sports results count',
    pattern: /team\.sportsResults/,
    description: 'Sports results count is displayed'
  },
  {
    name: 'Arts progress bar',
    pattern: /bg-purple-500 rounded-full/,
    description: 'Arts progress bar with purple color'
  },
  {
    name: 'Sports progress bar',
    pattern: /bg-blue-500 rounded-full/,
    description: 'Sports progress bar with blue color'
  }
];

let passedUIChecks = 0;
uiChecks.forEach(check => {
  if (check.pattern.test(checklistContent)) {
    console.log(`✅ ${check.name}: ${check.description}`);
    passedUIChecks++;
  } else {
    console.log(`❌ ${check.name}: ${check.description}`);
  }
});

console.log('\n3. Checking calculation logic...');
const calculationChecks = [
  {
    name: 'Helper function for point allocation',
    pattern: /const addPointsToTeam = \(teamCode: string, points: number, result: EnhancedResult\)/,
    description: 'Helper function to add points to teams'
  },
  {
    name: 'Category-based point distribution',
    pattern: /teamTotals\[teamCode\]\.artsPoints \+= points/,
    description: 'Arts points are added separately'
  },
  {
    name: 'Sports point distribution',
    pattern: /teamTotals\[teamCode\]\.sportsPoints \+= points/,
    description: 'Sports points are added separately'
  },
  {
    name: 'Category-specific display points',
    pattern: /displayPoints = data\.sportsPoints/,
    description: 'Display points are set based on active category'
  }
];

let passedCalculationChecks = 0;
calculationChecks.forEach(check => {
  if (check.pattern.test(checklistContent)) {
    console.log(`✅ ${check.name}: ${check.description}`);
    passedCalculationChecks++;
  } else {
    console.log(`❌ ${check.name}: ${check.description}`);
  }
});

console.log('\n📊 Test Results Summary:');
console.log(`Data Structure: ${passedChecks}/${checks.length} checks passed`);
console.log(`UI Components: ${passedUIChecks}/${uiChecks.length} checks passed`);
console.log(`Calculation Logic: ${passedCalculationChecks}/${calculationChecks.length} checks passed`);

const totalChecks = checks.length + uiChecks.length + calculationChecks.length;
const totalPassed = passedChecks + passedUIChecks + passedCalculationChecks;

console.log(`\n🎯 Overall: ${totalPassed}/${totalChecks} checks passed (${Math.round((totalPassed/totalChecks)*100)}%)`);

if (totalPassed === totalChecks) {
  console.log('\n🎉 All tests passed! Separate Arts and Sports counters are properly implemented.');
  console.log('\n📋 Features implemented:');
  console.log('• Separate Arts and Sports point tracking');
  console.log('• Category-specific team rankings (no combined total)');
  console.log('• Individual result counters for each category');
  console.log('• Dynamic headers based on active category filter');
  console.log('• Category-specific progress bars and indicators');
} else {
  console.log('\n⚠️  Some tests failed. Please check the implementation.');
}

console.log('\n🔍 Next Steps:');
console.log('1. Test the calculation tab in the browser');
console.log('2. Add some checked results and verify counters');
console.log('3. Check that Arts and Sports points are calculated separately');
console.log('4. Verify teams are ranked by category-specific points only');
console.log('5. Test switching between Arts and Sports filters');
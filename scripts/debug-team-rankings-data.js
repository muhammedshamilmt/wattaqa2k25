#!/usr/bin/env node

/**
 * Debug script for Team Rankings Data Issue
 * 
 * This script helps debug why team rankings show zero data
 * by examining the published results structure
 */

console.log('🔍 Debugging Team Rankings Data Issue...\n');

console.log('📊 Expected Data Structure for Team Rankings:\n');

console.log('Published Results should have:');
console.log('- programmeId: string');
console.log('- programmeCategory: "arts" | "sports"');
console.log('- programmeSubcategory: "stage" | "non-stage" (for arts)');
console.log('- section: "senior" | "junior" | "sub-junior"');
console.log('- firstPoints, secondPoints, thirdPoints: number');
console.log('- firstPlaceTeams?: Array<{ teamCode: string, grade?: string }>');
console.log('- secondPlaceTeams?: Array<{ teamCode: string, grade?: string }>');
console.log('- thirdPlaceTeams?: Array<{ teamCode: string, grade?: string }>\n');

console.log('🚨 POTENTIAL ISSUES:\n');

console.log('Issue 1: Missing Team Results Properties');
console.log('The published results might not have firstPlaceTeams, secondPlaceTeams, thirdPlaceTeams');
console.log('These are needed for team-based programs (general and group)');
console.log('Individual programs use firstPlace, secondPlace, thirdPlace instead\n');

console.log('Issue 2: Programme Position Type Filtering');
console.log('The code filters by programme.positionType === teamRankingType');
console.log('But programmes might not have the correct positionType values');
console.log('Expected: "general", "group", "individual"\n');

console.log('Issue 3: Data Structure Mismatch');
console.log('Published results from checklist might have different structure');
console.log('than what the team rankings function expects\n');

console.log('🔧 DEBUGGING STEPS:\n');

console.log('1. Check Published Results API:');
console.log('   curl http://localhost:3000/api/results/status?status=published');
console.log('   Look for team-based results with firstPlaceTeams, etc.\n');

console.log('2. Check Programmes API:');
console.log('   curl http://localhost:3000/api/programmes');
console.log('   Verify positionType values are "general", "group", "individual"\n');

console.log('3. Check Teams API:');
console.log('   curl http://localhost:3000/api/teams');
console.log('   Verify team codes match those in results\n');

console.log('🔧 POTENTIAL FIXES:\n');

console.log('Fix 1: Add Debug Logging');
console.log(`
const getTeamRankings = () => {
  console.log('🔍 Debug: publishedResults count:', publishedResults?.length || 0);
  console.log('🔍 Debug: teams count:', teams?.length || 0);
  console.log('🔍 Debug: teamRankingType:', teamRankingType);
  
  if (publishedResults && publishedResults.length > 0) {
    console.log('🔍 Sample published result:', publishedResults[0]);
  }
  
  // ... rest of function
};
`);

console.log('Fix 2: Check for Alternative Data Structure');
console.log(`
// Maybe team results are stored differently
const teamResults = publishedResults.filter(result => {
  const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
  console.log('🔍 Programme found:', programme?.name, 'positionType:', programme?.positionType);
  return programme && programme.positionType === teamRankingType;
});

console.log('🔍 Filtered team results count:', teamResults.length);
`);

console.log('Fix 3: Handle Missing Team Properties');
console.log(`
// Check if team properties exist
teamResults.forEach(result => {
  console.log('🔍 Result has firstPlaceTeams:', !!result.firstPlaceTeams);
  console.log('🔍 Result has secondPlaceTeams:', !!result.secondPlaceTeams);
  console.log('🔍 Result has thirdPlaceTeams:', !!result.thirdPlaceTeams);
  
  // Maybe teams are stored in different properties
  console.log('🔍 All result properties:', Object.keys(result));
});
`);

console.log('🧪 TESTING APPROACH:\n');

console.log('1. Add debug logging to getTeamRankings function');
console.log('2. Check browser console when loading rankings page');
console.log('3. Verify published results have team-based data');
console.log('4. Check if programmes have correct positionType values');
console.log('5. Ensure team codes match between results and teams');

console.log('\n✨ This should help identify why team rankings show zero data!');
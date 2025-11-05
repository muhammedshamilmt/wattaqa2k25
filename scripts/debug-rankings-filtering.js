#!/usr/bin/env node

/**
 * Debug script for Rankings Filtering Issue
 * 
 * This script helps debug why "No performers match your filter criteria" 
 * appears when using "All Sections" and "All Categories"
 */

console.log('🔍 Debugging Rankings Filtering Issue...\n');

// Simulate the filtering logic to understand the issue
console.log('📊 Analyzing the filtering logic:\n');

console.log('Current filtering logic:');
console.log('1. Check if grandMarks exists and has length > 0');
console.log('2. Filter each grandMark (gm):');
console.log('   - Check if gm exists and totalMarks > 0');
console.log('   - If sectionFilter !== "all", check candidate section');
console.log('   - If categoryFilter !== "all", check programmeResults');
console.log('   - Return true if all conditions pass\n');

console.log('🚨 POTENTIAL ISSUES:\n');

console.log('Issue 1: Category Filter Logic');
console.log('When categoryFilter === "all", the code should skip category checking entirely');
console.log('Current: Still checks if programmeResults exists and is array');
console.log('Fix: Move the programmeResults check inside the categoryFilter !== "all" condition\n');

console.log('Issue 2: Data Structure Assumptions');
console.log('The code assumes grandMarks has programmeResults property');
console.log('But grandMarks might have a different structure');
console.log('Need to verify the actual data structure from /api/grand-marks\n');

console.log('Issue 3: Individual Programs Only Filter');
console.log('Even when categoryFilter === "all", it still filters by positionType === "individual"');
console.log('This might be excluding valid data\n');

console.log('🔧 RECOMMENDED FIXES:\n');

console.log('Fix 1: Simplify the filtering logic');
console.log(`
const getTopPerformers = () => {
  if (!grandMarks || grandMarks.length === 0) return [];

  return grandMarks
    .filter(gm => {
      if (!gm || gm.totalMarks <= 0) return false;
      
      // Filter by section
      if (sectionFilter !== 'all') {
        const candidate = candidates.find(c => c.chestNumber === gm.chestNumber);
        if (!candidate || candidate.section !== sectionFilter) return false;
      }
      
      // Filter by category ONLY if not "all"
      if (categoryFilter !== 'all') {
        // Only check programmeResults if we need to filter by category
        if (!gm.programmeResults || !Array.isArray(gm.programmeResults)) return false;
        
        const hasMatchingCategory = gm.programmeResults.some((pr: any) => {
          if (!pr || !pr.programmeId) return false;
          
          const programme = programmes.find(p => p._id?.toString() === pr.programmeId);
          if (!programme || programme.positionType !== 'individual') return false;
          
          if (categoryFilter === 'sports') {
            return programme.category === 'sports';
          } else if (categoryFilter === 'arts-stage') {
            return programme.category === 'arts' && programme.subcategory === 'stage';
          } else if (categoryFilter === 'arts-non-stage') {
            return programme.category === 'arts' && programme.subcategory === 'non-stage';
          }
          return false;
        });
        if (!hasMatchingCategory) return false;
      }
      
      return true;
    })
    .sort((a, b) => b.totalMarks - a.totalMarks)
    .slice(0, 20);
};
`);

console.log('Fix 2: Add debug logging');
console.log(`
const getTopPerformers = () => {
  console.log('🔍 Debug: grandMarks length:', grandMarks?.length || 0);
  console.log('🔍 Debug: sectionFilter:', sectionFilter);
  console.log('🔍 Debug: categoryFilter:', categoryFilter);
  
  if (!grandMarks || grandMarks.length === 0) {
    console.log('❌ No grandMarks data');
    return [];
  }

  const filtered = grandMarks.filter(gm => {
    console.log('🔍 Checking grandMark:', gm.chestNumber, 'totalMarks:', gm.totalMarks);
    
    if (!gm || gm.totalMarks <= 0) {
      console.log('❌ Invalid grandMark or zero totalMarks');
      return false;
    }
    
    // ... rest of filtering logic with debug logs
  });
  
  console.log('🔍 Debug: Filtered results count:', filtered.length);
  return filtered;
};
`);

console.log('Fix 3: Check data structure');
console.log('Add a console.log to see the actual structure of grandMarks[0]');
console.log('This will help understand if programmeResults exists and its format\n');

console.log('🧪 TESTING STEPS:\n');
console.log('1. Add debug logs to the getTopPerformers function');
console.log('2. Check browser console when loading the rankings page');
console.log('3. Verify the data structure of grandMarks');
console.log('4. Test with different filter combinations');
console.log('5. Fix the filtering logic based on findings\n');

console.log('✨ This should resolve the "No performers match your filter criteria" issue!');
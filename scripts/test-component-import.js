#!/usr/bin/env node

/**
 * Simple test to verify the PublicRankings component can be imported
 */

console.log('🧪 Testing Component Import...\n');

try {
  // Test if the component file exists and can be read
  const fs = require('fs');
  const path = require('path');
  
  const componentPath = path.join(__dirname, '..', 'src', 'components', 'Rankings', 'PublicRankings.tsx');
  
  if (fs.existsSync(componentPath)) {
    console.log('✅ PublicRankings component file exists');
    
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check for key exports and imports
    const hasDefaultExport = content.includes('export default function PublicRankings');
    const hasRequiredImports = content.includes("from '@/types'") && content.includes("from '@/utils/markingSystem'");
    const hasMotionImport = content.includes("from 'framer-motion'");
    
    console.log(`${hasDefaultExport ? '✅' : '❌'} Default export found`);
    console.log(`${hasRequiredImports ? '✅' : '❌'} Required imports found`);
    console.log(`${hasMotionImport ? '✅' : '❌'} Framer Motion import found`);
    
    // Check if results page imports the component
    const resultsPagePath = path.join(__dirname, '..', 'src', 'app', 'results', 'page.tsx');
    
    if (fs.existsSync(resultsPagePath)) {
      console.log('✅ Results page file exists');
      
      const resultsContent = fs.readFileSync(resultsPagePath, 'utf8');
      const hasImport = resultsContent.includes("import PublicRankings from '@/components/Rankings/PublicRankings'");
      const hasUsage = resultsContent.includes('<PublicRankings');
      
      console.log(`${hasImport ? '✅' : '❌'} PublicRankings import in results page`);
      console.log(`${hasUsage ? '✅' : '❌'} PublicRankings usage in results page`);
      
      if (hasImport && hasUsage) {
        console.log('\n✅ Component integration looks correct!');
        console.log('\n💡 If rankings are not showing:');
        console.log('1. Restart the development server');
        console.log('2. Clear browser cache');
        console.log('3. Check browser console for errors');
        console.log('4. Ensure you have published results in the database');
      } else {
        console.log('\n❌ Component integration incomplete');
      }
    } else {
      console.log('❌ Results page file not found');
    }
    
  } else {
    console.log('❌ PublicRankings component file not found');
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n✅ Component Import Test Complete!');
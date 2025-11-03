const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkProgrammeSubcategories() {
  console.log('🔍 CHECKING PROGRAMME SUBCATEGORIES');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    const programmes = await db.collection('programmes').find({}).toArray();
    
    console.log(`📊 Total Programmes: ${programmes.length}`);
    
    // Check subcategory field
    console.log('\n📊 SUBCATEGORY FIELD ANALYSIS:');
    console.log('--------------------------------------------------');
    
    const subcategoryCounts = {};
    const categorySubcategoryMap = {};
    
    programmes.forEach(programme => {
      const category = programme.category || 'No Category';
      const subcategory = programme.subcategory || 'No Subcategory';
      
      // Count subcategories
      subcategoryCounts[subcategory] = (subcategoryCounts[subcategory] || 0) + 1;
      
      // Map category to subcategories
      if (!categorySubcategoryMap[category]) {
        categorySubcategoryMap[category] = {};
      }
      categorySubcategoryMap[category][subcategory] = (categorySubcategoryMap[category][subcategory] || 0) + 1;
    });
    
    console.log('Subcategories found:');
    Object.entries(subcategoryCounts).forEach(([subcategory, count]) => {
      console.log(`   ${subcategory}: ${count} programmes`);
    });
    
    console.log('\n📊 CATEGORY → SUBCATEGORY BREAKDOWN:');
    console.log('--------------------------------------------------');
    
    Object.entries(categorySubcategoryMap).forEach(([category, subcategories]) => {
      console.log(`\n🎯 ${category.toUpperCase()}:`);
      Object.entries(subcategories).forEach(([subcategory, count]) => {
        console.log(`   ${subcategory}: ${count} programmes`);
      });
    });
    
    // Show sample programmes for each category-subcategory combination
    console.log('\n🔍 SAMPLE PROGRAMMES BY CATEGORY-SUBCATEGORY:');
    console.log('--------------------------------------------------');
    
    Object.entries(categorySubcategoryMap).forEach(([category, subcategories]) => {
      console.log(`\n📋 ${category.toUpperCase()} PROGRAMMES:`);
      
      Object.keys(subcategories).forEach(subcategory => {
        console.log(`\n   ${subcategory} (${subcategories[subcategory]} programmes):`);
        const sampleProgrammes = programmes
          .filter(p => p.category === category && p.subcategory === subcategory)
          .slice(0, 3);
        
        sampleProgrammes.forEach(programme => {
          console.log(`     - ${programme.name} (${programme.positionType})`);
        });
        
        if (subcategories[subcategory] > 3) {
          console.log(`     ... and ${subcategories[subcategory] - 3} more`);
        }
      });
    });
    
    console.log('\n🎯 CHECKLIST PAGE STRUCTURE RECOMMENDATION:');
    console.log('--------------------------------------------------');
    console.log('Based on the data, we should create separate pages for:');
    console.log('1. 🎨 Arts - Stage programmes');
    console.log('2. 🎨 Arts - Non-Stage programmes');
    console.log('3. 🏃 Sports programmes');
    console.log('');
    console.log('This will provide better organization and focused review workflows.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkProgrammeSubcategories();
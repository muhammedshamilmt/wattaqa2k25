const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkProgrammeCategories() {
  console.log('🔍 CHECKING PROGRAMME CATEGORIES');
  console.log('============================================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa-festival-2k25');
    
    const programmes = await db.collection('programmes').find({}).toArray();
    
    console.log(`📊 Total Programmes: ${programmes.length}`);
    
    // Check what fields exist for categorization
    console.log('\n🔍 PROGRAMME FIELDS ANALYSIS:');
    console.log('--------------------------------------------------');
    
    const sampleProgramme = programmes[0];
    if (sampleProgramme) {
      console.log('Sample programme structure:');
      Object.keys(sampleProgramme).forEach(key => {
        console.log(`   ${key}: ${typeof sampleProgramme[key]} - ${JSON.stringify(sampleProgramme[key]).substring(0, 100)}`);
      });
    }
    
    // Check for category field
    console.log('\n📊 CATEGORY FIELD ANALYSIS:');
    console.log('--------------------------------------------------');
    
    const categoryCounts = {};
    const positionTypeCounts = {};
    
    programmes.forEach(programme => {
      // Check category field
      const category = programme.category || 'No Category';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Check positionType field
      const positionType = programme.positionType || 'No Position Type';
      positionTypeCounts[positionType] = (positionTypeCounts[positionType] || 0) + 1;
    });
    
    console.log('Categories found:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} programmes`);
    });
    
    console.log('\nPosition Types found:');
    Object.entries(positionTypeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} programmes`);
    });
    
    // Show sample programmes from each category
    console.log('\n🔍 SAMPLE PROGRAMMES BY CATEGORY:');
    console.log('--------------------------------------------------');
    
    const uniqueCategories = [...new Set(programmes.map(p => p.category).filter(Boolean))];
    
    uniqueCategories.forEach(category => {
      console.log(`\n📋 ${category} Programmes (sample):`);
      const categoryProgrammes = programmes.filter(p => p.category === category).slice(0, 3);
      categoryProgrammes.forEach(programme => {
        console.log(`   - ${programme.name} (${programme.positionType})`);
      });
    });
    
    // Check if we can identify Arts vs Sports
    console.log('\n🎯 ARTS vs SPORTS IDENTIFICATION:');
    console.log('--------------------------------------------------');
    
    const artsKeywords = ['art', 'drawing', 'painting', 'calligraphy', 'poem', 'essay', 'speech', 'story', 'writing', 'recitation', 'qirath', 'azan'];
    const sportsKeywords = ['race', 'jump', 'running', 'cricket', 'football', 'badminton', 'volleyball', 'throw', 'pull'];
    
    let artsCount = 0;
    let sportsCount = 0;
    let otherCount = 0;
    
    programmes.forEach(programme => {
      const name = programme.name?.toLowerCase() || '';
      const isArts = artsKeywords.some(keyword => name.includes(keyword));
      const isSports = sportsKeywords.some(keyword => name.includes(keyword));
      
      if (isArts) {
        artsCount++;
      } else if (isSports) {
        sportsCount++;
      } else {
        otherCount++;
      }
    });
    
    console.log(`Arts programmes (by keywords): ${artsCount}`);
    console.log(`Sports programmes (by keywords): ${sportsCount}`);
    console.log(`Other programmes: ${otherCount}`);
    
    // Show sample arts and sports programmes
    console.log('\n📋 SAMPLE ARTS PROGRAMMES:');
    programmes.filter(p => {
      const name = p.name?.toLowerCase() || '';
      return artsKeywords.some(keyword => name.includes(keyword));
    }).slice(0, 5).forEach(programme => {
      console.log(`   - ${programme.name} (${programme.positionType})`);
    });
    
    console.log('\n🏃 SAMPLE SPORTS PROGRAMMES:');
    programmes.filter(p => {
      const name = p.name?.toLowerCase() || '';
      return sportsKeywords.some(keyword => name.includes(keyword));
    }).slice(0, 5).forEach(programme => {
      console.log(`   - ${programme.name} (${programme.positionType})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkProgrammeCategories();
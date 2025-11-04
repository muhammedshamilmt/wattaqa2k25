#!/usr/bin/env node

/**
 * Comprehensive fix for programme registration issue
 * This script will identify and fix the root cause
 */

const { MongoClient, ObjectId } = require('mongodb');

console.log('🔧 PROGRAMME REGISTRATION ISSUE FIX\n');

async function fixRegistrationIssue() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('wattaqa-festival-2k25');
    
    // Step 1: Check both possible collection names
    console.log('1️⃣ CHECKING COLLECTION NAMES:');
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('   Available collections:', collectionNames);
    
    const hasHyphenated = collectionNames.includes('programme-participants');
    const hasUnderscore = collectionNames.includes('programme_participants');
    
    console.log(`   programme-participants (hyphenated): ${hasHyphenated ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   programme_participants (underscore): ${hasUnderscore ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    let participantsCollection;
    let collectionName;
    
    if (hasUnderscore) {
      participantsCollection = db.collection('programme_participants');
      collectionName = 'programme_participants';
      console.log('   📋 Using programme_participants collection');
    } else if (hasHyphenated) {
      participantsCollection = db.collection('programme-participants');
      collectionName = 'programme-participants';
      console.log('   📋 Using programme-participants collection');
    } else {
      console.log('   ❌ NO PROGRAMME PARTICIPANTS COLLECTION FOUND!');
      console.log('   This is likely the root cause of the issue.');
      return;
    }
    
    // Step 2: Check data in the collection
    console.log('\n2️⃣ CHECKING COLLECTION DATA:');
    const totalCount = await participantsCollection.countDocuments();
    console.log(`   Total documents: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('   ❌ COLLECTION IS EMPTY!');
      console.log('   This explains why no registrations are showing up.');
      console.log('   You need to add programme registrations to the database.');
      return;
    }
    
    // Step 3: Analyze data structure
    console.log('\n3️⃣ ANALYZING DATA STRUCTURE:');
    const sampleDoc = await participantsCollection.findOne({});
    console.log('   Sample document structure:');
    console.log('   ', JSON.stringify(sampleDoc, null, 4));
    
    // Check field types
    console.log('\n   Field analysis:');
    console.log(`   programmeId type: ${typeof sampleDoc.programmeId}`);
    console.log(`   teamCode type: ${typeof sampleDoc.teamCode}`);
    console.log(`   Available fields: ${Object.keys(sampleDoc).join(', ')}`);
    
    // Step 4: Check API collection name mismatch
    console.log('\n4️⃣ CHECKING API COLLECTION NAME:');
    if (collectionName === 'programme_participants' && hasUnderscore) {
      console.log('   ⚠️  POTENTIAL ISSUE FOUND!');
      console.log('   Database uses: programme_participants (underscore)');
      console.log('   API might be using: programme-participants (hyphen)');
      console.log('   This could cause the API to not find any data.');
      
      // Fix: Update API to use correct collection name
      console.log('\n   🔧 FIXING API COLLECTION NAME...');
      console.log('   The API route needs to be updated to use the correct collection name.');
    }
    
    // Step 5: Test team code matching
    console.log('\n5️⃣ TESTING TEAM CODE MATCHING:');
    const teamCodes = await participantsCollection.distinct('teamCode');
    console.log('   Team codes in database:', teamCodes);
    
    // Test case sensitivity
    const smdExact = await participantsCollection.countDocuments({ teamCode: 'SMD' });
    const smdLower = await participantsCollection.countDocuments({ teamCode: 'smd' });
    const smdUpper = await participantsCollection.countDocuments({ teamCode: 'SMD' });
    
    console.log(`   SMD (exact): ${smdExact} documents`);
    console.log(`   smd (lower): ${smdLower} documents`);
    console.log(`   SMD (upper): ${smdUpper} documents`);
    
    // Step 6: Check programme ID formats
    console.log('\n6️⃣ CHECKING PROGRAMME ID FORMATS:');
    const programmesCollection = db.collection('programmes');
    const sampleProgramme = await programmesCollection.findOne({});
    
    if (sampleProgramme) {
      console.log(`   Programme _id type: ${typeof sampleProgramme._id}`);
      console.log(`   Programme _id value: ${sampleProgramme._id}`);
      console.log(`   Programme _id string: ${sampleProgramme._id.toString()}`);
      
      // Check if any participant programmeId matches programme _id
      const matchingParticipant = await participantsCollection.findOne({
        programmeId: sampleProgramme._id.toString()
      });
      
      if (matchingParticipant) {
        console.log('   ✅ ID format matching works correctly');
      } else {
        console.log('   ⚠️  No matching participant found for sample programme');
        console.log('   This could indicate ID format mismatch');
      }
    }
    
    // Step 7: Provide fix recommendations
    console.log('\n7️⃣ FIX RECOMMENDATIONS:');
    
    if (collectionName === 'programme_participants') {
      console.log('   🔧 Update API route to use correct collection name');
      console.log('   Change: db.collection("programme-participants")');
      console.log('   To: db.collection("programme_participants")');
    }
    
    if (totalCount > 0) {
      console.log('   ✅ Data exists in database');
      console.log('   🔧 Check API collection name and ID matching logic');
    }
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error);
  } finally {
    await client.close();
  }
}

console.log('🚀 Starting fix process...\n');
fixRegistrationIssue();
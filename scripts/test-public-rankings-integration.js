#!/usr/bin/env node

/**
 * Test script for Public Rankings Integration
 * Tests the integration of admin rankings functionality into the public results page
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';

async function testPublicRankingsIntegration() {
  console.log('🧪 Testing Public Rankings Integration...\n');

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. Check if we have the necessary data for rankings
    console.log('📊 Checking Data Availability:');
    
    const teamsCount = await db.collection('teams').countDocuments();
    const candidatesCount = await db.collection('candidates').countDocuments();
    const programmesCount = await db.collection('programmes').countDocuments();
    const publishedResultsCount = await db.collection('results').countDocuments({ status: 'published' });
    
    console.log(`✅ Teams: ${teamsCount}`);
    console.log(`✅ Candidates: ${candidatesCount}`);
    console.log(`✅ Programmes: ${programmesCount}`);
    console.log(`✅ Published Results: ${publishedResultsCount}`);
    
    console.log('\n');
    
    // 2. Test the API endpoints that the PublicRankings component uses
    console.log('🔍 Testing API Endpoints:');
    
    const endpoints = [
      '/api/teams',
      '/api/results/status?status=published',
      '/api/candidates',
      '/api/programmes'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${Array.isArray(data) ? data.length : 'OK'} items`);
        } else {
          console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
    console.log('\n');
    
    // 3. Check programme types for rankings
    console.log('🏆 Checking Programme Types for Rankings:');
    
    const programmes = await db.collection('programmes').find({}).toArray();
    const programmeTypes = programmes.reduce((acc, prog) => {
      acc[prog.positionType] = (acc[prog.positionType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Programme Types:');
    Object.entries(programmeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} programmes`);
    });
    
    console.log('\n');
    
    // 4. Check published results by programme type
    console.log('📈 Checking Published Results by Programme Type:');
    
    const publishedResults = await db.collection('results').find({ status: 'published' }).toArray();
    
    const resultsByType = {};
    for (const result of publishedResults) {
      const programme = programmes.find(p => p._id.toString() === result.programmeId);
      if (programme) {
        const type = programme.positionType;
        if (!resultsByType[type]) {
          resultsByType[type] = { count: 0, hasTeamWinners: 0, hasIndividualWinners: 0 };
        }
        resultsByType[type].count++;
        
        if (result.firstPlaceTeams || result.secondPlaceTeams || result.thirdPlaceTeams) {
          resultsByType[type].hasTeamWinners++;
        }
        if (result.firstPlace || result.secondPlace || result.thirdPlace) {
          resultsByType[type].hasIndividualWinners++;
        }
      }
    }
    
    console.log('Published Results by Type:');
    Object.entries(resultsByType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} results (${data.hasTeamWinners} with team winners, ${data.hasIndividualWinners} with individual winners)`);
    });
    
    console.log('\n');
    
    // 5. Test ranking calculations
    console.log('🧮 Testing Ranking Calculations:');
    
    // Test individual rankings
    const individualResults = publishedResults.filter(result => {
      const programme = programmes.find(p => p._id.toString() === result.programmeId);
      return programme && programme.positionType === 'individual';
    });
    
    console.log(`Individual programme results: ${individualResults.length}`);
    
    // Count unique individual winners
    const individualWinners = new Set();
    individualResults.forEach(result => {
      result.firstPlace?.forEach(winner => individualWinners.add(winner.chestNumber));
      result.secondPlace?.forEach(winner => individualWinners.add(winner.chestNumber));
      result.thirdPlace?.forEach(winner => individualWinners.add(winner.chestNumber));
    });
    
    console.log(`Unique individual winners: ${individualWinners.size}`);
    
    // Test team rankings
    const teamResults = publishedResults.filter(result => {
      const programme = programmes.find(p => p._id.toString() === result.programmeId);
      return programme && (programme.positionType === 'general' || programme.positionType === 'group');
    });
    
    console.log(`Team programme results: ${teamResults.length}`);
    
    // Count team winners
    const teamWinners = new Set();
    teamResults.forEach(result => {
      result.firstPlaceTeams?.forEach(winner => teamWinners.add(winner.teamCode));
      result.secondPlaceTeams?.forEach(winner => teamWinners.add(winner.teamCode));
      result.thirdPlaceTeams?.forEach(winner => teamWinners.add(winner.teamCode));
    });
    
    console.log(`Teams with wins: ${teamWinners.size}`);
    
    console.log('\n');
    
    // 6. Test the public results page accessibility
    console.log('🌐 Testing Public Results Page:');
    
    try {
      const response = await fetch('http://localhost:3000/results');
      if (response.ok) {
        console.log('✅ Public results page is accessible');
        const html = await response.text();
        
        // Check if the page contains ranking-related content
        const hasRankings = html.includes('Competition Rankings') || html.includes('Team Rankings') || html.includes('Top Performers');
        console.log(`${hasRankings ? '✅' : '❌'} Rankings content ${hasRankings ? 'found' : 'not found'} in page`);
      } else {
        console.log(`❌ Public results page: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Public results page: ${error.message}`);
    }
    
    console.log('\n✅ Public Rankings Integration Test Complete!');
    
    // 7. Recommendations
    console.log('\n💡 Recommendations:');
    
    if (publishedResultsCount === 0) {
      console.log('- Publish some results to see rankings in action');
    }
    
    if (individualWinners.size === 0) {
      console.log('- Add individual programme results to see top performers');
    }
    
    if (teamWinners.size === 0) {
      console.log('- Add team programme results to see team rankings');
    }
    
    if (teamsCount > 0 && candidatesCount > 0 && programmesCount > 0) {
      console.log('- All basic data is available for rankings functionality');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testPublicRankingsIntegration().catch(console.error);
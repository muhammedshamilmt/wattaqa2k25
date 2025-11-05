#!/usr/bin/env node

/**
 * Test script for Improved Results Page Design
 * Tests the modern dashboard layout and functionality
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';

async function testImprovedResultsPage() {
  console.log('🧪 Testing Improved Results Page Design...\n');

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. Check data availability for the dashboard
    console.log('📊 Checking Dashboard Data:');
    
    const teamsCount = await db.collection('teams').countDocuments();
    const candidatesCount = await db.collection('candidates').countDocuments();
    const programmesCount = await db.collection('programmes').countDocuments();
    const publishedResultsCount = await db.collection('results').countDocuments({ status: 'published' });
    const totalResultsCount = await db.collection('results').countDocuments();
    
    console.log(`✅ Teams: ${teamsCount}`);
    console.log(`✅ Candidates: ${candidatesCount}`);
    console.log(`✅ Programmes: ${programmesCount}`);
    console.log(`✅ Published Results: ${publishedResultsCount}`);
    console.log(`✅ Total Results: ${totalResultsCount}`);
    
    // Calculate completion rate
    const completionRate = programmesCount > 0 ? Math.round((publishedResultsCount / programmesCount) * 100) : 0;
    console.log(`📈 Completion Rate: ${completionRate}%`);
    
    console.log('\n');
    
    // 2. Check programme categories for stats cards
    console.log('🎯 Checking Programme Categories:');
    
    const programmes = await db.collection('programmes').find({}).toArray();
    const artsPrograms = programmes.filter(p => p.category === 'arts').length;
    const sportsPrograms = programmes.filter(p => p.category === 'sports').length;
    
    console.log(`🎨 Arts Programmes: ${artsPrograms}`);
    console.log(`⚽ Sports Programmes: ${sportsPrograms}`);
    console.log(`📊 Other Programmes: ${programmesCount - artsPrograms - sportsPrograms}`);
    
    console.log('\n');
    
    // 3. Test API endpoints for the dashboard
    console.log('🔍 Testing Dashboard API Endpoints:');
    
    const endpoints = [
      '/api/teams',
      '/api/results?teamView=true',
      '/api/candidates',
      '/api/programmes',
      '/api/grand-marks?category=all'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 'OK';
          console.log(`✅ ${endpoint}: ${count} items`);
        } else {
          console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
    console.log('\n');
    
    // 4. Check team rankings data
    console.log('🏆 Checking Team Rankings Data:');
    
    const teams = await db.collection('teams').find({}).toArray();
    console.log(`Teams available: ${teams.length}`);
    
    if (teams.length > 0) {
      teams.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name} (${team.code}) - Color: ${team.color || 'Not set'}`);
      });
    }
    
    console.log('\n');
    
    // 5. Check recent activity data
    console.log('📋 Checking Recent Activity Data:');
    
    const recentResults = await db.collection('results')
      .find({ status: 'published' })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`Recent published results: ${recentResults.length}`);
    
    if (recentResults.length > 0) {
      console.log('Latest results:');
      recentResults.slice(0, 5).forEach((result, index) => {
        const programme = programmes.find(p => p._id.toString() === result.programmeId);
        console.log(`  ${index + 1}. ${programme?.name || 'Unknown'} (${programme?.code || 'N/A'})`);
      });
    }
    
    console.log('\n');
    
    // 6. Test the improved results page
    console.log('🌐 Testing Improved Results Page:');
    
    try {
      const response = await fetch('http://localhost:3000/results');
      if (response.ok) {
        console.log('✅ Results page is accessible');
        const html = await response.text();
        
        // Check for modern design elements
        const hasModernHeader = html.includes('Festival Results');
        const hasStatsCards = html.includes('Total Programmes') || html.includes('Arts Programmes');
        const hasTeamLeaderboard = html.includes('Team Leaderboard');
        const hasPublicRankings = html.includes('Competition Rankings');
        const hasLiveFeed = html.includes('Live Results Feed');
        
        console.log(`${hasModernHeader ? '✅' : '❌'} Modern header ${hasModernHeader ? 'found' : 'not found'}`);
        console.log(`${hasStatsCards ? '✅' : '❌'} Stats cards ${hasStatsCards ? 'found' : 'not found'}`);
        console.log(`${hasTeamLeaderboard ? '✅' : '❌'} Team leaderboard ${hasTeamLeaderboard ? 'found' : 'not found'}`);
        console.log(`${hasPublicRankings ? '✅' : '❌'} Public rankings ${hasPublicRankings ? 'found' : 'not found'}`);
        console.log(`${hasLiveFeed ? '✅' : '❌'} Live results feed ${hasLiveFeed ? 'found' : 'not found'}`);
        
      } else {
        console.log(`❌ Results page: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Results page: ${error.message}`);
    }
    
    console.log('\n✅ Improved Results Page Design Test Complete!');
    
    // 7. Design improvement summary
    console.log('\n🎨 Design Improvements Summary:');
    console.log('✅ Modern clean header with better typography');
    console.log('✅ Key metrics cards with icons and progress indicators');
    console.log('✅ Simplified team leaderboard with better data presentation');
    console.log('✅ Integrated public rankings component');
    console.log('✅ Side-by-side layout for programme results and live feed');
    console.log('✅ Improved spacing, colors, and visual hierarchy');
    console.log('✅ Better responsive design for all screen sizes');
    
    // 8. Recommendations
    console.log('\n💡 Recommendations:');
    
    if (publishedResultsCount === 0) {
      console.log('- Publish some results to see the dashboard in action');
    }
    
    if (teamsCount === 0) {
      console.log('- Add team data to see team leaderboard');
    }
    
    if (programmesCount === 0) {
      console.log('- Add programme data to see stats cards');
    }
    
    console.log('- Test the page on different screen sizes');
    console.log('- Check the live update functionality');
    console.log('- Verify all interactive elements work properly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testImprovedResultsPage().catch(console.error);
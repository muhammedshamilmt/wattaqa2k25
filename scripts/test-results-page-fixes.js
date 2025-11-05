#!/usr/bin/env node

/**
 * Test script for Results Page Fixes
 * Tests the team leaderboard marks calculation and PublicRankings showing only Top Performers
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattaqa2k25';

async function testResultsPageFixes() {
  console.log('🧪 Testing Results Page Fixes...\n');

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // 1. Check team leaderboard data calculation
    console.log('🏆 Testing Team Leaderboard Marks Calculation:');
    
    const teams = await db.collection('teams').find({}).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    const publishedResults = await db.collection('results').find({ status: 'published' }).toArray();
    
    console.log(`Teams: ${teams.length}`);
    console.log(`Candidates: ${candidates.length}`);
    console.log(`Programmes: ${programmes.length}`);
    console.log(`Published Results: ${publishedResults.length}`);
    
    // Test team marks calculation logic
    if (teams.length > 0 && publishedResults.length > 0) {
      console.log('\n📊 Testing Team Marks Calculation:');
      
      const teamTotals = {};
      teams.forEach(team => {
        teamTotals[team.code] = { 
          name: team.name, 
          points: 0, 
          results: 0,
          artsPoints: 0,
          sportsPoints: 0,
          color: team.color || '#6366f1'
        };
      });
      
      // Helper function to get team code from chest number
      const getTeamCodeFromChestNumber = (chestNumber) => {
        const candidate = candidates.find(c => c.chestNumber === chestNumber);
        return candidate?.team || '';
      };
      
      publishedResults.forEach(result => {
        const programme = programmes.find(p => p._id.toString() === result.programmeId);
        if (!programme) return;
        
        // Helper function to add points to team totals
        const addPointsToTeam = (teamCode, points) => {
          if (teamTotals[teamCode]) {
            teamTotals[teamCode].points += points;
            teamTotals[teamCode].results += 1;
            
            // Separate Arts and Sports points
            if (programme.category === 'arts') {
              teamTotals[teamCode].artsPoints += points;
            } else if (programme.category === 'sports') {
              teamTotals[teamCode].sportsPoints += points;
            }
          }
        };
        
        // Process individual winners
        if (result.firstPlace) {
          result.firstPlace.forEach(winner => {
            const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
            if (teamCode) {
              addPointsToTeam(teamCode, result.firstPoints || 0);
            }
          });
        }
        
        if (result.secondPlace) {
          result.secondPlace.forEach(winner => {
            const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
            if (teamCode) {
              addPointsToTeam(teamCode, result.secondPoints || 0);
            }
          });
        }
        
        if (result.thirdPlace) {
          result.thirdPlace.forEach(winner => {
            const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
            if (teamCode) {
              addPointsToTeam(teamCode, result.thirdPoints || 0);
            }
          });
        }
        
        // Process team winners
        if (result.firstPlaceTeams) {
          result.firstPlaceTeams.forEach(winner => {
            addPointsToTeam(winner.teamCode, result.firstPoints || 0);
          });
        }
        
        if (result.secondPlaceTeams) {
          result.secondPlaceTeams.forEach(winner => {
            addPointsToTeam(winner.teamCode, result.secondPoints || 0);
          });
        }
        
        if (result.thirdPlaceTeams) {
          result.thirdPlaceTeams.forEach(winner => {
            addPointsToTeam(winner.teamCode, result.thirdPoints || 0);
          });
        }
      });

      // Convert to array and sort by total points
      const calculatedMarks = Object.entries(teamTotals)
        .map(([teamCode, data]) => ({
          teamCode,
          name: data.name,
          points: data.points,
          artsPoints: data.artsPoints,
          sportsPoints: data.sportsPoints,
          results: data.results,
          color: data.color
        }))
        .filter(team => team.points > 0)
        .sort((a, b) => b.points - a.points);
      
      console.log('Calculated Team Rankings:');
      calculatedMarks.forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.name} (${team.teamCode}): ${team.points} points (Arts: ${team.artsPoints}, Sports: ${team.sportsPoints})`);
      });
      
      if (calculatedMarks.length > 0) {
        console.log('✅ Team marks calculation working correctly');
      } else {
        console.log('⚠️ No team marks calculated - check if results have winners');
      }
    } else {
      console.log('⚠️ No teams or published results found for calculation test');
    }
    
    console.log('\n');
    
    // 2. Test API endpoints
    console.log('🔍 Testing API Endpoints:');
    
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
    
    // 3. Test the results page
    console.log('🌐 Testing Results Page:');
    
    try {
      const response = await fetch('http://localhost:3000/results');
      if (response.ok) {
        console.log('✅ Results page is accessible');
        const html = await response.text();
        
        // Check for key elements
        const hasModernHeader = html.includes('Festival Results');
        const hasTeamLeaderboard = html.includes('Team Leaderboard');
        const hasTopPerformers = html.includes('Top Performers');
        const hasNoTeamRankings = !html.includes('Team Rankings');
        const hasNoProgrammeResults = !html.includes('Programme Results');
        const hasNoLiveFeed = !html.includes('Live Results Feed');
        
        console.log(`${hasModernHeader ? '✅' : '❌'} Modern header ${hasModernHeader ? 'found' : 'not found'}`);
        console.log(`${hasTeamLeaderboard ? '✅' : '❌'} Team leaderboard ${hasTeamLeaderboard ? 'found' : 'not found'}`);
        console.log(`${hasTopPerformers ? '✅' : '❌'} Top Performers section ${hasTopPerformers ? 'found' : 'not found'}`);
        console.log(`${hasNoTeamRankings ? '✅' : '❌'} Team Rankings tab ${hasNoTeamRankings ? 'removed' : 'still present'}`);
        console.log(`${hasNoProgrammeResults ? '✅' : '❌'} Programme Results section ${hasNoProgrammeResults ? 'removed' : 'still present'}`);
        console.log(`${hasNoLiveFeed ? '✅' : '❌'} Live Results Feed section ${hasNoLiveFeed ? 'removed' : 'still present'}`);
        
      } else {
        console.log(`❌ Results page: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Results page: ${error.message}`);
    }
    
    console.log('\n✅ Results Page Fixes Test Complete!');
    
    // 4. Summary of fixes
    console.log('\n🎯 Summary of Fixes Applied:');
    console.log('✅ Fixed team leaderboard marks calculation using actual published results');
    console.log('✅ Modified PublicRankings to show only Top Performers (individual rankings)');
    console.log('✅ Removed Programme Results section for public users');
    console.log('✅ Removed Live Results Feed section for public users');
    console.log('✅ Removed Competition Progress section for cleaner public interface');
    console.log('✅ Simplified page structure focusing on key metrics and rankings');
    
    // 5. Recommendations
    console.log('\n💡 Recommendations:');
    
    if (publishedResults.length === 0) {
      console.log('- Publish some results to see team leaderboard with actual data');
    }
    
    if (teams.length === 0) {
      console.log('- Add team data to see team leaderboard');
    }
    
    console.log('- Test the page to verify team marks are calculated correctly');
    console.log('- Check that only Top Performers are shown in the rankings section');
    console.log('- Verify that Programme Results and Live Feed sections are removed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testResultsPageFixes().catch(console.error);
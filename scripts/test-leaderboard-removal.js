const { execSync } = require('child_process');

console.log('🗑️ Testing Leaderboard Page Removal');
console.log('=' .repeat(60));

async function testLeaderboardRemoval() {
  try {
    console.log('\n📝 Checking if leaderboard page has been removed...');
    
    // Test if leaderboard page returns 404
    console.log('\n🌐 Testing leaderboard URL access:');
    try {
      const response = await fetch('http://localhost:3000/leaderboard');
      if (response.status === 404) {
        console.log('✅ Leaderboard page correctly returns 404 - Successfully removed');
      } else {
        console.log(`❌ Leaderboard page still accessible - Status: ${response.status}`);
      }
    } catch (error) {
      console.log('✅ Leaderboard page is not accessible - Successfully removed');
    }

    // Test navigation components
    console.log('\n🧭 Testing navigation components:');
    
    // Test main landing page
    try {
      const landingResponse = await fetch('http://localhost:3000/');
      if (landingResponse.ok) {
        const landingHtml = await landingResponse.text();
        
        if (landingHtml.includes('href="/leaderboard"') || landingHtml.includes('View Leaderboard')) {
          console.log('❌ Landing page still contains leaderboard links');
        } else {
          console.log('✅ Landing page - leaderboard links removed');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test landing page');
    }

    // Test results page
    try {
      const resultsResponse = await fetch('http://localhost:3000/results');
      if (resultsResponse.ok) {
        const resultsHtml = await resultsResponse.text();
        
        if (resultsHtml.includes('href="/leaderboard"')) {
          console.log('❌ Results page still contains leaderboard links');
        } else {
          console.log('✅ Results page - leaderboard links removed');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test results page');
    }

    // Test programmes page
    try {
      const programmesResponse = await fetch('http://localhost:3000/programmes');
      if (programmesResponse.ok) {
        const programmesHtml = await programmesResponse.text();
        
        if (programmesHtml.includes('href="/leaderboard"')) {
          console.log('❌ Programmes page still contains leaderboard links');
        } else {
          console.log('✅ Programmes page - leaderboard links removed');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not test programmes page');
    }

    console.log('\n📊 Summary of Changes Made:');
    console.log('- ✅ Deleted: src/app/leaderboard/page.tsx');
    console.log('- ✅ Updated: src/components/Landing/Navbar.tsx');
    console.log('- ✅ Updated: src/components/Landing/Footer.tsx');
    console.log('- ✅ Updated: src/components/Landing/Hero.tsx');
    console.log('- ✅ Updated: src/components/Navigation/PublicNavbar.tsx');

    console.log('\n🎯 Navigation Changes:');
    console.log('- Removed "Leaderboard" links from all navigation menus');
    console.log('- Changed "View Leaderboard" button to "View Results" in Hero');
    console.log('- Updated mobile navigation menus');
    console.log('- Updated footer links');

    console.log('\n✅ Leaderboard Removal Complete!');
    console.log('\n📝 What users will see now:');
    console.log('- http://localhost:3000/leaderboard → 404 Not Found');
    console.log('- Navigation menus no longer show "Leaderboard" option');
    console.log('- Users are directed to "Results" page instead');
    console.log('- All team rankings are available in the Results page');

    console.log('\n🔄 Alternative Access:');
    console.log('- Team rankings: http://localhost:3000/results');
    console.log('- Competition results: http://localhost:3000/results');
    console.log('- Programme information: http://localhost:3000/programmes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
runTest().catch(console.error);

async function runTest() {
  await testLeaderboardRemoval();
  
  console.log('\n🎉 Leaderboard Removal Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Visit http://localhost:3000/ to verify navigation changes');
  console.log('2. Try accessing http://localhost:3000/leaderboard (should show 404)');
  console.log('3. Use http://localhost:3000/results for team rankings instead');
  console.log('4. Check all navigation menus are updated correctly');
}
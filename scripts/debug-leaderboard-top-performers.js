require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugLeaderboardTopPerformers() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('wattaqa2k25');
    
    console.log('🔍 DEBUGGING LEADERBOARD TOP PERFORMERS ISSUE\n');
    
    // Fetch published results
    const results = await db.collection('results').find({ status: 'published' }).toArray();
    console.log(`📊 Found ${results.length} published results`);
    
    // Fetch programmes
    const programmes = await db.collection('programmes').find({}).toArray();
    console.log(`📋 Found ${programmes.length} programmes`);
    
    // Fetch candidates
    const candidates = await db.collection('candidates').find({}).toArray();
    console.log(`👥 Found ${candidates.length} candidates\n`);
    
    // Check programme enrichment
    console.log('🔍 CHECKING PROGRAMME ENRICHMENT:');
    const sampleResults = results.slice(0, 3);
    
    for (const result of sampleResults) {
      const programme = programmes.find(p => p._id.toString() === result.programmeId?.toString());
      console.log(`Result ID: ${result._id}`);
      console.log(`Programme ID: ${result.programmeId}`);
      console.log(`Programme Found: ${programme ? programme.name : 'NOT FOUND'}`);
      console.log(`Programme Category: ${programme ? programme.category : 'N/A'}`);
      console.log('---');
    }
    
    // Generate top performers like leaderboard does
    console.log('\n🏆 GENERATING TOP PERFORMERS (LEADERBOARD LOGIC):');
    const topPerformersData = [];
    
    results.forEach((result) => {
      const programme = programmes.find(p => p._id.toString() === result.programmeId?.toString());
      
      // Add first place winners
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach((winner) => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && topPerformersData.length < 8) {
            const teamName = getTeamName(candidate.team);
            topPerformersData.push({
              name: candidate.name || 'Unknown Participant',
              chestNumber: winner.chestNumber,
              team: teamName,
              programme: programme?.name || 'Unknown Programme',
              programmeId: result.programmeId,
              position: '1st Place',
              grade: winner.grade || 'A+',
              points: (result.firstPoints || 5) + getGradePoints(winner.grade || 'A+')
            });
          }
        });
      }
    });
    
    // Sort by points
    topPerformersData.sort((a, b) => b.points - a.points);
    
    console.log(`Generated ${topPerformersData.length} top performers:`);
    topPerformersData.slice(0, 5).forEach((performer, index) => {
      console.log(`${index + 1}. ${performer.name} (${performer.chestNumber})`);
      console.log(`   Team: ${performer.team}`);
      console.log(`   Programme: ${performer.programme}`);
      console.log(`   Points: ${performer.points}`);
      console.log(`   Grade: ${performer.grade}`);
      console.log('---');
    });
    
    // Check for "Unknown Programme" issues
    console.log('\n❌ CHECKING FOR "UNKNOWN PROGRAMME" ISSUES:');
    const unknownProgrammes = topPerformersData.filter(p => p.programme === 'Unknown Programme');
    console.log(`Found ${unknownProgrammes.length} performers with "Unknown Programme"`);
    
    if (unknownProgrammes.length > 0) {
      console.log('Sample unknown programme entries:');
      unknownProgrammes.slice(0, 3).forEach(p => {
        console.log(`- ${p.name}: Programme ID ${p.programmeId}`);
        const programme = programmes.find(prog => prog._id.toString() === p.programmeId?.toString());
        console.log(`  Programme exists: ${programme ? 'YES' : 'NO'}`);
        if (programme) {
          console.log(`  Programme name: ${programme.name}`);
        }
      });
    }
    
    // Compare with PublicRankings logic
    console.log('\n🔄 COMPARING WITH PUBLIC RANKINGS LOGIC:');
    const performerScores = {};
    
    results
      .filter(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.positionType === 'individual';
      })
      .forEach(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
        
        if (result.firstPlace) {
          result.firstPlace.forEach(winner => {
            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
            
            if (!performerScores[winner.chestNumber]) {
              performerScores[winner.chestNumber] = { 
                totalMarks: 0, 
                programs: [], 
                candidate 
              };
            }
            
            const totalPoints = (result.firstPoints || 0) + (winner.grade ? getGradePoints(winner.grade) : 0);
            performerScores[winner.chestNumber].totalMarks += totalPoints;
            performerScores[winner.chestNumber].programs.push({
              programmeName: programme?.name || 'Unknown Programme',
              totalMarks: totalPoints,
              position: 'first',
              grade: winner.grade
            });
          });
        }
      });
    
    const publicRankingsTopPerformers = Object.entries(performerScores)
      .map(([chestNumber, data]) => ({
        chestNumber,
        totalMarks: data.totalMarks,
        programmeResults: data.programs,
        candidate: data.candidate
      }))
      .filter(performer => performer.totalMarks > 0)
      .sort((a, b) => b.totalMarks - a.totalMarks)
      .slice(0, 5);
    
    console.log(`PublicRankings logic generated ${publicRankingsTopPerformers.length} top performers:`);
    publicRankingsTopPerformers.forEach((performer, index) => {
      console.log(`${index + 1}. ${performer.candidate?.name || 'Unknown'} (${performer.chestNumber})`);
      console.log(`   Total Marks: ${performer.totalMarks}`);
      console.log(`   Programmes: ${performer.programmeResults.length}`);
      performer.programmeResults.forEach(prog => {
        console.log(`     - ${prog.programmeName} (${prog.totalMarks} pts)`);
      });
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

// Helper functions
function getTeamName(teamCode) {
  switch (teamCode?.toUpperCase()) {
    case 'INT': return 'Team Inthifada';
    case 'SMD': return 'Team Sumud';
    case 'AQS': return 'Team Aqsa';
    default: return teamCode || 'Unknown Team';
  }
}

function getGradePoints(grade) {
  switch (grade) {
    case 'A+': return 10;
    case 'A': return 9;
    case 'A-': return 8;
    case 'B+': return 7;
    case 'B': return 6;
    case 'B-': return 5;
    case 'C+': return 4;
    case 'C': return 3;
    case 'C-': return 2;
    case 'D+': return 1;
    case 'D': return 0.5;
    case 'D-': return 0.25;
    case 'E+': return 0.1;
    case 'E': return 0.05;
    case 'E-': return 0.01;
    case 'F': return 0;
    default: return 0;
  }
}

debugLeaderboardTopPerformers();
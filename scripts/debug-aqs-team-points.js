/**
 * Debug AQS Team Points Calculation
 * This script will help explain the discrepancy between grand total (13) and filtered summary (28)
 */

const { MongoClient } = require('mongodb');
// Grade points mapping (copied from markingSystem.ts)
const GRADE_POINTS = {
  A: 5,
  B: 3,
  C: 1
};

function getGradePoints(grade) {
  if (!grade) return 0;
  const normalizedGrade = grade.toUpperCase().charAt(0);
  return GRADE_POINTS[normalizedGrade] || 0;
}

async function debugAQSTeamPoints() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔍 DEBUGGING AQS TEAM POINTS CALCULATION');
    console.log('=' .repeat(60));
    
    // Get all data
    const results = await db.collection('results').find({ published: true }).toArray();
    const candidates = await db.collection('candidates').find({}).toArray();
    const programmes = await db.collection('programmes').find({}).toArray();
    
    console.log(`📊 Data Summary:`);
    console.log(`   Published Results: ${results.length}`);
    console.log(`   Total Candidates: ${candidates.length}`);
    console.log(`   AQS Candidates: ${candidates.filter(c => c.team === 'AQS').length}`);
    console.log(`   Total Programmes: ${programmes.length}`);
    console.log('');
    
    // Find AQS team results
    let aqsGrandTotal = 0;
    let aqsIndividual = 0;
    let aqsGroup = 0;
    let aqsGeneral = 0;
    let aqsProgrammes = [];
    
    console.log('🏆 AQS TEAM RESULTS BREAKDOWN:');
    console.log('-'.repeat(60));
    
    results.forEach((result, idx) => {
      const programme = programmes.find(p => p._id.toString() === result.programmeId);
      const programmeName = programme ? programme.name : result.programmeName || 'Unknown Programme';
      const programmeSection = programme ? programme.section : result.section;
      const programmePositionType = programme ? programme.positionType : result.positionType;
      
      // Determine mark category
      const getMarkCategory = (section, positionType) => {
        const normalizedSection = section.toLowerCase();
        if (normalizedSection === 'general') {
          return 'general';
        } else if (['senior', 'junior', 'sub-junior'].includes(normalizedSection)) {
          if (positionType === 'individual') return 'individual';
          else if (positionType === 'group') return 'group';
          else return 'general';
        }
        return positionType === 'individual' ? 'individual' : 
               positionType === 'group' ? 'group' : 'general';
      };
      
      const markCategory = getMarkCategory(programmeSection, programmePositionType);
      let hasAQSWinners = false;
      
      // Check individual winners
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
            if (candidate && candidate.team === 'AQS') {
              hasAQSWinners = true;
              const positionPoints = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = positionPoints + gradePoints;
              
              console.log(`   ${idx + 1}. ${programmeName}`);
              console.log(`      Winner: ${winner.chestNumber} (${candidate.name})`);
              console.log(`      Position: ${position.replace('Place', '')} = ${positionPoints} pts`);
              console.log(`      Grade: ${winner.grade || 'None'} = +${gradePoints} pts`);
              console.log(`      Total: ${totalPoints} pts [${markCategory}]`);
              console.log(`      Section: ${programmeSection}, Type: ${programmePositionType}`);
              console.log('');
              
              // Add to totals
              aqsGrandTotal += totalPoints;
              if (markCategory === 'individual') aqsIndividual += totalPoints;
              else if (markCategory === 'group') aqsGroup += totalPoints;
              else aqsGeneral += totalPoints;
              
              aqsProgrammes.push({
                name: programmeName,
                section: programmeSection,
                type: programmePositionType,
                category: markCategory,
                winner: winner.chestNumber,
                position: position.replace('Place', ''),
                positionPoints,
                gradePoints,
                totalPoints
              });
            }
          });
        }
      });
      
      // Check team winners
      ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            if (winner.teamCode === 'AQS') {
              hasAQSWinners = true;
              const positionPoints = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = positionPoints + gradePoints;
              
              console.log(`   ${idx + 1}. ${programmeName}`);
              console.log(`      Team Winner: AQS`);
              console.log(`      Position: ${position.replace('PlaceTeams', '')} = ${positionPoints} pts`);
              console.log(`      Grade: ${winner.grade || 'None'} = +${gradePoints} pts`);
              console.log(`      Total: ${totalPoints} pts [${markCategory}]`);
              console.log(`      Section: ${programmeSection}, Type: ${programmePositionType}`);
              console.log('');
              
              // Add to totals
              aqsGrandTotal += totalPoints;
              if (markCategory === 'individual') aqsIndividual += totalPoints;
              else if (markCategory === 'group') aqsGroup += totalPoints;
              else aqsGeneral += totalPoints;
              
              aqsProgrammes.push({
                name: programmeName,
                section: programmeSection,
                type: programmePositionType,
                category: markCategory,
                winner: 'AQS Team',
                position: position.replace('PlaceTeams', ''),
                positionPoints,
                gradePoints,
                totalPoints
              });
            }
          });
        }
      });
    });
    
    console.log('📊 AQS GRAND TOTAL SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`Individual: ${aqsIndividual}`);
    console.log(`Group: ${aqsGroup}`);
    console.log(`General: ${aqsGeneral}`);
    console.log(`GRAND TOTAL: ${aqsGrandTotal}`);
    console.log(`Total Programmes: ${aqsProgrammes.length}`);
    console.log('');
    
    // Now calculate filtered summary (all programmes, all winners)
    console.log('🔍 FILTERED RESULTS SUMMARY CALCULATION:');
    console.log('=' .repeat(50));
    
    let filteredTotalPoints = 0;
    let filteredWinners = 0;
    let filteredProgrammes = 0;
    
    results.forEach(result => {
      let programmeHasWinners = false;
      let programmePoints = 0;
      let programmeWinners = 0;
      
      // Count all individual winners
      ['firstPlace', 'secondPlace', 'thirdPlace'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            programmeHasWinners = true;
            programmeWinners++;
            const positionPoints = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = positionPoints + gradePoints;
            programmePoints += totalPoints;
          });
        }
      });
      
      // Count all team winners
      ['firstPlaceTeams', 'secondPlaceTeams', 'thirdPlaceTeams'].forEach((position, posIndex) => {
        if (result[position]) {
          result[position].forEach(winner => {
            programmeHasWinners = true;
            programmeWinners++;
            const positionPoints = [result.firstPoints, result.secondPoints, result.thirdPoints][posIndex];
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = positionPoints + gradePoints;
            programmePoints += totalPoints;
          });
        }
      });
      
      if (programmeHasWinners) {
        const programme = programmes.find(p => p._id.toString() === result.programmeId);
        const programmeName = programme ? programme.name : result.programmeName || 'Unknown Programme';
        
        console.log(`   ${programmeName}: ${programmeWinners} winners, ${programmePoints} total points`);
        
        filteredTotalPoints += programmePoints;
        filteredWinners += programmeWinners;
        filteredProgrammes++;
      }
    });
    
    console.log('');
    console.log('📊 FILTERED SUMMARY TOTALS:');
    console.log(`   Programmes: ${filteredProgrammes}`);
    console.log(`   Total Winners: ${filteredWinners}`);
    console.log(`   Total Points (With Grades): ${filteredTotalPoints}`);
    console.log('');
    
    console.log('🎯 EXPLANATION OF DISCREPANCY:');
    console.log('=' .repeat(50));
    console.log(`AQS Grand Total: ${aqsGrandTotal} points (only AQS team wins)`);
    console.log(`Filtered Summary: ${filteredTotalPoints} points (ALL teams' wins)`);
    console.log('');
    console.log('The "Filtered Results Summary" shows the total points distributed');
    console.log('across ALL teams in the filtered programmes, not just AQS team.');
    console.log('');
    console.log('This is why the numbers are different:');
    console.log('- Grand Total = Points earned by AQS team only');
    console.log('- Filtered Summary = Points earned by ALL teams combined');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config({ path: '.env.local' });
  debugAQSTeamPoints().catch(console.error);
}

module.exports = { debugAQSTeamPoints };
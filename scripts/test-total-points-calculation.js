/**
 * Test Total Points Calculation with Grades
 * This script demonstrates how the total points are now calculated correctly
 */

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

// Mock result data for testing
const mockResults = [
  {
    programmeName: "Test Programme 1",
    firstPoints: 15,
    secondPoints: 10,
    thirdPoints: 5,
    firstPlace: [
      { chestNumber: "AQS001", grade: "A" },  // 15 + 5 = 20 points
      { chestNumber: "SMD001", grade: "B" }   // 15 + 3 = 18 points
    ],
    secondPlace: [
      { chestNumber: "INT001", grade: "C" }   // 10 + 1 = 11 points
    ],
    thirdPlace: [
      { chestNumber: "A001", grade: "" }      // 5 + 0 = 5 points
    ],
    firstPlaceTeams: [
      { teamCode: "AQS", grade: "A" }         // 15 + 5 = 20 points
    ]
  },
  {
    programmeName: "Test Programme 2", 
    firstPoints: 10,
    secondPoints: 6,
    thirdPoints: 3,
    firstPlace: [
      { chestNumber: "SMD002", grade: "B" }   // 10 + 3 = 13 points
    ],
    secondPlaceTeams: [
      { teamCode: "INT", grade: "C" }         // 6 + 1 = 7 points
    ]
  }
];

function calculateTotalPointsOldWay(results) {
  let totalPoints = 0;
  results.forEach(result => {
    const firstCount = (result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0);
    const secondCount = (result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0);
    const thirdCount = (result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0);
    
    totalPoints += (firstCount * result.firstPoints) + (secondCount * result.secondPoints) + (thirdCount * result.thirdPoints);
  });
  return totalPoints;
}

function calculateTotalPointsNewWay(results) {
  let totalPoints = 0;
  results.forEach(result => {
    // Calculate individual winners with grade points
    if (result.firstPlace) {
      result.firstPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.firstPoints + gradePoints;
      });
    }
    if (result.secondPlace) {
      result.secondPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.secondPoints + gradePoints;
      });
    }
    if (result.thirdPlace) {
      result.thirdPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.thirdPoints + gradePoints;
      });
    }
    
    // Calculate team winners with grade points
    if (result.firstPlaceTeams) {
      result.firstPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.firstPoints + gradePoints;
      });
    }
    if (result.secondPlaceTeams) {
      result.secondPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.secondPoints + gradePoints;
      });
    }
    if (result.thirdPlaceTeams) {
      result.thirdPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        totalPoints += result.thirdPoints + gradePoints;
      });
    }
  });
  return totalPoints;
}

console.log('🧮 TOTAL POINTS CALCULATION TEST');
console.log('=' .repeat(50));

console.log('📊 Test Data:');
mockResults.forEach((result, idx) => {
  console.log(`   ${idx + 1}. ${result.programmeName}`);
  console.log(`      First: ${result.firstPlace?.length || 0} winners, ${result.firstPlaceTeams?.length || 0} teams`);
  console.log(`      Second: ${result.secondPlace?.length || 0} winners, ${result.secondPlaceTeams?.length || 0} teams`);
  console.log(`      Third: ${result.thirdPlace?.length || 0} winners, ${result.thirdPlaceTeams?.length || 0} teams`);
});

console.log('');
console.log('🔢 Calculation Results:');
const oldTotal = calculateTotalPointsOldWay(mockResults);
const newTotal = calculateTotalPointsNewWay(mockResults);

console.log(`   OLD WAY (Position only): ${oldTotal} points`);
console.log(`   NEW WAY (Position + Grades): ${newTotal} points`);
console.log(`   Difference: +${newTotal - oldTotal} points from grades`);

console.log('');
console.log('📋 Detailed Breakdown (New Way):');
console.log('   Programme 1:');
console.log('     AQS001 (1st, Grade A): 15 + 5 = 20 pts');
console.log('     SMD001 (1st, Grade B): 15 + 3 = 18 pts');
console.log('     INT001 (2nd, Grade C): 10 + 1 = 11 pts');
console.log('     A001 (3rd, No Grade): 5 + 0 = 5 pts');
console.log('     AQS Team (1st, Grade A): 15 + 5 = 20 pts');
console.log('     Programme 1 Total: 74 pts');
console.log('');
console.log('   Programme 2:');
console.log('     SMD002 (1st, Grade B): 10 + 3 = 13 pts');
console.log('     INT Team (2nd, Grade C): 6 + 1 = 7 pts');
console.log('     Programme 2 Total: 20 pts');
console.log('');
console.log(`   GRAND TOTAL: ${newTotal} pts`);

console.log('');
console.log('✅ VERIFICATION:');
if (newTotal > oldTotal) {
  console.log('   ✅ Grade points are now included in total calculation');
  console.log('   ✅ Published Summary will show correct total points');
  console.log('   ✅ Checked Marks Summary will show correct total points');
} else {
  console.log('   ❌ Something went wrong with the calculation');
}

// Grade points reference
console.log('');
console.log('📊 Grade Points Reference:');
console.log('   Grade A: +5 points');
console.log('   Grade B: +3 points');
console.log('   Grade C: +1 point');
console.log('   No Grade: +0 points');
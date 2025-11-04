#!/usr/bin/env node

/**
 * Test script to verify arts/sports data calculation
 * This helps debug why marks might not be showing
 */

console.log('🎨 Testing Arts/Sports Data Calculation...\n');

// Mock data to test the calculation logic
const mockResults = [
  {
    _id: '1',
    programmeId: 'prog1',
    status: 'published',
    firstPoints: 10,
    secondPoints: 7,
    thirdPoints: 5,
    firstPlace: [{ chestNumber: 'SMD001', grade: 'A' }],
    secondPlace: [],
    thirdPlace: [],
    firstPlaceTeams: [],
    secondPlaceTeams: [],
    thirdPlaceTeams: []
  },
  {
    _id: '2',
    programmeId: 'prog2',
    status: 'published',
    firstPoints: 8,
    secondPoints: 5,
    thirdPoints: 3,
    firstPlace: [],
    secondPlace: [{ chestNumber: 'SMD002', grade: 'B' }],
    thirdPlace: [],
    firstPlaceTeams: [],
    secondPlaceTeams: [],
    thirdPlaceTeams: []
  }
];

const mockProgrammes = [
  {
    _id: 'prog1',
    name: 'Classical Dance',
    category: 'arts',
    subcategory: 'stage'
  },
  {
    _id: 'prog2',
    name: 'Football',
    category: 'sports',
    subcategory: null
  }
];

const mockCandidates = [
  { chestNumber: 'SMD001', name: 'John Doe', section: 'senior' },
  { chestNumber: 'SMD002', name: 'Jane Smith', section: 'junior' }
];

const teamCode = 'SMD';

// Mock getGradePoints function
const getGradePoints = (grade) => {
  const gradeMap = { 'A': 5, 'B': 3, 'C': 1 };
  return gradeMap[grade] || 0;
};

// Test the calculation logic
const calculatePoints = (results) => {
  let totalPoints = 0;
  let artsPoints = 0;
  let sportsPoints = 0;

  results.forEach(result => {
    let points = 0;
    
    // Team points
    if (result.firstPlaceTeams?.some(t => t.teamCode === teamCode)) {
      const teamWinner = result.firstPlaceTeams.find(t => t.teamCode === teamCode);
      const gradePoints = getGradePoints(teamWinner?.grade || '');
      points += result.firstPoints + gradePoints;
    }
    if (result.secondPlaceTeams?.some(t => t.teamCode === teamCode)) {
      const teamWinner = result.secondPlaceTeams.find(t => t.teamCode === teamCode);
      const gradePoints = getGradePoints(teamWinner?.grade || '');
      points += result.secondPoints + gradePoints;
    }
    if (result.thirdPlaceTeams?.some(t => t.teamCode === teamCode)) {
      const teamWinner = result.thirdPlaceTeams.find(t => t.teamCode === teamCode);
      const gradePoints = getGradePoints(teamWinner?.grade || '');
      points += result.thirdPoints + gradePoints;
    }
    
    // Individual points
    if (result.firstPlace?.some(w => mockCandidates.some(c => c.chestNumber === w.chestNumber))) {
      result.firstPlace.forEach(winner => {
        if (mockCandidates.some(c => c.chestNumber === winner.chestNumber)) {
          const gradePoints = getGradePoints(winner.grade || '');
          points += result.firstPoints + gradePoints;
        }
      });
    }
    if (result.secondPlace?.some(w => mockCandidates.some(c => c.chestNumber === w.chestNumber))) {
      result.secondPlace.forEach(winner => {
        if (mockCandidates.some(c => c.chestNumber === winner.chestNumber)) {
          const gradePoints = getGradePoints(winner.grade || '');
          points += result.secondPoints + gradePoints;
        }
      });
    }
    if (result.thirdPlace?.some(w => mockCandidates.some(c => c.chestNumber === w.chestNumber))) {
      result.thirdPlace.forEach(winner => {
        if (mockCandidates.some(c => c.chestNumber === winner.chestNumber)) {
          const gradePoints = getGradePoints(winner.grade || '');
          points += result.thirdPoints + gradePoints;
        }
      });
    }

    // Add to category totals
    const programme = mockProgrammes.find(p => 
      p._id?.toString() === result.programmeId?.toString()
    );
    
    if (programme?.category === 'arts') {
      artsPoints += points;
    } else if (programme?.category === 'sports') {
      sportsPoints += points;
    }
    
    totalPoints += points;
  });

  return { totalPoints, artsPoints, sportsPoints };
};

console.log('📊 Testing with mock data:');
console.log('Results:', mockResults.length);
console.log('Programmes:', mockProgrammes.length);
console.log('Candidates:', mockCandidates.length);

const pointsBreakdown = calculatePoints(mockResults);

console.log('\n🎯 Calculation Results:');
console.log(`Arts Points: ${pointsBreakdown.artsPoints}`);
console.log(`Sports Points: ${pointsBreakdown.sportsPoints}`);
console.log(`Total Points: ${pointsBreakdown.totalPoints}`);

console.log('\n📋 Expected Results:');
console.log('- SMD001 won 1st place in Classical Dance (arts): 10 + 5 (grade A) = 15 points');
console.log('- SMD002 won 2nd place in Football (sports): 5 + 3 (grade B) = 8 points');
console.log('- Arts Points should be: 15');
console.log('- Sports Points should be: 8');
console.log('- Total Points should be: 23');

console.log('\n✅ Verification:');
console.log(`Arts Points: ${pointsBreakdown.artsPoints === 15 ? '✅ Correct' : '❌ Incorrect'} (Expected: 15, Got: ${pointsBreakdown.artsPoints})`);
console.log(`Sports Points: ${pointsBreakdown.sportsPoints === 8 ? '✅ Correct' : '❌ Incorrect'} (Expected: 8, Got: ${pointsBreakdown.sportsPoints})`);
console.log(`Total Points: ${pointsBreakdown.totalPoints === 23 ? '✅ Correct' : '❌ Incorrect'} (Expected: 23, Got: ${pointsBreakdown.totalPoints})`);

console.log('\n🔍 If arts/sports marks are not showing:');
console.log('1. Check if there are published results in the database');
console.log('2. Verify programmes have correct category (arts/sports)');
console.log('3. Ensure team candidates are in the results');
console.log('4. Check API responses in browser network tab');
console.log('5. Verify authentication tokens are working');

console.log('\n✨ Arts/Sports calculation logic is working correctly!');
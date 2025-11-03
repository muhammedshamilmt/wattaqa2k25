/**
 * Test script to verify the sports marking system implementation
 */

const { getPositionPoints, getGradePoints, calculateTotalPoints, getMarkingRulesSummary } = require('../src/utils/markingSystem');

console.log('🏃‍♂️ TESTING SPORTS MARKING SYSTEM\n');

// Test sports programmes
console.log('=== SPORTS PROGRAMMES ===');

// Individual sports (all sections)
console.log('\n📍 Individual Sports:');
const sportsIndividual = getPositionPoints('senior', 'individual', 'sports');
console.log('Senior Individual Sports:', sportsIndividual); // Should be 3,2,1

const sportsIndividualJunior = getPositionPoints('junior', 'individual', 'sports');
console.log('Junior Individual Sports:', sportsIndividualJunior); // Should be 3,2,1

const sportsIndividualSubJunior = getPositionPoints('sub-junior', 'individual', 'sports');
console.log('Sub-Junior Individual Sports:', sportsIndividualSubJunior); // Should be 3,2,1

// Group sports (all sections)
console.log('\n👥 Group Sports:');
const sportsGroupSenior = getPositionPoints('senior', 'group', 'sports');
console.log('Senior Group Sports:', sportsGroupSenior); // Should be 5,3,1

const sportsGroupJunior = getPositionPoints('junior', 'group', 'sports');
console.log('Junior Group Sports:', sportsGroupJunior); // Should be 5,3,1

const sportsGroupSubJunior = getPositionPoints('sub-junior', 'group', 'sports');
console.log('Sub-Junior Group Sports:', sportsGroupSubJunior); // Should be 5,3,1

// General sports
console.log('\n🏆 General Sports:');
const sportsGeneral = getPositionPoints('general', 'general', 'sports');
console.log('General Sports:', sportsGeneral); // Should be 15,10,5

// Test arts programmes (should remain unchanged)
console.log('\n=== ARTS PROGRAMMES (for comparison) ===');

const artsIndividual = getPositionPoints('senior', 'individual', 'arts');
console.log('Senior Individual Arts:', artsIndividual); // Should be 3,2,1

const artsGroup = getPositionPoints('senior', 'group', 'arts');
console.log('Senior Group Arts:', artsGroup); // Should be 5,3,1

const artsGeneral = getPositionPoints('general', 'individual', 'arts');
console.log('General Individual Arts:', artsGeneral); // Should be 10,6,3

// Test total points calculation
console.log('\n=== TOTAL POINTS CALCULATION ===');

// Sports (no grades)
const sportsFirstPlace = calculateTotalPoints('senior', 'individual', 'first', '', 'sports');
console.log('Sports Individual 1st place (no grade):', sportsFirstPlace); // Should be 3

// Arts with grade
const artsFirstPlace = calculateTotalPoints('senior', 'individual', 'first', 'A', 'arts');
console.log('Arts Individual 1st place (A grade):', artsFirstPlace); // Should be 8 (3+5)

// Test marking rules summary
console.log('\n=== MARKING RULES SUMMARY ===');
console.log('\nSports Rules:');
console.log(getMarkingRulesSummary('sports'));

console.log('\nArts Rules:');
console.log(getMarkingRulesSummary('arts'));

console.log('\n✅ Sports marking system test completed!');
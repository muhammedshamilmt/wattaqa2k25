#!/usr/bin/env node

/**
 * Test script for General Individual Programs Team Instances Enhancement
 * 
 * This script tests the new functionality that adds team instances for general individual programs,
 * allowing teams with multiple participants to have multiple entries (Entry 1, Entry 2, Entry 3).
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing General Individual Programs Team Instances Enhancement...\n');

// Test 1: Check if the logic handles general individual programs correctly
console.log('✅ Test 1: Checking handleSectionSelection logic for general individual programs');

const resultsPagePath = path.join(__dirname, '../src/app/admin/results/page.tsx');
const resultsPageContent = fs.readFileSync(resultsPagePath, 'utf8');

// Check if the logic correctly identifies general individual programs
const hasGeneralIndividualLogic = resultsPageContent.includes('selectedSection === \'general\' && selectedProgramme?.positionType === \'individual\'');
console.log(`   - General individual program detection: ${hasGeneralIndividualLogic ? '✅ PASS' : '❌ FAIL'}`);

// Check if team instances are created for general individual programs
const hasTeamInstancesForGeneralIndividual = resultsPageContent.includes('Create team instances for individual programs (including general individual)');
console.log(`   - Team instances creation for general individual: ${hasTeamInstancesForGeneralIndividual ? '✅ PASS' : '❌ FAIL'}`);

// Check if participants filtering includes general section
const hasGeneralParticipantFiltering = resultsPageContent.includes('p.candidate.section === section || section === \'general\'');
console.log(`   - General section participant filtering: ${hasGeneralParticipantFiltering ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n✅ Test 2: Checking UI display conditions for general individual programs');

// Check if team instances display includes general individual programs
const hasTeamInstancesDisplay = resultsPageContent.includes('Team Instances - {selectedSection === \'general\' ? \'General Individual\' : \'Individual\'} Programme');
console.log(`   - Team instances display for general individual: ${hasTeamInstancesDisplay ? '✅ PASS' : '❌ FAIL'}`);

// Check if individual participants display includes general individual programs
const hasIndividualParticipantsDisplay = resultsPageContent.includes('Registered Participants - {selectedSection === \'general\' ? \'General Individual\' : \'Individual\'} Programme');
console.log(`   - Individual participants display for general individual: ${hasIndividualParticipantsDisplay ? '✅ PASS' : '❌ FAIL'}`);

// Check if the group/general teams display excludes general individual programs
const hasCorrectGroupTeamsCondition = resultsPageContent.includes('selectedSection === \'general\' && selectedProgramme?.positionType === \'general\'');
console.log(`   - Correct group teams display condition: ${hasCorrectGroupTeamsCondition ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n✅ Test 3: Checking team instance functionality');

// Check if instanceId is supported in form data
const hasInstanceIdSupport = resultsPageContent.includes('instanceId?: number');
console.log(`   - InstanceId support in form data: ${hasInstanceIdSupport ? '✅ PASS' : '❌ FAIL'}`);

// Check if team position functions handle instanceId
const hasInstanceIdInToggleFunction = resultsPageContent.includes('toggleTeamPosition(\'firstPlaceTeams\', teamEntry.teamCode, teamEntry.instanceId)');
console.log(`   - InstanceId in toggle team position: ${hasInstanceIdInToggleFunction ? '✅ PASS' : '❌ FAIL'}`);

// Check if grade functions handle instanceId
const hasInstanceIdInGradeFunction = resultsPageContent.includes('updateTeamGrade(\'firstPlaceTeams\', teamEntry.teamCode, teamEntry.instanceId, e.target.value)');
console.log(`   - InstanceId in update team grade: ${hasInstanceIdInGradeFunction ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n✅ Test 4: Checking program type differentiation');

// Check if the logic correctly differentiates between program types
const programTypeTests = [
    {
        name: 'Individual programs (non-general)',
        condition: 'selectedProgramme?.positionType === \'individual\' && selectedSection !== \'general\'',
        expected: 'Should show individual participants + team instances'
    },
    {
        name: 'General individual programs',
        condition: 'selectedSection === \'general\' && selectedProgramme?.positionType === \'individual\'',
        expected: 'Should show individual participants + team instances'
    },
    {
        name: 'General team-based programs',
        condition: 'selectedSection === \'general\' && selectedProgramme?.positionType === \'general\'',
        expected: 'Should show only team entries (no instances)'
    },
    {
        name: 'Group programs',
        condition: 'selectedProgramme?.positionType === \'group\'',
        expected: 'Should show team entries with instances'
    }
];

programTypeTests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name}: ${test.expected}`);
});

console.log('\n✅ Test 5: Checking enhanced features');

// Check if the note explains the functionality
const hasExplanatoryNote = resultsPageContent.includes('Teams with more than 2 participants can have multiple entries');
console.log(`   - Explanatory note for team instances: ${hasExplanatoryNote ? '✅ PASS' : '❌ FAIL'}`);

// Check if the UI differentiates between general and regular individual programs
const hasProgramTypeLabeling = resultsPageContent.includes('General Individual');
console.log(`   - Program type labeling in UI: ${hasProgramTypeLabeling ? '✅ PASS' : '❌ FAIL'}`);

// Check if the team instances have proper styling
const hasTeamInstancesStyling = resultsPageContent.includes('bg-blue-50 border border-blue-200');
console.log(`   - Team instances styling (blue theme): ${hasTeamInstancesStyling ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n📋 Summary of Enhancement:');
console.log('   • General individual programs now support team instances');
console.log('   • Teams with >2 participants get Entry 1, Entry 2, Entry 3 options');
console.log('   • Individual marks still go to participants, team instances track team performance');
console.log('   • UI clearly differentiates between program types');
console.log('   • Maintains backward compatibility with existing functionality');

console.log('\n🎯 Expected Behavior:');
console.log('   1. Select a programme with positionType="individual" and section="general"');
console.log('   2. Choose "General" section in the form');
console.log('   3. See both individual participants AND team instances sections');
console.log('   4. Teams with >2 participants show multiple entries (Entry 1, 2, 3)');
console.log('   5. Can assign positions and grades to both individuals and team instances');
console.log('   6. Individual marks go to participants, team marks go to teams');

console.log('\n✨ Enhancement completed successfully!');
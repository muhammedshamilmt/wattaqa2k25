'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedResult, Team, Candidate } from '@/types';
import DailyMarksSummary from './DailyMarksSummary';
import { getGradePoints } from '@/utils/markingSystem';

interface TeamMarks {
  teamCode: string;
  teamName: string;
  teamColor: string;
  individual: number;
  group: number;
  general: number;
  total: number;
  participantCount: number;
  programmes: {
    name: string;
    category: string;
    section: string;
    points: number;
    type: 'individual' | 'group' | 'general';
  }[];
}

interface MarksSummaryProps {
  results: EnhancedResult[];
  showDailyProgress?: boolean;
  categoryFilter?: 'arts-total' | 'arts-stage' | 'arts-non-stage' | 'sports' | null;
  allResults?: EnhancedResult[]; // For showing complete team performance context
}

export default function MarksSummary({ results, showDailyProgress = false, categoryFilter = null, allResults }: MarksSummaryProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [teamMarks, setTeamMarks] = useState<TeamMarks[]>([]);
  // Removed loading state for faster rendering
  const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'daily' | 'programmes' | 'breakdown'>('summary');
  const [showFullTeamPerformance, setShowFullTeamPerformance] = useState(false);
  
  // Filter states for Programme Breakdown
  const [breakdownSearchTerm, setBreakdownSearchTerm] = useState('');
  const [breakdownFilterSection, setBreakdownFilterSection] = useState('');
  const [breakdownFilterCategory, setBreakdownFilterCategory] = useState('');
  const [breakdownFilterType, setBreakdownFilterType] = useState('');
  const [breakdownFilterTeam, setBreakdownFilterTeam] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && candidates.length > 0 && programmes.length > 0) {
      calculateTeamMarks();
    }
  }, [results, teams, candidates, programmes, showFullTeamPerformance]);

  const fetchAllData = async () => {
    try {
      const [teamsRes, candidatesRes, programmesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programmes')
      ]);

      if (teamsRes.ok && candidatesRes.ok && programmesRes.ok) {
        const [teamsData, candidatesData, programmesData] = await Promise.all([
          teamsRes.json(),
          candidatesRes.json(),
          programmesRes.json()
        ]);

        console.log('Teams loaded:', teamsData.length);
        console.log('Candidates loaded:', candidatesData.length);
        console.log('Programmes loaded:', programmesData.length);
        console.log('AQS team found:', teamsData.find((t: any) => t.code === 'AQS') ? 'YES' : 'NO');
        console.log('AQS candidates:', candidatesData.filter((c: any) => c.team === 'AQS').length);

        setTeams(teamsData || []);
        setCandidates(candidatesData || []);
        setProgrammes(programmesData || []);
      } else {
        console.error('API Error - Teams:', teamsRes.status, 'Candidates:', candidatesRes.status, 'Programmes:', programmesRes.status);
        // Set empty arrays if API fails
        setTeams([]);
        setCandidates([]);
        setProgrammes([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error
      setTeams([]);
      setCandidates([]);
      setProgrammes([]);
    }
  };

  // Note: Using centralized getGradePoints from markingSystem utility

  // Helper function to get programme name by ID
  const getProgrammeName = (result: any) => {
    // First try to use the programmeName field if it exists
    if (result.programmeName) {
      return result.programmeName;
    }

    // If not, try to find the programme by ID
    if (result.programmeId && programmes.length > 0) {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString() ||
        p.id?.toString() === result.programmeId?.toString()
      );
      if (programme) {
        return programme.name;
      }
    }

    // Fallback to 'Unknown Programme'
    return 'Unknown Programme';
  };

  // Helper function to get programme details
  const getProgrammeDetails = (result: any) => {
    // Try to find the programme by ID first
    if (result.programmeId && programmes.length > 0) {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString() ||
        p.id?.toString() === result.programmeId?.toString()
      );
      if (programme) {
        return {
          name: programme.name,
          category: programme.category || 'Unknown',
          section: programme.section || result.section || 'Unknown'
        };
      }
    }

    // Fallback to result data or defaults
    return {
      name: result.programmeName || 'Unknown Programme',
      category: result.programmeCategory || 'Unknown',
      section: result.section || 'Unknown'
    };
  };

  const calculateTeamMarks = () => {
    const teamMarksMap: { [teamCode: string]: TeamMarks } = {};

    // Initialize team marks
    teams.forEach(team => {
      teamMarksMap[team.code] = {
        teamCode: team.code,
        teamName: team.name,
        teamColor: team.color,
        individual: 0,
        group: 0,
        general: 0,
        total: 0,
        participantCount: 0,
        programmes: []
      };
    });

    // Determine which results to use for calculation
    const resultsToProcess = (showFullTeamPerformance && allResults) ? allResults : results;
    
    console.log('Processing', resultsToProcess.length, 'results for', Object.keys(teamMarksMap).length, 'teams');
    console.log('Available programmes:', programmes.length);
    console.log('Show full performance:', showFullTeamPerformance);
    console.log('Category filter:', categoryFilter);
    
    if (resultsToProcess.length === 0) {
      console.log('⚠️ No results to process - this explains why all teams show 0 points');
      setTeamMarks(Object.values(teamMarksMap).sort((a, b) => b.total - a.total));
      return;
    }

    // Debug: Check first few results for programme data
    resultsToProcess.slice(0, 3).forEach((result, idx) => {
      const programmeDetails = getProgrammeDetails(result);
      console.log(`Result ${idx + 1}: "${programmeDetails.name}" (ID: ${result.programmeId})`);
    });

    // Calculate marks from results
    resultsToProcess.forEach(result => {
      const programmeDetails = getProgrammeDetails(result);
      const programmeName = programmeDetails.name;
      const programmeCategory = programmeDetails.category;
      const programmeSection = programmeDetails.section;
      
      // Determine mark category based on programme section
      const getMarkCategory = (section: string, positionType: string) => {
        const normalizedSection = section.toLowerCase();
        if (normalizedSection === 'general') {
          return 'general';
        } else if (['senior', 'junior', 'sub-junior'].includes(normalizedSection)) {
          // For age-based sections, use position type to determine category
          if (positionType === 'individual') return 'individual';
          else if (positionType === 'group') return 'group';
          else return 'general';
        }
        // Fallback
        return positionType === 'individual' ? 'individual' : 
               positionType === 'group' ? 'group' : 'general';
      };

      const markCategory = getMarkCategory(programmeSection, result.positionType);

      // Process individual/group results
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            if (candidate.team === 'AQS') {
              console.log(`✅ Adding ${totalPoints} points to AQS team for ${programmeName} (${winner.chestNumber}) - Category: ${markCategory}`);
            }
            teamMarksMap[candidate.team][markCategory] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          } else if (candidate) {
            console.log(`❌ Team ${candidate.team} not found in teamMarksMap for candidate ${winner.chestNumber}`);
          } else {
            console.log(`❌ Candidate not found for chest number ${winner.chestNumber}`);
          }
        });
      }

      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamMarksMap[candidate.team][markCategory] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          }
        });
      }

      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamMarksMap[candidate.team][markCategory] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          }
        });
      }



      // Process team results
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamMarksMap[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            if (winner.teamCode === 'AQS') {
              console.log(`✅ Adding ${totalPoints} points to AQS team for ${programmeName} (team result) - Category: ${markCategory}`);
            }
            teamMarksMap[winner.teamCode][markCategory] += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          } else {
            console.log(`❌ Team ${winner.teamCode} not found in teamMarksMap`);
          }
        });
      }

      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamMarksMap[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamMarksMap[winner.teamCode][markCategory] += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          }
        });
      }

      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamMarksMap[winner.teamCode]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamMarksMap[winner.teamCode][markCategory] += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: markCategory
            });
          }
        });
      }


    });

    // Sort teams by total marks
    const sortedTeamMarks = Object.values(teamMarksMap).sort((a, b) => b.total - a.total);
    console.log('Final team marks:', sortedTeamMarks);
    console.log('AQS final marks:', sortedTeamMarks.find(t => t.teamCode === 'AQS'));
    setTeamMarks(sortedTeamMarks);
  };



  // Removed loading spinner - render content immediately

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">📊 Marks Summary Dashboard</h2>
          {categoryFilter && (
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <div className="text-sm opacity-90 mb-1">Filtered View</div>
              <div className="font-bold text-lg">
                {categoryFilter === 'arts-total' && '🎨 Arts Total'}
                {categoryFilter === 'arts-stage' && '🎭 Arts Stage'}
                {categoryFilter === 'arts-non-stage' && '📝 Arts Non-Stage'}
                {categoryFilter === 'sports' && '🏃 Sports'}
              </div>
            </div>
          )}
        </div>
        

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{teamMarks.length}</div>
            <div className="text-sm opacity-90">Active Teams</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{results.length}</div>
            <div className="text-sm opacity-90">Programmes</div>
          </div>
        </div>
        
        {/* Team Points Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {teamMarks.slice(0, 8).map((team, index) => (
            <div key={team.teamCode} className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: team.teamColor }}
                >
                  {team.teamCode}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold truncate">{team.total}</div>
                  <div className="text-xs opacity-90 truncate">{team.teamName}</div>
                </div>
                {index < 3 && (
                  <div className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {teamMarks.length > 8 && (
          <div className="text-center mt-4">
            <div className="text-sm opacity-90">
              ... and {teamMarks.length - 8} more teams
            </div>
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setSelectedView('summary')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'summary'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Summary View
          </button>
          <button
            onClick={() => setSelectedView('detailed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'detailed'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Detailed View
          </button>
          <button
            onClick={() => setSelectedView('programmes')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'programmes'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏆 Team Earnings
          </button>
          <button
            onClick={() => setSelectedView('breakdown')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === 'breakdown'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Programme Breakdown
          </button>
          {showDailyProgress && (
            <button
              onClick={() => setSelectedView('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Daily Progress
            </button>
          )}

        </div>
      </div>

      {/* Summary View */}
      {selectedView === 'summary' && (
        <div>
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Teams Data</h3>
              <p className="text-gray-500 mb-4">
                There was an issue loading teams and candidates data from the API.
              </p>
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Retry Loading
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMarks.map((team, index) => (
            <div key={team.teamCode} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.teamColor }}
                  >
                    {team.teamCode}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{team.teamName}</h3>
                    <p className="text-sm text-gray-600">{team.participantCount} participants</p>
                  </div>
                </div>
                <div className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                </div>
              </div>

              {/* Marks Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Individual:</span>
                  <span className="font-bold text-green-600">{team.individual}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Group:</span>
                  <span className="font-bold text-blue-600">{team.group}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">General:</span>
                  <span className="font-bold text-purple-600">{team.general}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold" style={{ color: team.teamColor }}>
                      {team.total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      backgroundColor: team.teamColor,
                      width: `${Math.min((team.total / Math.max(...teamMarks.map(t => t.total))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Programme Details - Expandable */}
              {team.programmes.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                    <span className="mr-2">📋</span>
                    Programme Details ({team.programmes.length})
                    <span className="ml-auto text-xs text-gray-500">Click to expand</span>
                  </summary>
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {team.programmes.map((programme, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate" title={programme.name}>
                              {programme.name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                programme.category === 'arts' ? 'bg-purple-100 text-purple-800' :
                                programme.category === 'sports' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {programme.category}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                programme.section === 'senior' ? 'bg-blue-100 text-blue-800' :
                                programme.section === 'junior' ? 'bg-yellow-100 text-yellow-800' :
                                programme.section === 'sub-junior' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {programme.section}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                programme.type === 'individual' ? 'bg-orange-100 text-orange-800' :
                                programme.type === 'group' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {programme.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <div 
                              className="text-sm font-bold px-2 py-1 rounded text-white"
                              style={{ backgroundColor: team.teamColor }}
                            >
                              +{programme.points}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed View */}
      {selectedView === 'detailed' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Individual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    General
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMarks.map((team, index) => (
                  <React.Fragment key={team.teamCode}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3"
                            style={{ backgroundColor: team.teamColor }}
                          >
                            {team.teamCode}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{team.teamName}</div>
                            <div className="text-sm text-gray-500">{team.teamCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">{team.individual}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">{team.group}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-purple-600">{team.general}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{team.participantCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold" style={{ color: team.teamColor }}>
                          {team.total}
                        </span>
                      </td>
                    </tr>
                    {/* Programme Details Row */}
                    {team.programmes.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center">
                              <span className="mr-2">📋</span>
                              Programme Breakdown ({team.programmes.length} programmes)
                            </summary>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {team.programmes.map((programme, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2" title={programme.name}>
                                        {programme.name}
                                      </h4>
                                      <div className="flex flex-wrap gap-1">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          programme.category === 'arts' ? 'bg-purple-100 text-purple-800' :
                                          programme.category === 'sports' ? 'bg-green-100 text-green-800' :
                                          'bg-blue-100 text-blue-800'
                                        }`}>
                                          {programme.category}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          programme.section === 'senior' ? 'bg-blue-100 text-blue-800' :
                                          programme.section === 'junior' ? 'bg-yellow-100 text-yellow-800' :
                                          programme.section === 'sub-junior' ? 'bg-pink-100 text-pink-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {programme.section}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          programme.type === 'individual' ? 'bg-orange-100 text-orange-800' :
                                          programme.type === 'group' ? 'bg-indigo-100 text-indigo-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {programme.type}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-3">
                                      <div 
                                        className="text-sm font-bold px-2 py-1 rounded text-white"
                                        style={{ backgroundColor: team.teamColor }}
                                      >
                                        +{programme.points}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Earnings Details View */}
      {selectedView === 'programmes' && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            Team Earnings from Published Results
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teamMarks.map((team, index) => (
              <div
                key={team.teamCode}
                className="bg-white rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                style={{ 
                  borderColor: team.teamColor + '40',
                  backgroundColor: team.teamColor + '08'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: team.teamColor }}
                    >
                      {team.teamCode}
                    </div>
                    <div className="text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: team.teamColor }}>
                      {Math.round(team.total)}
                    </div>
                    <div className="text-xs text-gray-600">points</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-gray-900 text-sm truncate" title={team.teamName}>
                    {team.teamName}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{team.programmes.length} programmes</span>
                    <span>#{index + 1}</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{
                        backgroundColor: team.teamColor,
                        width: `${Math.min((team.total / Math.max(...teamMarks.map(t => t.total))) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Detailed breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-green-600">{team.individual}</div>
                      <div className="text-gray-600">Individual</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{team.group}</div>
                      <div className="text-gray-600">Group</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{team.general}</div>
                      <div className="text-gray-600">General</div>
                    </div>
                  </div>
                </div>

                {/* Programme details expandable */}
                {team.programmes.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center">
                      <span className="mr-1">📋</span>
                      View Details ({team.programmes.length})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {team.programmes.map((programme, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 truncate" title={programme.name}>
                              {programme.name}
                            </span>
                            <span className="font-bold text-gray-700">+{programme.points}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className={`px-1 py-0.5 rounded text-xs ${
                              programme.category === 'arts' ? 'bg-purple-100 text-purple-700' :
                              programme.category === 'sports' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {programme.category}
                            </span>
                            <span className={`px-1 py-0.5 rounded text-xs ${
                              programme.section === 'senior' ? 'bg-blue-100 text-blue-700' :
                              programme.section === 'junior' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-pink-100 text-pink-700'
                            }`}>
                              {programme.section}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programme Breakdown View */}
      {selectedView === 'breakdown' && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <span className="mr-2">📋</span>
              Programme Breakdown - Published Results
            </h3>
            <p className="text-gray-600 text-sm">
              Detailed view of each published programme showing all teams and winners
              {breakdownFilterTeam && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <span className="mr-1">🏆</span>
                  Showing only programmes where {teams.find(t => t.code === breakdownFilterTeam)?.name || breakdownFilterTeam} has winners
                </span>
              )}
            </p>
          </div>

          {/* Filter Controls */}
          {results.length > 0 && (
            <div className="mb-6 space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="mr-2">🔍</span>
                Filter Programmes
              </h4>
              
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search programmes by name, code, or section..."
                  value={breakdownSearchTerm}
                  onChange={(e) => setBreakdownSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
                {breakdownSearchTerm && (
                  <button
                    onClick={() => setBreakdownSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={breakdownFilterSection}
                    onChange={(e) => setBreakdownFilterSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Sections</option>
                    {[...new Set(results.map(r => r.section))].sort().map(section => (
                      <option key={section} value={section}>
                        {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={breakdownFilterCategory}
                    onChange={(e) => setBreakdownFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Categories</option>
                    {[...new Set(results.map(r => r.programmeCategory).filter(Boolean))].sort().map(category => (
                      <option key={category} value={category}>
                        {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={breakdownFilterType}
                    onChange={(e) => setBreakdownFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Types</option>
                    {[...new Set(results.map(r => r.positionType))].sort().map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select
                    value={breakdownFilterTeam}
                    onChange={(e) => setBreakdownFilterTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Teams</option>
                    {teams.sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                      <option key={team.code} value={team.code}>
                        {team.name} ({team.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(breakdownSearchTerm || breakdownFilterSection || breakdownFilterCategory || breakdownFilterType || breakdownFilterTeam) && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-600">
                    Showing filtered results
                  </span>
                  <button
                    onClick={() => {
                      setBreakdownSearchTerm('');
                      setBreakdownFilterSection('');
                      setBreakdownFilterCategory('');
                      setBreakdownFilterType('');
                      setBreakdownFilterTeam('');
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Team Grand Marks Display */}
          {breakdownFilterTeam && (
            <div className="mb-6">
              {(() => {
                const selectedTeam = teams.find(t => t.code === breakdownFilterTeam);
                const selectedTeamMarks = teamMarks.find(tm => tm.teamCode === breakdownFilterTeam);
                
                if (!selectedTeam || !selectedTeamMarks) {
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-center text-gray-500">
                        <div className="text-2xl mb-2">⚠️</div>
                        <p>Team data not found</p>
                      </div>
                    </div>
                  );
                }

                // Calculate filtered team marks (only from currently filtered results)
                const calculateFilteredTeamMarks = () => {
                  // Filter results based on current filters
                  const filteredResults = results.filter(result => {
                    const programmeName = (() => {
                      if (result.programmeName && result.programmeCode) {
                        return `${result.programmeName} (${result.programmeCode})`;
                      }
                      const programme = programmes.find(p => p._id?.toString() === result.programmeId);
                      return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
                    })();

                    const matchesSearch = breakdownSearchTerm === '' || 
                      programmeName.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.programmeCode?.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.section.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.positionType.toLowerCase().includes(breakdownSearchTerm.toLowerCase());

                    const matchesSection = breakdownFilterSection === '' || result.section === breakdownFilterSection;
                    const matchesCategory = breakdownFilterCategory === '' || result.programmeCategory === breakdownFilterCategory;
                    const matchesType = breakdownFilterType === '' || result.positionType === breakdownFilterType;

                    // Check if the selected team has any winners in this result (using same logic as main calculation)
                    const hasTeamWinners = 
                      (result.firstPlace?.some(w => {
                        const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                        return candidate && candidate.team === breakdownFilterTeam;
                      }) || false) ||
                      (result.secondPlace?.some(w => {
                        const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                        return candidate && candidate.team === breakdownFilterTeam;
                      }) || false) ||
                      (result.thirdPlace?.some(w => {
                        const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                        return candidate && candidate.team === breakdownFilterTeam;
                      }) || false) ||
                      (result.firstPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                      (result.secondPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                      (result.thirdPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false);

                    return matchesSearch && matchesSection && matchesCategory && matchesType && hasTeamWinners;
                  });

                  // Calculate points from filtered results (using EXACT same logic as main calculation)
                  let filteredIndividual = 0;
                  let filteredGroup = 0;
                  let filteredGeneral = 0;
                  let filteredTotal = 0;
                  let filteredProgrammes = 0;

                  filteredResults.forEach(result => {
                    const programmeDetails = getProgrammeDetails(result);
                    const programmeSection = programmeDetails.section;
                    
                    // Determine mark category based on programme section (EXACT same logic as main calculation)
                    const getMarkCategory = (section: string, positionType: string) => {
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

                    const markCategory = getMarkCategory(programmeSection, result.positionType);

                    // Process individual/group results (EXACT same logic as main calculation)
                    if (result.firstPlace) {
                      result.firstPlace.forEach(winner => {
                        const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                        if (candidate && candidate.team === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.firstPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }

                    if (result.secondPlace) {
                      result.secondPlace.forEach(winner => {
                        const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                        if (candidate && candidate.team === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.secondPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }

                    if (result.thirdPlace) {
                      result.thirdPlace.forEach(winner => {
                        const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                        if (candidate && candidate.team === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.thirdPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }

                    // Process team results (EXACT same logic as main calculation)
                    if (result.firstPlaceTeams) {
                      result.firstPlaceTeams.forEach(winner => {
                        if (winner.teamCode === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.firstPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }

                    if (result.secondPlaceTeams) {
                      result.secondPlaceTeams.forEach(winner => {
                        if (winner.teamCode === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.secondPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }

                    if (result.thirdPlaceTeams) {
                      result.thirdPlaceTeams.forEach(winner => {
                        if (winner.teamCode === breakdownFilterTeam) {
                          const gradePoints = getGradePoints(winner.grade || '');
                          const totalPoints = result.thirdPoints + gradePoints;
                          
                          if (markCategory === 'individual') filteredIndividual += totalPoints;
                          else if (markCategory === 'group') filteredGroup += totalPoints;
                          else filteredGeneral += totalPoints;
                          
                          filteredTotal += totalPoints;
                          filteredProgrammes += 1;
                        }
                      });
                    }
                  });

                  return {
                    individual: filteredIndividual,
                    group: filteredGroup,
                    general: filteredGeneral,
                    total: filteredTotal,
                    programmes: filteredProgrammes
                  };
                };

                const filteredMarks = calculateFilteredTeamMarks();
                const hasNonTeamFilters = breakdownSearchTerm || breakdownFilterSection || breakdownFilterCategory || breakdownFilterType;
                const hasOnlyTeamFilter = breakdownFilterTeam && !hasNonTeamFilters;

                return (
                  <div className="space-y-4">
                    {/* Team Filter Only Message */}
                    {hasOnlyTeamFilter && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">✅</div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">Team Filter Active</h3>
                              <p className="text-sm text-gray-600">Showing all programmes where {selectedTeam.name} has winners</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: selectedTeam.color }}>
                              {Math.round(filteredMarks.total)}
                            </div>
                            <div className="text-sm text-gray-600">Filtered Points</div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-sm text-gray-700">
                            <strong>Expected Result:</strong> When filtering by team only, the filtered points ({Math.round(filteredMarks.total)}) should match the grand total ({Math.round(selectedTeamMarks.total)}) shown below.
                            {Math.round(filteredMarks.total) === Math.round(selectedTeamMarks.total) ? (
                              <span className="ml-2 text-green-600 font-bold">✅ Match!</span>
                            ) : (
                              <span className="ml-2 text-red-600 font-bold">❌ Mismatch detected!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Filtered Marks (when non-team filters are active) */}
                    {hasNonTeamFilters && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: selectedTeam.color }}
                            >
                              {selectedTeam.code}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{selectedTeam.name}</h3>
                              <p className="text-sm text-gray-600">Filtered Results Points</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: selectedTeam.color }}>
                              {Math.round(filteredMarks.total)}
                            </div>
                            <div className="text-sm text-gray-600">Filtered Points</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-green-600">{Math.round(filteredMarks.individual)}</div>
                            <div className="text-xs text-gray-600">Individual</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-blue-600">{Math.round(filteredMarks.group)}</div>
                            <div className="text-xs text-gray-600">Group</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-purple-600">{Math.round(filteredMarks.general)}</div>
                            <div className="text-xs text-gray-600">General</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-orange-600">{filteredMarks.programmes}</div>
                            <div className="text-xs text-gray-600">Programmes</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grand Total Marks (all published results) */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: selectedTeam.color }}
                          >
                            {selectedTeam.code}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                            <p className="text-sm text-gray-600">Grand Total (All Published Results)</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              console.log(`🔍 DETAILED VERIFICATION FOR ${selectedTeam.name} (${selectedTeam.code})`);
                              console.log('📊 Grand Total Breakdown:');
                              console.log(`   Individual: ${selectedTeamMarks.individual}`);
                              console.log(`   Group: ${selectedTeamMarks.group}`);
                              console.log(`   General: ${selectedTeamMarks.general}`);
                              console.log(`   Total: ${selectedTeamMarks.total}`);
                              console.log(`   Programmes: ${selectedTeamMarks.programmes.length}`);
                              
                              console.log('🔍 Filtered Marks Breakdown:');
                              console.log(`   Individual: ${filteredMarks.individual}`);
                              console.log(`   Group: ${filteredMarks.group}`);
                              console.log(`   General: ${filteredMarks.general}`);
                              console.log(`   Total: ${filteredMarks.total}`);
                              console.log(`   Programmes: ${filteredMarks.programmes}`);
                              
                              console.log('🎯 COMPARISON:');
                              console.log(`   Grand Total: ${selectedTeamMarks.total}`);
                              console.log(`   Filtered Total: ${filteredMarks.total}`);
                              console.log(`   Difference: ${selectedTeamMarks.total - filteredMarks.total}`);
                              
                              if (hasOnlyTeamFilter) {
                                console.log('✅ TEAM FILTER ONLY - These should match!');
                                if (Math.round(selectedTeamMarks.total) === Math.round(filteredMarks.total)) {
                                  console.log('🎉 SUCCESS: Totals match perfectly!');
                                } else {
                                  console.log('❌ ISSUE: Totals do not match - investigating...');
                                  console.log('📋 Detailed Programme Comparison:');
                                  console.log('Grand Total Programmes:', selectedTeamMarks.programmes.length);
                                  console.log('Filtered Programmes:', filteredMarks.programmes);
                                }
                              } else if (hasNonTeamFilters) {
                                console.log('🔍 FILTERED VIEW - Totals may differ due to active filters');
                              }
                            }}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-xs font-medium transition-colors"
                            title="Verify team calculations in console"
                          >
                            🔍 Verify Team
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold" style={{ color: selectedTeam.color }}>
                            {Math.round(selectedTeamMarks.total)}
                          </div>
                          <div className="text-sm text-gray-600">Grand Total</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{Math.round(selectedTeamMarks.individual)}</div>
                          <div className="text-sm text-gray-600">Individual</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{Math.round(selectedTeamMarks.group)}</div>
                          <div className="text-sm text-gray-600">Group</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{Math.round(selectedTeamMarks.general)}</div>
                          <div className="text-sm text-gray-600">General</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedTeamMarks.programmes.length}</div>
                          <div className="text-sm text-gray-600">Total Programmes</div>
                        </div>
                      </div>

                      {/* Team Ranking and Stats */}
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="text-gray-600">
                            Team Ranking: 
                            <span className="font-bold text-purple-700 ml-1">
                              #{teamMarks.findIndex(tm => tm.teamCode === breakdownFilterTeam) + 1} of {teamMarks.length}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            Total Participants: 
                            <span className="font-bold text-purple-700 ml-1">
                              {selectedTeamMarks.participantCount}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            {hasNonTeamFilters ? (
                              <>
                                Showing: 
                                <span className="font-bold text-purple-700 ml-1">
                                  {filteredMarks.programmes} of {selectedTeamMarks.programmes.length} programmes
                                </span>
                              </>
                            ) : (
                              <>
                                All Programmes: 
                                <span className="font-bold text-purple-700 ml-1">
                                  {selectedTeamMarks.programmes.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Results Count */}
          {results.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {(() => {
                  const filteredCount = results.filter(result => {
                    const programmeName = (() => {
                      if (result.programmeName && result.programmeCode) {
                        return `${result.programmeName} (${result.programmeCode})`;
                      }
                      const programme = programmes.find(p => p._id?.toString() === result.programmeId);
                      return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
                    })();

                    const matchesSearch = breakdownSearchTerm === '' || 
                      programmeName.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.programmeCode?.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.section.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                      result.positionType.toLowerCase().includes(breakdownSearchTerm.toLowerCase());

                    const matchesSection = breakdownFilterSection === '' || result.section === breakdownFilterSection;
                    const matchesCategory = breakdownFilterCategory === '' || result.programmeCategory === breakdownFilterCategory;
                    const matchesType = breakdownFilterType === '' || result.positionType === breakdownFilterType;
                    
                    // Team filter logic
                    const matchesTeam = breakdownFilterTeam === '' || (() => {
                      // Check if the selected team has any winners in this result (using same logic as main calculation)
                      const hasTeamWinners = 
                        (result.firstPlace?.some(w => {
                          const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                          return candidate && candidate.team === breakdownFilterTeam;
                        }) || false) ||
                        (result.secondPlace?.some(w => {
                          const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                          return candidate && candidate.team === breakdownFilterTeam;
                        }) || false) ||
                        (result.thirdPlace?.some(w => {
                          const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                          return candidate && candidate.team === breakdownFilterTeam;
                        }) || false) ||
                        (result.firstPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                        (result.secondPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                        (result.thirdPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false);

                      return hasTeamWinners;
                    })();

                    return matchesSearch && matchesSection && matchesCategory && matchesType && matchesTeam;
                  }).length;

                  return `Showing ${filteredCount} of ${results.length} programmes`;
                })()}
              </p>
            </div>
          )}

          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Results</h3>
              <p className="text-gray-500">
                Programme breakdown will appear here after results are published.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats for Filtered Results */}
              {(breakdownSearchTerm || breakdownFilterSection || breakdownFilterCategory || breakdownFilterType || breakdownFilterTeam) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Filtered Results Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {(() => {
                      const filteredResults = results.filter(result => {
                        const programmeName = (() => {
                          if (result.programmeName && result.programmeCode) {
                            return `${result.programmeName} (${result.programmeCode})`;
                          }
                          const programme = programmes.find(p => p._id?.toString() === result.programmeId);
                          return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
                        })();

                        const matchesSearch = breakdownSearchTerm === '' || 
                          programmeName.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                          result.programmeCode?.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                          result.section.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                          result.positionType.toLowerCase().includes(breakdownSearchTerm.toLowerCase());

                        const matchesSection = breakdownFilterSection === '' || result.section === breakdownFilterSection;
                        const matchesCategory = breakdownFilterCategory === '' || result.programmeCategory === breakdownFilterCategory;
                        const matchesType = breakdownFilterType === '' || result.positionType === breakdownFilterType;
                        
                        // Team filter logic (using same logic as main calculation)
                        const matchesTeam = breakdownFilterTeam === '' || (() => {
                          const hasTeamWinners = 
                            (result.firstPlace?.some(w => {
                              const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                              return candidate && candidate.team === breakdownFilterTeam;
                            }) || false) ||
                            (result.secondPlace?.some(w => {
                              const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                              return candidate && candidate.team === breakdownFilterTeam;
                            }) || false) ||
                            (result.thirdPlace?.some(w => {
                              const candidate = candidates.find(c => c.chestNumber === w.chestNumber);
                              return candidate && candidate.team === breakdownFilterTeam;
                            }) || false) ||
                            (result.firstPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                            (result.secondPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                            (result.thirdPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false);

                          return hasTeamWinners;
                        })();

                        return matchesSearch && matchesSection && matchesCategory && matchesType && matchesTeam;
                      });

                      // Calculate winners and points - if team filter is active, count only that team's wins
                      let totalWinners = 0;
                      let totalPoints = 0;

                      if (breakdownFilterTeam) {
                        // When team filter is active, count only selected team's wins
                        filteredResults.forEach(result => {
                          // Count individual winners for selected team
                          if (result.firstPlace) {
                            result.firstPlace.forEach(winner => {
                              const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                              if (candidate && candidate.team === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.firstPoints + gradePoints;
                              }
                            });
                          }
                          if (result.secondPlace) {
                            result.secondPlace.forEach(winner => {
                              const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                              if (candidate && candidate.team === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.secondPoints + gradePoints;
                              }
                            });
                          }
                          if (result.thirdPlace) {
                            result.thirdPlace.forEach(winner => {
                              const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                              if (candidate && candidate.team === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.thirdPoints + gradePoints;
                              }
                            });
                          }
                          
                          // Count team winners for selected team
                          if (result.firstPlaceTeams) {
                            result.firstPlaceTeams.forEach(winner => {
                              if (winner.teamCode === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.firstPoints + gradePoints;
                              }
                            });
                          }
                          if (result.secondPlaceTeams) {
                            result.secondPlaceTeams.forEach(winner => {
                              if (winner.teamCode === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.secondPoints + gradePoints;
                              }
                            });
                          }
                          if (result.thirdPlaceTeams) {
                            result.thirdPlaceTeams.forEach(winner => {
                              if (winner.teamCode === breakdownFilterTeam) {
                                totalWinners++;
                                const gradePoints = getGradePoints(winner.grade || '');
                                totalPoints += result.thirdPoints + gradePoints;
                              }
                            });
                          }
                        });
                      } else {
                        // When no team filter, count all winners (original behavior)
                        totalWinners = filteredResults.reduce((sum, result) => {
                          return sum + 
                            (result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0) +
                            (result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0) +
                            (result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0);
                        }, 0);

                        totalPoints = filteredResults.reduce((sum, result) => {
                          let resultTotal = 0;
                          
                          // Add position points + grade points for individual winners
                          if (result.firstPlace) {
                            result.firstPlace.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.firstPoints + gradePoints;
                            });
                          }
                          if (result.secondPlace) {
                            result.secondPlace.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.secondPoints + gradePoints;
                            });
                          }
                          if (result.thirdPlace) {
                            result.thirdPlace.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.thirdPoints + gradePoints;
                            });
                          }
                          
                          // Add position points + grade points for team winners
                          if (result.firstPlaceTeams) {
                            result.firstPlaceTeams.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.firstPoints + gradePoints;
                            });
                          }
                          if (result.secondPlaceTeams) {
                            result.secondPlaceTeams.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.secondPoints + gradePoints;
                            });
                          }
                          if (result.thirdPlaceTeams) {
                            result.thirdPlaceTeams.forEach(winner => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              resultTotal += result.thirdPoints + gradePoints;
                            });
                          }
                          
                          return sum + resultTotal;
                        }, 0);
                      }

                      const uniqueTeams = new Set();
                      filteredResults.forEach(result => {
                        result.firstPlace?.forEach(w => {
                          const teamCode = w.chestNumber ? w.chestNumber.match(/^([A-Z]{2,3})/)?.[1] || w.chestNumber.charAt(0) : '';
                          if (teamCode) uniqueTeams.add(teamCode);
                        });
                        result.secondPlace?.forEach(w => {
                          const teamCode = w.chestNumber ? w.chestNumber.match(/^([A-Z]{2,3})/)?.[1] || w.chestNumber.charAt(0) : '';
                          if (teamCode) uniqueTeams.add(teamCode);
                        });
                        result.thirdPlace?.forEach(w => {
                          const teamCode = w.chestNumber ? w.chestNumber.match(/^([A-Z]{2,3})/)?.[1] || w.chestNumber.charAt(0) : '';
                          if (teamCode) uniqueTeams.add(teamCode);
                        });
                        result.firstPlaceTeams?.forEach(w => uniqueTeams.add(w.teamCode));
                        result.secondPlaceTeams?.forEach(w => uniqueTeams.add(w.teamCode));
                        result.thirdPlaceTeams?.forEach(w => uniqueTeams.add(w.teamCode));
                      });

                      return (
                        <>
                          <div>
                            <div className="text-2xl font-bold text-blue-700">{filteredResults.length}</div>
                            <div className="text-xs text-blue-600">Programmes</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-700">{totalWinners}</div>
                            <div className="text-xs text-green-600">
                              {breakdownFilterTeam ? `${breakdownFilterTeam} Winners` : 'Total Winners'}
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-700">{Math.round(totalPoints)}</div>
                            <div className="text-xs text-purple-600">
                              {breakdownFilterTeam ? `${breakdownFilterTeam} Points` : 'Total Points (With Grades)'}
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-700">{uniqueTeams.size}</div>
                            <div className="text-xs text-orange-600">Teams Involved</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                      <p className="text-xs text-blue-700">
                        📊 <strong>Summary Statistics:</strong> {breakdownFilterTeam 
                          ? `Shows data for ${breakdownFilterTeam} team only in filtered programmes. Points should match team's grand total when no other filters are applied.`
                          : 'Shows aggregate data for all teams in filtered programmes including grade bonuses.'
                        }
                      </p>
                      {breakdownFilterTeam && (
                        <button
                          onClick={() => {
                            const selectedTeamMarks = teamMarks.find(tm => tm.teamCode === breakdownFilterTeam);
                            console.log(`🔍 FILTERED SUMMARY NOW SHOWS TEAM-SPECIFIC POINTS for ${breakdownFilterTeam}`);
                            console.log(`🏆 Team Grand Total: ${selectedTeamMarks?.total || 0} points`);
                            console.log(`📊 Filtered Summary: Now shows only ${breakdownFilterTeam} team points`);
                            console.log('✅ FIXED: Filtered summary now counts only selected team wins!');
                            
                            console.log('📋 Team Programme Breakdown:');
                            selectedTeamMarks?.programmes.forEach((prog, idx) => {
                              console.log(`   ${idx + 1}. ${prog.name} - ${prog.points} pts [${prog.type}]`);
                            });
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="Compare filtered summary vs team grand total"
                        >
                          🔍 Compare
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                // Filter results based on search and filter criteria
                const filteredResults = results.filter(result => {
                  // Get programme name for search
                  const programmeName = (() => {
                    if (result.programmeName && result.programmeCode) {
                      return `${result.programmeName} (${result.programmeCode})`;
                    }
                    const programme = programmes.find(p => p._id?.toString() === result.programmeId);
                    return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
                  })();

                  // Search filter
                  const matchesSearch = breakdownSearchTerm === '' || 
                    programmeName.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                    result.programmeCode?.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                    result.section.toLowerCase().includes(breakdownSearchTerm.toLowerCase()) ||
                    result.positionType.toLowerCase().includes(breakdownSearchTerm.toLowerCase());

                  // Section filter
                  const matchesSection = breakdownFilterSection === '' || result.section === breakdownFilterSection;

                  // Category filter
                  const matchesCategory = breakdownFilterCategory === '' || result.programmeCategory === breakdownFilterCategory;

                  // Type filter
                  const matchesType = breakdownFilterType === '' || result.positionType === breakdownFilterType;

                  // Team filter
                  const matchesTeam = breakdownFilterTeam === '' || (() => {
                    const getTeamCodeFromChestNumber = (chestNumber: string) => {
                      if (!chestNumber) return '';
                      const upperChestNumber = chestNumber.toUpperCase();
                      const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
                      if (threeLetterMatch) return threeLetterMatch[1];
                      const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
                      if (twoLetterMatch) {
                        const teamCode = twoLetterMatch[1];
                        if (teamCode === 'SM') return 'SMD';
                        if (teamCode === 'IN') return 'INT';
                        if (teamCode === 'AQ') return 'AQS';
                        return teamCode;
                      }
                      if (upperChestNumber.match(/^[A-Z]/)) return upperChestNumber.charAt(0);
                      const num = parseInt(chestNumber);
                      if (!isNaN(num)) {
                        if (num >= 600 && num < 700) return 'AQS';
                        else if (num >= 400 && num < 500) return 'INT';
                        else if (num >= 200 && num < 300) return 'SMD';
                        else if (num >= 100 && num < 200) return 'A';
                        else return chestNumber.charAt(0);
                      }
                      return '';
                    };

                    const hasTeamWinners = 
                      (result.firstPlace?.some(w => getTeamCodeFromChestNumber(w.chestNumber) === breakdownFilterTeam) || false) ||
                      (result.secondPlace?.some(w => getTeamCodeFromChestNumber(w.chestNumber) === breakdownFilterTeam) || false) ||
                      (result.thirdPlace?.some(w => getTeamCodeFromChestNumber(w.chestNumber) === breakdownFilterTeam) || false) ||
                      (result.firstPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                      (result.secondPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false) ||
                      (result.thirdPlaceTeams?.some(w => w.teamCode === breakdownFilterTeam) || false);

                    return hasTeamWinners;
                  })();

                  return matchesSearch && matchesSection && matchesCategory && matchesType && matchesTeam;
                });

                // Show filtered count
                if (filteredResults.length === 0 && (breakdownSearchTerm || breakdownFilterSection || breakdownFilterCategory || breakdownFilterType || breakdownFilterTeam)) {
                  return (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-4xl mb-4">🔍</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                      <p className="text-gray-500">
                        {breakdownFilterTeam ? 
                          `No programmes found where ${teams.find(t => t.code === breakdownFilterTeam)?.name || breakdownFilterTeam} has winners.` :
                          'Try adjusting your search or filter criteria.'
                        }
                      </p>
                      <button
                        onClick={() => {
                          setBreakdownSearchTerm('');
                          setBreakdownFilterSection('');
                          setBreakdownFilterCategory('');
                          setBreakdownFilterType('');
                          setBreakdownFilterTeam('');
                        }}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  );
                }

                return filteredResults.map((result, index) => {
                // Get programme name
                const programmeName = (() => {
                  if (result.programmeName && result.programmeCode) {
                    return `${result.programmeName} (${result.programmeCode})`;
                  }
                  const programme = programmes.find(p => p._id?.toString() === result.programmeId);
                  return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
                })();

                // Helper function to get team code from chest number
                const getTeamCodeFromChestNumber = (chestNumber: string) => {
                  if (!chestNumber) return '';
                  
                  const upperChestNumber = chestNumber.toUpperCase();
                  
                  const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
                  if (threeLetterMatch) {
                    return threeLetterMatch[1];
                  }
                  
                  const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
                  if (twoLetterMatch) {
                    const teamCode = twoLetterMatch[1];
                    if (teamCode === 'SM') return 'SMD';
                    if (teamCode === 'IN') return 'INT';
                    if (teamCode === 'AQ') return 'AQS';
                    return teamCode;
                  }
                  
                  if (upperChestNumber.match(/^[A-Z]/)) {
                    return upperChestNumber.charAt(0);
                  }
                  
                  const num = parseInt(chestNumber);
                  if (!isNaN(num)) {
                    if (num >= 600 && num < 700) return 'AQS';
                    else if (num >= 400 && num < 500) return 'INT';
                    else if (num >= 200 && num < 300) return 'SMD';
                    else if (num >= 100 && num < 200) return 'A';
                    else return chestNumber.charAt(0);
                  }
                  
                  return '';
                };

                // Collect all winners and their details
                const allWinners = [
                  ...(result.firstPlace || []).map(w => ({ 
                    ...w, 
                    position: 'first', 
                    positionPoints: result.firstPoints,
                    emoji: '🥇',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    textColor: 'text-yellow-800'
                  })),
                  ...(result.secondPlace || []).map(w => ({ 
                    ...w, 
                    position: 'second', 
                    positionPoints: result.secondPoints,
                    emoji: '🥈',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-800'
                  })),
                  ...(result.thirdPlace || []).map(w => ({ 
                    ...w, 
                    position: 'third', 
                    positionPoints: result.thirdPoints,
                    emoji: '🥉',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-800'
                  })),
                  ...(result.firstPlaceTeams || []).map(w => ({ 
                    ...w, 
                    position: 'first', 
                    positionPoints: result.firstPoints,
                    emoji: '🥇',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    textColor: 'text-yellow-800',
                    isTeam: true
                  })),
                  ...(result.secondPlaceTeams || []).map(w => ({ 
                    ...w, 
                    position: 'second', 
                    positionPoints: result.secondPoints,
                    emoji: '🥈',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    textColor: 'text-gray-800',
                    isTeam: true
                  })),
                  ...(result.thirdPlaceTeams || []).map(w => ({ 
                    ...w, 
                    position: 'third', 
                    positionPoints: result.thirdPoints,
                    emoji: '🥉',
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-200',
                    textColor: 'text-orange-800',
                    isTeam: true
                  }))
                ];

                // Group winners by team
                const winnersByTeam: { [teamCode: string]: any[] } = {};
                allWinners.forEach(winner => {
                  const teamCode = (winner as any).isTeam ? (winner as any).teamCode : getTeamCodeFromChestNumber((winner as any).chestNumber);
                  if (!winnersByTeam[teamCode]) {
                    winnersByTeam[teamCode] = [];
                  }
                  winnersByTeam[teamCode].push(winner);
                });

                return (
                  <div key={result._id?.toString() || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    {/* Programme Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{programmeName}</h4>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            result.section === 'senior' ? 'bg-blue-100 text-blue-800' :
                            result.section === 'junior' ? 'bg-green-100 text-green-800' :
                            result.section === 'sub-junior' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.section.charAt(0).toUpperCase() + result.section.slice(1).replace('-', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full font-medium ${
                            result.positionType === 'individual' ? 'bg-orange-100 text-orange-800' :
                            result.positionType === 'group' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.positionType.charAt(0).toUpperCase() + result.positionType.slice(1)}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                            Points: {result.firstPoints}-{result.secondPoints}-{result.thirdPoints}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Winners</div>
                        <div className="text-2xl font-bold text-gray-900">{allWinners.length}</div>
                      </div>
                    </div>

                    {/* Winners by Team */}
                    {Object.keys(winnersByTeam).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🏆</div>
                        <p>No winners recorded for this programme</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🏆</span>
                          Winners by Team ({Object.keys(winnersByTeam).length} teams)
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(winnersByTeam).map(([teamCode, teamWinners]) => {
                            const team = teams.find(t => t.code === teamCode);
                            const teamTotalPoints = teamWinners.reduce((sum, winner) => {
                              const gradePoints = getGradePoints(winner.grade || '');
                              return sum + winner.positionPoints + gradePoints;
                            }, 0);

                            return (
                              <div 
                                key={teamCode} 
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                              >
                                {/* Team Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                      style={{ backgroundColor: team?.color || '#6366f1' }}
                                    >
                                      {teamCode}
                                    </div>
                                    <div>
                                      <h6 className="font-semibold text-gray-900 text-sm">
                                        {team?.name || teamCode}
                                      </h6>
                                      <p className="text-xs text-gray-600">
                                        {teamWinners.length} winner{teamWinners.length > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-lg" style={{ color: team?.color || '#6366f1' }}>
                                      {teamTotalPoints}
                                    </div>
                                    <div className="text-xs text-gray-600">points</div>
                                  </div>
                                </div>

                                {/* Team Winners */}
                                <div className="space-y-2">
                                  {teamWinners.map((winner: any, winnerIndex) => {
                                    const candidate = winner.isTeam ? null : candidates.find(c => c.chestNumber === winner.chestNumber);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = winner.positionPoints + gradePoints;

                                    return (
                                      <div 
                                        key={winnerIndex} 
                                        className={`${winner.bgColor} ${winner.borderColor} border rounded-lg p-3`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg">{winner.emoji}</span>
                                            <div>
                                              <div className="font-medium text-gray-900 text-sm">
                                                {winner.isTeam ? 
                                                  `${team?.name || winner.teamCode} (Team)` : 
                                                  winner.chestNumber
                                                }
                                              </div>
                                              {!winner.isTeam && (
                                                <div className="text-xs text-gray-600">
                                                  {candidate?.name || 'Unknown'}
                                                </div>
                                              )}
                                              <div className={`text-xs font-medium ${winner.textColor} capitalize`}>
                                                {winner.position} Place
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-bold text-gray-900">
                                              {totalPoints} pts
                                            </div>
                                            {winner.grade && (
                                              <div className="text-xs text-gray-600">
                                                +{gradePoints} grade
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Programme Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-yellow-700">
                            {(result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0)}
                          </div>
                          <div className="text-xs text-yellow-600">🥇 First Places</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-700">
                            {(result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0)}
                          </div>
                          <div className="text-xs text-gray-600">🥈 Second Places</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-700">
                            {(result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0)}
                          </div>
                          <div className="text-xs text-orange-600">🥉 Third Places</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-700">
                            {(() => {
                              const totalPoints = 
                                ((result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0)) * result.firstPoints +
                                ((result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0)) * result.secondPoints +
                                ((result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0)) * result.thirdPoints +
                                (result.firstPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                (result.secondPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                (result.thirdPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                (result.firstPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                (result.secondPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                (result.thirdPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0);
                              return totalPoints;
                            })()}
                          </div>
                          <div className="text-xs text-purple-600">💎 Total Points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* Daily Progress View */}
      {selectedView === 'daily' && showDailyProgress && (
        <DailyMarksSummary results={results} />
      )}

    </div>
  );
}
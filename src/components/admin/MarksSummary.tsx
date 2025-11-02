'use client';

import React, { useState, useEffect } from 'react';
import { EnhancedResult, Team, Candidate } from '@/types';
import DailyMarksSummary from './DailyMarksSummary';

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
}

export default function MarksSummary({ results, showDailyProgress = false }: MarksSummaryProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [teamMarks, setTeamMarks] = useState<TeamMarks[]>([]);
  // Removed loading state for faster rendering
  const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'daily' | 'programmes'>('summary');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && candidates.length > 0 && programmes.length > 0) {
      calculateTeamMarks();
    }
  }, [results, teams, candidates, programmes]);

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

  // Grade points mapping
  const getGradePoints = (grade: string) => {
    const gradePoints: { [key: string]: number } = {
      'A': 5,
      'B': 3,
      'C': 1
    };
    return gradePoints[grade] || 0;
  };

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

    console.log('Processing', results.length, 'results for', Object.keys(teamMarksMap).length, 'teams');
    console.log('Available programmes:', programmes.length);
    
    if (results.length === 0) {
      console.log('⚠️ No results to process - this explains why all teams show 0 points');
      return;
    }

    // Debug: Check first few results for programme data
    results.slice(0, 3).forEach((result, idx) => {
      const programmeDetails = getProgrammeDetails(result);
      console.log(`Result ${idx + 1}: "${programmeDetails.name}" (ID: ${result.programmeId})`);
    });

    // Calculate marks from results
    results.forEach(result => {
      const programmeType = result.positionType;
      const programmeDetails = getProgrammeDetails(result);
      const programmeName = programmeDetails.name;
      const programmeCategory = programmeDetails.category;
      const programmeSection = programmeDetails.section;

      // Process individual/group results
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            if (candidate.team === 'AQS') {
              console.log(`✅ Adding ${totalPoints} points to AQS team for ${programmeName} (${winner.chestNumber})`);
            }
            teamMarksMap[candidate.team][programmeType] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: programmeType
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
            teamMarksMap[candidate.team][programmeType] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: programmeType
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
            teamMarksMap[candidate.team][programmeType] += totalPoints;
            teamMarksMap[candidate.team].total += totalPoints;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: programmeType
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
              console.log(`✅ Adding ${totalPoints} points to AQS team for ${programmeName} (team result)`);
            }
            teamMarksMap[winner.teamCode].general += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: 'general'
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
            teamMarksMap[winner.teamCode].general += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: 'general'
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
            teamMarksMap[winner.teamCode].general += totalPoints;
            teamMarksMap[winner.teamCode].total += totalPoints;
            teamMarksMap[winner.teamCode].participantCount += 1;
            teamMarksMap[winner.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: totalPoints,
              type: 'general'
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
        <h2 className="text-2xl font-bold mb-4">📊 Marks Summary Dashboard</h2>
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
            📋 Programme Details
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

      {/* Programme Details View */}
      {selectedView === 'programmes' && (
        <div className="space-y-6">
          {teamMarks.map((team, index) => (
            <div key={team.teamCode} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: team.teamColor }}
                  >
                    {team.teamCode}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                    <p className="text-sm text-gray-600">{team.programmes.length} programmes • {team.participantCount} participants</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: team.teamColor }}>
                    {team.total}
                  </div>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>

              {/* Programme List */}
              {team.programmes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.programmes.map((programme, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 leading-tight" title={programme.name}>
                            {programme.name}
                          </h4>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              programme.category === 'arts' ? 'bg-purple-100 text-purple-800' :
                              programme.category === 'sports' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              📚 {programme.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              programme.section === 'senior' ? 'bg-blue-100 text-blue-800' :
                              programme.section === 'junior' ? 'bg-yellow-100 text-yellow-800' :
                              programme.section === 'sub-junior' ? 'bg-pink-100 text-pink-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              👥 {programme.section}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              programme.type === 'individual' ? 'bg-orange-100 text-orange-800' :
                              programme.type === 'group' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {programme.type === 'individual' ? '👤' : '👥'} {programme.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 font-medium">Points Earned:</span>
                        <div 
                          className="text-sm font-bold px-3 py-1 rounded-full text-white shadow-sm"
                          style={{ backgroundColor: team.teamColor }}
                        >
                          +{programme.points}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No programmes recorded for this team</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Daily Progress View */}
      {selectedView === 'daily' && showDailyProgress && (
        <DailyMarksSummary results={results} />
      )}

    </div>
  );
}
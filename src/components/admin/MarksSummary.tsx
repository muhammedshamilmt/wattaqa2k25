'use client';

import { useState, useEffect } from 'react';
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
  const [teamMarks, setTeamMarks] = useState<TeamMarks[]>([]);
  // Removed loading state for faster rendering
  const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'daily'>('summary');

  useEffect(() => {
    fetchTeamsAndCandidates();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && candidates.length > 0) {
      calculateTeamMarks();
    }
  }, [results, teams, candidates]);

  const fetchTeamsAndCandidates = async () => {
    try {
      const [teamsRes, candidatesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/candidates')
      ]);

      console.log('Teams API response:', teamsRes.status, teamsRes.ok);
      console.log('Candidates API response:', candidatesRes.status, candidatesRes.ok);

      if (teamsRes.ok && candidatesRes.ok) {
        const [teamsData, candidatesData] = await Promise.all([
          teamsRes.json(),
          candidatesRes.json()
        ]);

        console.log('Teams data:', teamsData);
        console.log('Candidates data:', candidatesData);

        setTeams(teamsData || []);
        setCandidates(candidatesData || []);
      } else {
        console.error('API Error - Teams:', teamsRes.status, 'Candidates:', candidatesRes.status);
        // Set empty arrays if API fails
        setTeams([]);
        setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching teams and candidates:', error);
      // Set empty arrays on error
      setTeams([]);
      setCandidates([]);
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

    // Calculate marks from results
    results.forEach(result => {
      const programmeType = result.positionType;
      const programmeName = result.programmeName || 'Unknown Programme';
      const programmeCategory = result.programmeCategory || 'Unknown';
      const programmeSection = result.section;

      // Process individual/group results
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            // Add position points + grade points
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
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

      if (result.participationGrades) {
        result.participationGrades.forEach(pg => {
          const candidate = candidates.find(c => c.chestNumber === pg.chestNumber);
          if (candidate && teamMarksMap[candidate.team]) {
            teamMarksMap[candidate.team][programmeType] += pg.points;
            teamMarksMap[candidate.team].total += pg.points;
            teamMarksMap[candidate.team].participantCount += 1;
            teamMarksMap[candidate.team].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: pg.points,
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

      if (result.participationTeamGrades) {
        result.participationTeamGrades.forEach(pg => {
          if (teamMarksMap[pg.teamCode]) {
            teamMarksMap[pg.teamCode].general += pg.points;
            teamMarksMap[pg.teamCode].total += pg.points;
            teamMarksMap[pg.teamCode].participantCount += 1;
            teamMarksMap[pg.teamCode].programmes.push({
              name: programmeName,
              category: programmeCategory,
              section: programmeSection,
              points: pg.points,
              type: 'general'
            });
          }
        });
      }
    });

    // Sort teams by total marks
    const sortedTeamMarks = Object.values(teamMarksMap).sort((a, b) => b.total - a.total);
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
                onClick={fetchTeamsAndCandidates}
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
                  <tr key={team.teamCode} className="hover:bg-gray-50">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Progress View */}
      {selectedView === 'daily' && showDailyProgress && (
        <DailyMarksSummary results={results} />
      )}

    </div>
  );
}
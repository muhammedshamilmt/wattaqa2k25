'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Team } from '@/types';

interface DailyMarks {
  date: string;
  teams: {
    [teamCode: string]: {
      teamName: string;
      teamColor: string;
      dailyPoints: number;
      totalPoints: number;
      programmes: number;
    };
  };
  totalProgrammes: number;
  totalPoints: number;
}

interface DailyMarksSummaryProps {
  results: EnhancedResult[];
}

export default function DailyMarksSummary({ results }: DailyMarksSummaryProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [dailyMarks, setDailyMarks] = useState<DailyMarks[]>([]);
  // Removed loading state for faster rendering
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teams.length > 0) {
      calculateDailyMarks();
    }
  }, [results, teams]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const teamsData = await response.json();
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      // No loading state to manage
    }
  };

  const calculateDailyMarks = () => {
    const dailyData: { [date: string]: DailyMarks } = {};

    // Group results by date
    results.forEach(result => {
      const date = new Date(result.createdAt || '').toDateString();
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          teams: {},
          totalProgrammes: 0,
          totalPoints: 0
        };

        // Initialize all teams for this date
        teams.forEach(team => {
          dailyData[date].teams[team.code] = {
            teamName: team.name,
            teamColor: team.color,
            dailyPoints: 0,
            totalPoints: 0,
            programmes: 0
          };
        });
      }

      dailyData[date].totalProgrammes += 1;

      // Calculate points for this result
      let resultPoints = 0;
      
      // Individual/Group results
      if (result.firstPlace) {
        resultPoints += result.firstPlace.length * result.firstPoints;
      }
      if (result.secondPlace) {
        resultPoints += result.secondPlace.length * result.secondPoints;
      }
      if (result.thirdPlace) {
        resultPoints += result.thirdPlace.length * result.thirdPoints;
      }
      if (result.participationGrades) {
        resultPoints += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
      }

      // Team results
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            dailyData[date].teams[team.teamCode].dailyPoints += result.firstPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            dailyData[date].teams[team.teamCode].dailyPoints += result.secondPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            dailyData[date].teams[team.teamCode].dailyPoints += result.thirdPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }
      if (result.participationTeamGrades) {
        result.participationTeamGrades.forEach(pg => {
          if (dailyData[date].teams[pg.teamCode]) {
            dailyData[date].teams[pg.teamCode].dailyPoints += pg.points;
            dailyData[date].teams[pg.teamCode].programmes += 1;
          }
        });
      }

      dailyData[date].totalPoints += resultPoints;
    });

    // Calculate cumulative totals
    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const cumulativeTeamPoints: { [teamCode: string]: number } = {};
    
    teams.forEach(team => {
      cumulativeTeamPoints[team.code] = 0;
    });

    sortedDates.forEach(date => {
      Object.keys(dailyData[date].teams).forEach(teamCode => {
        cumulativeTeamPoints[teamCode] += dailyData[date].teams[teamCode].dailyPoints;
        dailyData[date].teams[teamCode].totalPoints = cumulativeTeamPoints[teamCode];
      });
    });

    const dailyMarksArray = sortedDates.map(date => dailyData[date]);
    setDailyMarks(dailyMarksArray);
    
    if (dailyMarksArray.length > 0 && !selectedDate) {
      setSelectedDate(dailyMarksArray[dailyMarksArray.length - 1].date);
    }
  };

  const getSelectedDayData = () => {
    return dailyMarks.find(day => day.date === selectedDate);
  };

  // Removed loading spinner - render content immediately

  const selectedDay = getSelectedDayData();

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Daily Progress Tracker</h3>
        <div className="flex flex-wrap gap-2">
          {dailyMarks.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDate === day.date
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day {index + 1}
              <div className="text-xs opacity-75">
                {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Summary */}
      {selectedDay && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              📊 {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="flex space-x-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {selectedDay.totalProgrammes} Programmes
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                {selectedDay.totalPoints} Points
              </span>
            </div>
          </div>

          {/* Team Performance for Selected Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(selectedDay.teams)
              .sort(([,a], [,b]) => b.totalPoints - a.totalPoints)
              .map(([teamCode, teamData], index) => (
              <div key={teamCode} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: teamData.teamColor }}
                    >
                      {teamCode}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{teamData.teamName}</div>
                      <div className="text-xs text-gray-500">{teamData.programmes} programmes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: teamData.teamColor }}>
                      {teamData.totalPoints}
                    </div>
                    <div className="text-xs text-gray-500">
                      +{teamData.dailyPoints} today
                    </div>
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: teamData.teamColor,
                      width: `${Math.min((teamData.totalPoints / Math.max(...Object.values(selectedDay.teams).map(t => t.totalPoints))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Chart */}
      {dailyMarks.length > 1 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Team Progress Over Time</h3>
          <div className="space-y-4">
            {teams.map(team => {
              const teamProgress = dailyMarks.map(day => day.teams[team.code]?.totalPoints || 0);
              const maxPoints = Math.max(...dailyMarks.flatMap(day => Object.values(day.teams).map(t => t.totalPoints)));
              
              return (
                <div key={team.code} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-32">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.code}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{team.name}</span>
                  </div>
                  <div className="flex-1 flex items-center space-x-1">
                    {teamProgress.map((points, index) => (
                      <div
                        key={index}
                        className="flex-1 h-6 rounded"
                        style={{
                          backgroundColor: team.color,
                          opacity: points / maxPoints || 0.1
                        }}
                        title={`Day ${index + 1}: ${points} points`}
                      ></div>
                    ))}
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-bold" style={{ color: team.color }}>
                      {teamProgress[teamProgress.length - 1] || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
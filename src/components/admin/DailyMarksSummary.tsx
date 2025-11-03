'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Team } from '@/types';
import { getGradePoints } from '@/utils/markingSystem';

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
    console.log('📅 Processing results for daily progress:', results.length);
    
    results.forEach(result => {
      const createdAt = result.createdAt || result.updatedAt || new Date().toISOString();
      const date = new Date(createdAt).toDateString();
      
      console.log(`Processing result: ${result.programmeName || 'Unknown'} - Date: ${date}`);
      
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

      // Helper function to get team code from chest number
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

      // Process individual winners (assign points to their teams)
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamCode && dailyData[date].teams[teamCode]) {
            // Add grade points if available
            const gradePoints = winner.grade ? getGradePoints(winner.grade) : 0;
            const totalPoints = result.firstPoints + gradePoints;
            dailyData[date].teams[teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[teamCode].programmes += 1;
          }
        });
      }
      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamCode && dailyData[date].teams[teamCode]) {
            const gradePoints = winner.grade ? getGradePoints(winner.grade) : 0;
            const totalPoints = result.secondPoints + gradePoints;
            dailyData[date].teams[teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[teamCode].programmes += 1;
          }
        });
      }
      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamCode && dailyData[date].teams[teamCode]) {
            const gradePoints = winner.grade ? getGradePoints(winner.grade) : 0;
            const totalPoints = result.thirdPoints + gradePoints;
            dailyData[date].teams[teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[teamCode].programmes += 1;
          }
        });
      }

      // Process team winners
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            const gradePoints = team.grade ? getGradePoints(team.grade) : 0;
            const totalPoints = result.firstPoints + gradePoints;
            dailyData[date].teams[team.teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            const gradePoints = team.grade ? getGradePoints(team.grade) : 0;
            const totalPoints = result.secondPoints + gradePoints;
            dailyData[date].teams[team.teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(team => {
          if (dailyData[date].teams[team.teamCode]) {
            const gradePoints = team.grade ? getGradePoints(team.grade) : 0;
            const totalPoints = result.thirdPoints + gradePoints;
            dailyData[date].teams[team.teamCode].dailyPoints += totalPoints;
            dailyData[date].teams[team.teamCode].programmes += 1;
          }
        });
      }

      // Calculate total points for this date
      let dateTotal = 0;
      Object.values(dailyData[date].teams).forEach(team => {
        dateTotal += team.dailyPoints;
      });
      dailyData[date].totalPoints = dateTotal;
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
    console.log('📊 Daily marks calculated:', dailyMarksArray.length, 'days');
    console.log('Daily marks data:', dailyMarksArray);
    
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
        
        {dailyMarks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📅</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Daily Data Available</h4>
            <p className="text-gray-500 text-sm mb-4">
              Daily progress will appear here once results are processed with valid dates.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h5 className="font-medium text-blue-900 mb-2">Debug Information:</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Total Results: {results.length}</div>
                <div>• Teams Available: {teams.length}</div>
                <div>• Daily Marks Calculated: {dailyMarks.length}</div>
              </div>
            </div>
          </div>
        ) : (
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
        )}
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
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '@/components/ui/BackButton';

interface TeamData {
  teamCode: string;
  name: string;
  points: number;
  artsPoints: number;
  sportsPoints: number;
  results: number;
  color: string;
  rank: number;
  change?: number; // Position change from last update
}

interface TopPerformer {
  name: string;
  chestNumber: string;
  team: string;
  programme: string;
  position: string;
  grade: string;
  points: number;
}

export default function PublicLeaderboard() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'teams' | 'individuals'>('teams');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'arts' | 'sports'>('all');
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setAnimationKey(prev => prev + 1);
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch dynamic data from APIs
      const [grandMarksRes, resultsRes, candidatesRes] = await Promise.all([
        fetch('/api/grand-marks?category=all'),
        fetch('/api/results?status=published'),
        fetch('/api/candidates')
      ]);

      if (grandMarksRes.ok && resultsRes.ok && candidatesRes.ok) {
        const [grandMarksData, resultsData, candidatesData] = await Promise.all([
          grandMarksRes.json(),
          resultsRes.json(),
          candidatesRes.json()
        ]);

        // Transform grand marks data to team data format
        const teamData: TeamData[] = grandMarksData.map((team: any, index: number) => ({
          teamCode: team.teamCode,
          name: team.name,
          points: team.points,
          artsPoints: team.artsPoints || 0,
          sportsPoints: team.sportsPoints || 0,
          results: team.results || 0,
          color: team.color || '#6366f1',
          rank: index + 1,
          change: 0
        }));

        // Generate top performers from published results
        const topPerformersData: TopPerformer[] = [];
        
        resultsData.slice(0, 10).forEach((result: any) => {
          // Add first place winners
          if (result.firstPlace && result.firstPlace.length > 0) {
            result.firstPlace.forEach((winner: any) => {
              const candidate = candidatesData.find((c: any) => c.chestNumber === winner.chestNumber);
              if (candidate && topPerformersData.length < 6) {
                topPerformersData.push({
                  name: candidate.name || 'Unknown Participant',
                  chestNumber: winner.chestNumber,
                  team: candidate.team || 'Unknown Team',
                  programme: result.programmeName || 'Unknown Programme',
                  position: '1st Place',
                  grade: winner.grade || 'A',
                  points: (result.firstPoints || 5) + getGradePoints(winner.grade || '')
                });
              }
            });
          }
          
          // Add second place winners
          if (result.secondPlace && result.secondPlace.length > 0 && topPerformersData.length < 6) {
            result.secondPlace.forEach((winner: any) => {
              const candidate = candidatesData.find((c: any) => c.chestNumber === winner.chestNumber);
              if (candidate && topPerformersData.length < 6) {
                topPerformersData.push({
                  name: candidate.name || 'Unknown Participant',
                  chestNumber: winner.chestNumber,
                  team: candidate.team || 'Unknown Team',
                  programme: result.programmeName || 'Unknown Programme',
                  position: '2nd Place',
                  grade: winner.grade || 'B+',
                  points: (result.secondPoints || 3) + getGradePoints(winner.grade || '')
                });
              }
            });
          }
        });

        setTeams(teamData);
        setTopPerformers(topPerformersData);
      } else {
        // Fallback to static data if API fails
        const fallbackTeamData: TeamData[] = [
          {
            teamCode: 'INT',
            name: 'Team Inthifada',
            points: 544,
            artsPoints: 544,
            sportsPoints: 115,
            results: 50,
            color: '#EF4444',
            rank: 1,
            change: 0
          },
          {
            teamCode: 'SMD',
            name: 'Team Sumud',
            points: 432,
            artsPoints: 432,
            sportsPoints: 118,
            results: 45,
            color: '#10B981',
            rank: 2,
            change: 0
          },
          {
            teamCode: 'AQS',
            name: 'Team Aqsa',
            points: 424,
            artsPoints: 424,
            sportsPoints: 118,
            results: 42,
            color: '#6B7280',
            rank: 3,
            change: 0
          }
        ];
        
        setTeams(fallbackTeamData);
        setTopPerformers([]);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Set fallback data on error
      setTeams([]);
      setTopPerformers([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get grade points
  const getGradePoints = (grade: string): number => {
    switch (grade) {
      case 'A+': return 10;
      case 'A': return 9;
      case 'A-': return 8;
      case 'B+': return 7;
      case 'B': return 6;
      case 'B-': return 5;
      case 'C+': return 4;
      case 'C': return 3;
      case 'C-': return 2;
      case 'D+': return 1;
      case 'D': return 0.5;
      case 'D-': return 0.25;
      case 'E+': return 0.1;
      case 'E': return 0.05;
      case 'E-': return 0.01;
      case 'F': return 0;
      default: return 0;
    }
  };

  const getFilteredTeams = () => {
    return teams.map(team => {
      let displayPoints = team.points;
      if (categoryFilter === 'arts') {
        displayPoints = team.artsPoints;
      } else if (categoryFilter === 'sports') {
        displayPoints = team.sportsPoints;
      }
      return { ...team, points: displayPoints };
    }).sort((a, b) => b.points - a.points);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-blue-600 bg-blue-100';
      case 'A-': return 'text-indigo-600 bg-indigo-100';
      case 'B+': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Leaderboard...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching latest competition standings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standard Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <BackButton 
              href="/" 
              label="← Back to Home" 
              className="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm"
            />
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live Updates</span>
            </div>
          </div>
          
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                🏆 Wattaqa 2K25 Leaderboard
              </h1>
              <p className="text-gray-600">
                Real-time competition standings and top performers
              </p>
            </motion.div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="font-medium">Last Updated:</span> {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="font-medium">Total Teams:</span> {teams.length}
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="font-medium">Published Results:</span> {teams.reduce((sum, team) => sum + team.results, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveView('teams')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeView === 'teams'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                🏆 Team Rankings
              </button>
              <button
                onClick={() => setActiveView('individuals')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                  activeView === 'individuals'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                ⭐ Top Performers
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter for Teams */}
        {activeView === 'teams' && (
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <div className="flex space-x-1">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    categoryFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🏅 Overall
                </button>
                <button
                  onClick={() => setCategoryFilter('arts')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    categoryFilter === 'arts'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  🎨 Arts
                </button>
                <button
                  onClick={() => setCategoryFilter('sports')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    categoryFilter === 'sports'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  ⚽ Sports
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Rankings View */}
        <AnimatePresence mode="wait">
          {activeView === 'teams' && (
            <motion.div
              key={`teams-${animationKey}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {getFilteredTeams().map((team, index) => (
                  <motion.div
                    key={team.teamCode}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300"
                    style={{ 
                      borderColor: team.color + '40',
                      backgroundColor: team.color + '05'
                    }}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md"
                        style={{ backgroundColor: team.color }}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Trophy Icon for Winner */}
                    {index === 0 && (
                      <div className="absolute top-4 right-4 text-2xl">
                        🏆
                      </div>
                    )}

                    <div className="p-6 pt-16">
                      {/* Team Info */}
                      <div className="text-center mb-4">
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.teamCode}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {team.name}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {team.results} programmes completed
                        </div>
                      </div>

                      {/* Points Display */}
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold mb-1" style={{ color: team.color }}>
                          {Math.round(team.points)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {categoryFilter === 'all' ? 'Total Points' :
                           categoryFilter === 'arts' ? 'Arts Points' : 'Sports Points'}
                        </div>
                      </div>

                      {/* Points Breakdown */}
                      {categoryFilter === 'all' && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                              {Math.round(team.artsPoints)}
                            </div>
                            <div className="text-xs text-gray-600">🎨 Arts</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">
                              {Math.round(team.sportsPoints)}
                            </div>
                            <div className="text-xs text-gray-600">⚽ Sports</div>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{
                              backgroundColor: team.color,
                              width: `${Math.min((team.points / Math.max(...getFilteredTeams().map(t => t.points))) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                          Rank #{index + 1}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Performers View */}
          {activeView === 'individuals' && (
            <motion.div
              key="individuals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-3xl shadow-xl border p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ⭐ Top Individual Performers
                  </h3>
                  <p className="text-gray-600">
                    Outstanding achievements in competition programmes
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topPerformers.map((performer, index) => (
                    <motion.div
                      key={`${performer.chestNumber}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                    >
                      {/* Achievement Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(performer.grade)}`}>
                          Grade {performer.grade}
                        </div>
                        <div className="text-2xl">
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : '⭐'}
                        </div>
                      </div>

                      {/* Performer Info */}
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-1">
                          {performer.name}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {performer.chestNumber}
                          </div>
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {performer.team}
                          </div>
                        </div>
                      </div>

                      {/* Programme & Achievement */}
                      <div className="bg-white rounded-xl p-4 mb-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {performer.programme}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {performer.position}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Points Earned</span>
                          <span className="font-bold text-blue-600">
                            {performer.points} pts
                          </span>
                        </div>
                      </div>

                      {/* Achievement Level */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                          style={{ width: `${(performer.points / 15) * 100}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              📊 Competition Statistics
            </h3>
            <p className="text-gray-600 text-sm">
              Live updates from Wattaqa 2K25 festival
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {teams.reduce((sum, team) => sum + team.results, 0)}
              </div>
              <div className="text-xs text-gray-600">Published Results</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">{teams.length}</div>
              <div className="text-xs text-gray-600">Active Teams</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">{topPerformers.length}</div>
              <div className="text-xs text-gray-600">Top Performers</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.round((teams.reduce((sum, team) => sum + team.results, 0) / 137) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Progress</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
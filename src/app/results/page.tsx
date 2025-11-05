"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Team, Result, Candidate, Programme } from '@/types';
import { BackButton } from '@/components/ui/BackButton';
import PublicRankings from '@/components/Rankings/PublicRankings';

interface DashboardStats {
  totalProgrammes: number;
  completedResults: number;
  totalWinners: number;
  completionRate: number;
  artsPrograms: number;
  sportsPrograms: number;
  todayResults: number;
}

export default function ResultsDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProgrammes: 0,
    completedResults: 0,
    totalWinners: 0,
    completionRate: 0,
    artsPrograms: 0,
    sportsPrograms: 0,
    todayResults: 0
  });
  const [grandMarksData, setGrandMarksData] = useState<any[]>([]);
  const [artsMarksData, setArtsMarksData] = useState<any[]>([]);
  const [sportsMarksData, setSportsMarksData] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'arts' | 'sports'>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 19000000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Function to get team code from chest number (same logic as checklist page)
  const getTeamCodeFromChestNumber = (chestNumber: string, teamsData: Team[]) => {
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
      if (num >= 600 && num < 700) {
        return 'AQS';
      } else if (num >= 400 && num < 500) {
        return 'INT';
      } else if (num >= 200 && num < 300) {
        return 'SMD';
      } else if (num >= 100 && num < 200) {
        return 'A';
      } else {
        return chestNumber.charAt(0);
      }
    }

    const availableTeamCodes = teamsData.map(t => t.code.toUpperCase());
    for (const teamCode of availableTeamCodes) {
      if (upperChestNumber.includes(teamCode)) {
        return teamCode;
      }
    }

    return '';
  };

  // Function to get grade points (same logic as checklist page)
  const getGradePoints = (grade: string) => {
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

  // Function to calculate combined marks from arts and sports data
  const calculateCombinedMarks = (artsData: any[], sportsData: any[]) => {
    const teamTotals: { [teamCode: string]: any } = {};

    // Initialize with arts data
    artsData.forEach(team => {
      teamTotals[team.teamCode] = {
        teamCode: team.teamCode,
        name: team.name,
        artsPoints: team.points || 0,
        sportsPoints: 0,
        artsResults: team.results || 0,
        sportsResults: 0,
        color: team.color
      };
    });

    // Add sports data
    sportsData.forEach(team => {
      if (teamTotals[team.teamCode]) {
        teamTotals[team.teamCode].sportsPoints = team.points || 0;
        teamTotals[team.teamCode].sportsResults = team.results || 0;
      } else {
        teamTotals[team.teamCode] = {
          teamCode: team.teamCode,
          name: team.name,
          artsPoints: 0,
          sportsPoints: team.points || 0,
          artsResults: 0,
          sportsResults: team.results || 0,
          color: team.color
        };
      }
    });

    // Calculate total points and results
    return Object.values(teamTotals)
      .map((team: any) => ({
        ...team,
        points: team.artsPoints + team.sportsPoints,
        results: team.artsResults + team.sportsResults
      }))
      .filter(team => team.points > 0)
      .sort((a, b) => b.points - a.points);
  };

  // Function to calculate team marks from published results (same logic as checklist page)
  const calculateTeamMarksFromResults = (resultsData: Result[], teamsData: Team[], candidatesData: Candidate[], programmesData: Programme[]) => {
    const teamTotals: {
      [teamCode: string]: {
        name: string;
        points: number;
        results: number;
        artsPoints: number;
        sportsPoints: number;
        artsResults: number;
        sportsResults: number;
        color: string;
      }
    } = {};

    // Initialize team totals
    teamsData.forEach(team => {
      teamTotals[team.code] = {
        name: team.name,
        points: 0,
        results: 0,
        artsPoints: 0,
        sportsPoints: 0,
        artsResults: 0,
        sportsResults: 0,
        color: team.color || '#6366f1'
      };
    });

    // Helper function to add points to team totals
    const addPointsToTeam = (teamCode: string, points: number, result: any) => {
      if (teamTotals[teamCode]) {
        // Separate Arts and Sports points
        if (result.programmeCategory === 'arts') {
          teamTotals[teamCode].artsPoints += points;
          teamTotals[teamCode].artsResults += 1;
        } else if (result.programmeCategory === 'sports') {
          teamTotals[teamCode].sportsPoints += points;
          teamTotals[teamCode].sportsResults += 1;
        }
      }
    };

    // Process published results only
    const publishedResults = resultsData.filter(result => result.status === 'published');

    publishedResults.forEach(result => {
      const programme = programmesData.find(p => p._id?.toString() === result.programmeId);
      if (!programme) return;

      // Enrich result with programme information
      const enrichedResult = {
        ...result,
        programmeCategory: programme.category,
        programmeSubcategory: programme.subcategory
      };

      // Process individual winners with grade points
      if (result.firstPlace) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
          if (teamCode) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.firstPoints || 0) + gradePoints;
            addPointsToTeam(teamCode, totalPoints, enrichedResult);
          }
        });
      }

      if (result.secondPlace) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
          if (teamCode) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.secondPoints || 0) + gradePoints;
            addPointsToTeam(teamCode, totalPoints, enrichedResult);
          }
        });
      }

      if (result.thirdPlace) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber, teamsData);
          if (teamCode) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = (result.thirdPoints || 0) + gradePoints;
            addPointsToTeam(teamCode, totalPoints, enrichedResult);
          }
        });
      }

      // Process team winners with grade points
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.firstPoints || 0) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
        });
      }

      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.secondPoints || 0) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
        });
      }

      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          const totalPoints = (result.thirdPoints || 0) + gradePoints;
          addPointsToTeam(winner.teamCode, totalPoints, enrichedResult);
        });
      }
    });

    // Convert to array and sort by total points (arts + sports)
    return Object.entries(teamTotals)
      .map(([teamCode, data]) => ({
        teamCode,
        name: data.name,
        points: data.artsPoints + data.sportsPoints, // Total points = arts + sports
        artsPoints: data.artsPoints,
        sportsPoints: data.sportsPoints,
        results: data.artsResults + data.sportsResults,
        color: data.color
      }))
      .filter(team => team.points > 0)
      .sort((a, b) => b.points - a.points);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, resultsRes, candidatesRes, programmesRes, artsMarksRes, sportsMarksRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/results?teamView=true'),
        fetch('/api/candidates'),
        fetch('/api/programmes'),
        fetch('/api/admin-checklist-marks?category=arts-total'),
        fetch('/api/admin-checklist-marks?category=sports')
      ]);

      const [teamsData, resultsData, candidatesData, programmesData, artsMarksResponse, sportsMarksResponse] = await Promise.all([
        teamsRes.json(),
        resultsRes.json(),
        candidatesRes.json(),
        programmesRes.json(),
        artsMarksRes.json(),
        sportsMarksRes.json()
      ]);

      setTeams(teamsData || []);
      setResults(resultsData || []);
      setCandidates(candidatesData || []);
      setProgrammes(programmesData || []);

      // Use admin checklist marks API for accurate calculations
      setArtsMarksData(artsMarksResponse || []);
      setSportsMarksData(sportsMarksResponse || []);

      // Calculate combined grand marks from arts and sports
      const combinedMarks = calculateCombinedMarks(artsMarksResponse || [], sportsMarksResponse || []);
      setGrandMarksData(combinedMarks);

      setLastUpdated(new Date());

      // Process dashboard statistics
      processDashboardData(teamsData, resultsData, candidatesData, programmesData, combinedMarks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (
    teamsData: Team[],
    resultsData: Result[],
    candidatesData: Candidate[],
    programmesData: Programme[],
    grandMarksData: any[]
  ) => {
    // Calculate dashboard statistics
    const totalWinners = resultsData.reduce((sum, result) => {
      return sum +
        (result.firstPlace?.length || 0) +
        (result.secondPlace?.length || 0) +
        (result.thirdPlace?.length || 0) +
        (result.firstPlaceTeams?.length || 0) +
        (result.secondPlaceTeams?.length || 0) +
        (result.thirdPlaceTeams?.length || 0);
    }, 0);

    const artsPrograms = programmesData.filter(p => p.category === 'arts').length;
    const sportsPrograms = programmesData.filter(p => p.category === 'sports').length;

    // Today's results (mock data for demo)
    const today = new Date().toDateString();
    const todayResults = resultsData.filter(r =>
      new Date(r.createdAt || '').toDateString() === today
    ).length;

    setDashboardStats({
      totalProgrammes: programmesData.length,
      completedResults: resultsData.length,
      totalWinners,
      completionRate: Math.round((resultsData.length / programmesData.length) * 100) || 0,
      artsPrograms,
      sportsPrograms,
      todayResults
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <BackButton
                href="/"
                label="← Back"
                className="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Festival Results</h1>
                <p className="text-gray-500 mt-1">
                  Live competition results and rankings • Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome to Wattaqa 2K25 Results
                  </h2>
                  <p className="text-gray-600">
                    Track live competition results and team standings
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardStats.completedResults}</div>
                <div className="text-sm text-blue-700">Results</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardStats.completionRate}%</div>
                <div className="text-sm text-green-700">Complete</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{dashboardStats.totalWinners}</div>
                <div className="text-sm text-purple-700">Winners</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.todayResults}</div>
                <div className="text-sm text-orange-700">Today</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.totalProgrammes}</div>
            <div className="text-sm text-gray-600">Total Programmes</div>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <span>↗ Active festival programmes</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎨</span>
              </div>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Arts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.artsPrograms}</div>
            <div className="text-sm text-gray-600">Arts Programmes</div>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <span>🎭 Creative competitions</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">⚽</span>
              </div>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Sports</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.sportsPrograms}</div>
            <div className="text-sm text-gray-600">Sports Programmes</div>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <span>🏃 Athletic competitions</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">📈</span>
              </div>
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Progress</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{dashboardStats.completionRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${dashboardStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Team Rankings Section - Enhanced with Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
            <div className="mb-4 lg:mb-0">
              <h3 className="text-xl font-semibold text-gray-900">🏆 Team Leaderboard</h3>
              <p className="text-sm text-gray-600">Current standings based on published results (using admin checklist calculation)</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Live</span>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
            >
              🏆 All Categories
            </button>
            <button
              onClick={() => setActiveCategory('arts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'arts'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
            >
              🎨 Arts Only
            </button>
            <button
              onClick={() => setActiveCategory('sports')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'sports'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            >
              🏃 Sports Only
            </button>
          </div>

          {(() => {
            let displayData = grandMarksData;
            if (activeCategory === 'arts') {
              displayData = artsMarksData;
            } else if (activeCategory === 'sports') {
              displayData = sportsMarksData;
            }

            return displayData && displayData.length > 0 ? (
              <div className="space-y-3">
                {displayData.slice(0, 6).map((team, index) => (
                  <motion.div
                    key={team.teamCode}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-bold text-gray-400 w-8">
                        #{index + 1}
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.teamCode}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.results} programmes completed
                          {activeCategory === 'all' && (
                            <span className="ml-2 text-xs">
                              ({team.artsResults || 0} arts, {team.sportsResults || 0} sports)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      {activeCategory === 'all' && (
                        <>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Arts</div>
                            <div className="font-bold text-purple-600">
                              {Math.round(team.artsPoints || 0)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Sports</div>
                            <div className="font-bold text-green-600">
                              {Math.round(team.sportsPoints || 0)}
                            </div>
                          </div>
                        </>
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: team.color }}>
                          {Math.round(team.points)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activeCategory === 'arts' ? 'Arts Points' :
                            activeCategory === 'sports' ? 'Sports Points' :
                              'Total Points'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {displayData.length > 6 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                      View All {displayData.length} Teams →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">
                    {activeCategory === 'arts' ? '🎨' :
                      activeCategory === 'sports' ? '🏃' : '🏆'}
                  </span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeCategory === 'arts' ? 'Arts' :
                    activeCategory === 'sports' ? 'Sports' : ''} Rankings Available
                </h4>
                <p className="text-gray-500 text-sm">
                  {activeCategory === 'arts' ? 'Arts' :
                    activeCategory === 'sports' ? 'Sports' : 'Team'} rankings will appear here once results are published.
                </p>
              </div>
            );
          })()}
        </motion.div>

        {/* Note: Removed "Remaining Programmes" section for public users */}
        {/* Public users should not see pending programmes in results page */}
        {/* They can view all programmes (including pending) in the dedicated programmes page */}

        {/* Public Rankings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <PublicRankings className="min-h-[600px]" />
        </motion.div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Result, Candidate, Programme, Team } from '@/types';
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import MarksSummary from '@/components/admin/MarksSummary';
import { getGradePoints } from '@/utils/markingSystem';
import { useTeamAdmin } from '@/contexts/TeamAdminContext';
import { useFirebaseTeamAuth } from '@/contexts/FirebaseTeamAuthContext';


export default function TeamResultsPage() {
  // Use simplified team admin context
  const { teamCode, userEmail, isAdminAccess } = useTeamAdmin();
  
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'team' | 'all' | 'summary'>('team');
  const [filterCategory, setFilterCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [filterSection, setFilterSection] = useState<'all' | 'senior' | 'junior' | 'sub-junior'>('all');

  useEffect(() => {
    // Fetch when we have a valid team code
    if (teamCode && teamCode !== 'Loading...') {
      fetchData();
    }
  }, [teamCode]);

  const fetchData = async () => {
    // Wait for valid team code
    if (!teamCode || teamCode === 'Loading...') {
      console.log('🔄 Waiting for teamCode...', { 
        teamCode: teamCode || 'null',
        isValidTeam: teamCode && teamCode !== 'Loading...'
      });
      return;
    }

    try {
      console.log('🚀 Fetching results data for team:', teamCode);
      console.log('👤 Access info:', { userEmail, isAdminAccess });
      
      console.log('📡 Making API calls...');
      const [resultsRes, candidatesRes, programmesRes, teamsRes] = await Promise.all([
        fetch('/api/team-admin/results?status=published'), // Get ALL published results
        fetch(`/api/team-admin/candidates?team=${teamCode}`),
        fetch('/api/programmes'), // Public data
        fetch('/api/teams') // Public data for team info
      ]);

      console.log('📊 Results API response status:', {
        results: resultsRes.status,
        candidates: candidatesRes.status,
        programmes: programmesRes.status,
        teams: teamsRes.status
      });

      // Check for errors
      if (!resultsRes.ok) {
        console.error('❌ Results API error:', resultsRes.status, resultsRes.statusText);
      }
      if (!candidatesRes.ok) {
        console.error('❌ Candidates API error:', candidatesRes.status, candidatesRes.statusText);
      }
      if (!programmesRes.ok) {
        console.error('❌ Programmes API error:', programmesRes.status, programmesRes.statusText);
      }
      if (!teamsRes.ok) {
        console.error('❌ Teams API error:', teamsRes.status, teamsRes.statusText);
      }

      const [resultsData, candidatesData, programmesData, teamsData] = await Promise.all([
        resultsRes.ok ? resultsRes.json() : [],
        candidatesRes.ok ? candidatesRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        teamsRes.ok ? teamsRes.json() : []
      ]);

      console.log('✅ Fetched data counts:', {
        results: resultsData?.length || 0,
        candidates: candidatesData?.length || 0,
        programmes: programmesData?.length || 0,
        teams: teamsData?.length || 0
      });

      // Set data with safe fallbacks
      setAllResults(Array.isArray(resultsData) ? resultsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('💥 Error fetching results data:', error);
      // Set empty arrays on error
      setAllResults([]);
      setCandidates([]);
      setProgrammes([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Get current team data
  const currentTeam = teams.find(t => t.code === teamCode);

  // Filter results that include team members
  const teamResults = allResults.filter(result => {
    if (result.status !== 'published') return false;
    
    // Check team results
    if (result.firstPlaceTeams?.some(t => t.teamCode === teamCode) ||
        result.secondPlaceTeams?.some(t => t.teamCode === teamCode) ||
        result.thirdPlaceTeams?.some(t => t.teamCode === teamCode)) {
      return true;
    }
    
    // Check individual results
    const teamChestNumbers = candidates.map(c => c.chestNumber);
    const allWinners = [
      ...(result.firstPlace || []).map(w => w.chestNumber),
      ...(result.secondPlace || []).map(w => w.chestNumber),
      ...(result.thirdPlace || []).map(w => w.chestNumber)
    ];
    return allWinners.some(chestNumber => teamChestNumbers.includes(chestNumber));
  });

  // Get results to display based on active tab and filters
  const getFilteredResults = () => {
    let results = activeTab === 'all' ? allResults.filter(r => r.status === 'published') : teamResults;
    
    // Apply category filter
    if (filterCategory !== 'all') {
      results = results.filter(result => {
        const programme = programmes.find(p => 
          p._id?.toString() === result.programmeId?.toString() ||
          p.id?.toString() === result.programmeId?.toString()
        );
        return programme?.category === filterCategory;
      });
    }
    
    // Apply section filter
    if (filterSection !== 'all') {
      results = results.filter(result => result.section === filterSection);
    }
    
    return results.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  };
  
  const displayResults = getFilteredResults();

  // Calculate team statistics
  const totalResults = teamResults.length;
  const allPublishedResults = allResults.filter(r => r.status === 'published').length;
  
  const firstPlaces = teamResults.filter(result => {
    // Check team first places
    if (result.firstPlaceTeams?.some(t => t.teamCode === teamCode)) return true;
    // Check individual first places
    return result.firstPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber));
  }).length;
  
  const secondPlaces = teamResults.filter(result => {
    // Check team second places
    if (result.secondPlaceTeams?.some(t => t.teamCode === teamCode)) return true;
    // Check individual second places
    return result.secondPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber));
  }).length;
  
  const thirdPlaces = teamResults.filter(result => {
    // Check team third places
    if (result.thirdPlaceTeams?.some(t => t.teamCode === teamCode)) return true;
    // Check individual third places
    return result.thirdPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber));
  }).length;

  // Calculate total points and category-wise breakdown
  const calculatePoints = (results: Result[]) => {
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
      if (result.firstPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
        result.firstPlace.forEach(winner => {
          if (candidates.some(c => c.chestNumber === winner.chestNumber)) {
            const gradePoints = getGradePoints(winner.grade || '');
            points += result.firstPoints + gradePoints;
          }
        });
      }
      if (result.secondPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
        result.secondPlace.forEach(winner => {
          if (candidates.some(c => c.chestNumber === winner.chestNumber)) {
            const gradePoints = getGradePoints(winner.grade || '');
            points += result.secondPoints + gradePoints;
          }
        });
      }
      if (result.thirdPlace?.some(w => candidates.some(c => c.chestNumber === w.chestNumber))) {
        result.thirdPlace.forEach(winner => {
          if (candidates.some(c => c.chestNumber === winner.chestNumber)) {
            const gradePoints = getGradePoints(winner.grade || '');
            points += result.thirdPoints + gradePoints;
          }
        });
      }

      // Add to category totals
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString() ||
        p.id?.toString() === result.programmeId?.toString()
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

  const pointsBreakdown = calculatePoints(teamResults);
  const totalPoints = pointsBreakdown.totalPoints;

  const getPositionBadge = (position: 'first' | 'second' | 'third') => {
    const badges = {
      first: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      second: 'bg-gray-100 text-gray-800 border-gray-200',
      third: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    const icons = {
      first: '🥇',
      second: '🥈', 
      third: '🥉'
    };
    return { class: badges[position], icon: icons[position] };
  };

  const getProgrammeDetails = (result: Result) => {
    if (result.programmeId && programmes.length > 0) {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString() ||
        p.id?.toString() === result.programmeId?.toString()
      );
      if (programme) {
        return {
          name: programme.name,
          category: programme.category || 'Unknown',
          subcategory: programme.subcategory
        };
      }
    }
    return {
      name: result.programme || 'Unknown Programme',
      category: 'Unknown',
      subcategory: null
    };
  };

  // Always show the page immediately
  const displayTeamCode = teamCode || 'Loading...';

  return (
    <div className="space-y-2 relative">
      {/* Team Results - Exact Admin Design */}
      <ShowcaseSection title="Team Results Dashboard">
        {/* Header with Team Colors - Enhanced Mobile Layout */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-4 sm:mb-6"
             style={{ 
               background: `linear-gradient(135deg, ${currentTeam?.color || '#6366f1'} 0%, ${currentTeam?.color || '#6366f1'}dd 50%, ${currentTeam?.color || '#6366f1'}bb 100%)` 
             }}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                  Team {displayTeamCode} Results
                </h1>
                <p className="text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed">
                  Track all published results and your team's performance
                </p>
              </div>
              <div className="flex-shrink-0 self-center sm:self-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl sm:text-3xl lg:text-4xl">🏆</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 bg-gray-100 p-1 rounded-lg mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeTab === 'team'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeTab === 'team' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            <span className="hidden sm:inline">🏅 Team Results ({totalResults})</span>
            <span className="sm:hidden">🏅 Team ({totalResults})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeTab === 'all' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            <span className="hidden sm:inline">📊 All Published Results ({allPublishedResults})</span>
            <span className="sm:hidden">📊 All ({allPublishedResults})</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              activeTab === 'summary'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeTab === 'summary' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            <span className="hidden sm:inline">📈 Marks Summary</span>
            <span className="sm:hidden">📈 Summary</span>
          </button>
        </div>      
  {/* Filter Controls - Mobile Responsive */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700">🔍 Filters:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 sm:gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Category:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as 'all' | 'arts' | 'sports')}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="arts">🎨 Arts</option>
                  <option value="sports">🏃 Sports</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Section:</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value as 'all' | 'senior' | 'junior' | 'sub-junior')}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1 border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:border-blue-500"
                >
                  <option value="all">All Sections</option>
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="sub-junior">Sub-Junior</option>
                </select>
              </div>

              {(filterCategory !== 'all' || filterSection !== 'all') && (
                <button
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterSection('all');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs sm:text-sm hover:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex justify-between items-center sm:ml-auto">
              <span className="text-xs sm:text-sm text-gray-600">
                Showing {displayResults.length} results
              </span>
            </div>
          </div>
        </div> 
       {/* Team Statistics Cards - Only show for team tab */}
        {activeTab === 'team' && (
          <div className="space-y-6 mb-8">
            {/* Main Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <span className="text-2xl">🥇</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{firstPlaces}</h3>
                    <p className="text-sm text-gray-600">First Places</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-100 text-gray-600">
                    <span className="text-2xl">🥈</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{secondPlaces}</h3>
                    <p className="text-sm text-gray-600">Second Places</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <span className="text-2xl">🥉</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{thirdPlaces}</h3>
                    <p className="text-sm text-gray-600">Third Places</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                <div className="flex items-center">
                  <div className="p-3 rounded-full text-white" style={{ backgroundColor: currentTeam?.color || '#6366f1' }}>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{totalPoints}</h3>
                    <p className="text-sm text-gray-600">Total Grand Marks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grand Marks Breakdown - Enhanced Modern Design */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl border-2"
                 style={{ 
                   background: `linear-gradient(135deg, ${currentTeam?.color}15 0%, ${currentTeam?.color}08 50%, white 100%)`,
                   borderColor: `${currentTeam?.color}30`
                 }}>
              
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-lg"
                         style={{ backgroundColor: currentTeam?.color || '#6366f1' }}>
                      <span className="text-white text-lg">📊</span>
                    </div>
                    Published Grand Marks
                  </h3>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-white shadow-sm border"
                       style={{ 
                         borderColor: `${currentTeam?.color}30`,
                         color: currentTeam?.color || '#6366f1'
                       }}>
                    Team {teamCode}
                  </div>
                </div>
                <p className="text-sm text-gray-600 ml-13">
                  Real-time calculation from all published competition results
                </p>
              </div>

              {/* Stats Grid */}
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Arts Points */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white text-2xl">🎨</span>
                      </div>
                      <div className="text-4xl font-black text-purple-600 mb-2">{pointsBreakdown.artsPoints}</div>
                      <div className="text-lg font-bold text-purple-800 mb-1">Arts Points</div>
                      <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                        From published arts results
                      </div>
                    </div>
                  </div>

                  {/* Sports Points */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white text-2xl">⚽</span>
                      </div>
                      <div className="text-4xl font-black text-green-600 mb-2">{pointsBreakdown.sportsPoints}</div>
                      <div className="text-lg font-bold text-green-800 mb-1">Sports Points</div>
                      <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        From published sports results
                      </div>
                    </div>
                  </div>

                  {/* Total Grand Marks */}
                  <div className="bg-white rounded-2xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                       style={{ borderColor: `${currentTeam?.color}30` }}>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                           style={{ 
                             background: `linear-gradient(135deg, ${currentTeam?.color} 0%, ${currentTeam?.color}CC 100%)`
                           }}>
                        <span className="text-white text-2xl">🏆</span>
                      </div>
                      <div className="text-4xl font-black mb-2" style={{ color: currentTeam?.color || '#6366f1' }}>
                        {totalPoints}
                      </div>
                      <div className="text-lg font-bold text-gray-800 mb-1">Total Grand Marks</div>
                      <div className="text-xs text-gray-600 px-3 py-1 rounded-full"
                           style={{ backgroundColor: `${currentTeam?.color}15` }}>
                        Arts + Sports combined
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border"
                     style={{ borderColor: `${currentTeam?.color}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Points Distribution</span>
                    <span className="text-xs text-gray-500">{totalPoints} total points</span>
                  </div>
                  <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-1000"
                      style={{ 
                        width: totalPoints > 0 ? `${(pointsBreakdown.artsPoints / totalPoints) * 100}%` : '0%'
                      }}
                    />
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000"
                      style={{ 
                        width: totalPoints > 0 ? `${(pointsBreakdown.sportsPoints / totalPoints) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-purple-600 font-medium">
                      Arts: {totalPoints > 0 ? Math.round((pointsBreakdown.artsPoints / totalPoints) * 100) : 0}%
                    </span>
                    <span className="text-green-600 font-medium">
                      Sports: {totalPoints > 0 ? Math.round((pointsBreakdown.sportsPoints / totalPoints) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}   
     {/* Marks Summary Tab - Fixed to show published grand marks exactly */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Team Performance Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                  <span className="mr-2">📊</span>
                  Team {teamCode} Performance Summary
                </h3>
                <div className="text-sm text-blue-700">
                  Based on all published results
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Team Highlights:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• {firstPlaces} First Place wins</li>
                    <li>• {firstPlaces + secondPlaces + thirdPlaces} Total podium finishes</li>
                    <li>• {totalResults} Programme participations</li>
                    <li>• {totalPoints} Total points earned</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Performance Metrics:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Win Rate: {totalResults > 0 ? Math.round((firstPlaces / totalResults) * 100) : 0}%</li>
                    <li>• Podium Rate: {totalResults > 0 ? Math.round(((firstPlaces + secondPlaces + thirdPlaces) / totalResults) * 100) : 0}%</li>
                    <li>• Avg Points/Programme: {totalResults > 0 ? Math.round(totalPoints / totalResults) : 0}</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Team Status:</h4>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: currentTeam?.color || '#6366f1' }}
                    ></div>
                    <span className="text-blue-700 font-medium">{currentTeam?.name || `Team ${teamCode}`}</span>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    Competing in {new Set(teamResults.map(r => r.section)).size} sections
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Marks Summary Dashboard - Shows ALL published results with team highlighting */}
            <MarksSummary 
              results={allResults.filter(r => r.status === 'published')} 
              showDailyProgress={true}
              teamCode={teamCode || undefined}
              highlightTeam={true}
            />
          </div>
        )}     
   {/* Results List - Only show for team and all tabs */}
        {(activeTab === 'team' || activeTab === 'all') && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'team' ? 'Team Results' : 'All Published Results'}
                </h2>
                <span className="text-sm text-gray-500">
                  {displayResults.length} results found
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {displayResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🏅</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {activeTab === 'team' ? 'No Team Results Yet' : 'No Results Found'}
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'team' 
                      ? 'Results will appear here once your team participates in competitions.' 
                      : 'Try adjusting your filters or check back later for new results.'}
                  </p>
                </div>
              ) : (
                displayResults.map((result) => {
                  const programmeDetails = getProgrammeDetails(result);
                  
                  // For team results, filter to show only team members
                  const teamFirstPlace = (result.firstPlace || []).filter(w => 
                    candidates.some(c => c.chestNumber === w.chestNumber)
                  );
                  const teamSecondPlace = (result.secondPlace || []).filter(w => 
                    candidates.some(c => c.chestNumber === w.chestNumber)
                  );
                  const teamThirdPlace = (result.thirdPlace || []).filter(w => 
                    candidates.some(c => c.chestNumber === w.chestNumber)
                  );

                  // Check for team-level results
                  const teamFirstPlaceTeams = (result.firstPlaceTeams || []).filter(t => t.teamCode === teamCode);
                  const teamSecondPlaceTeams = (result.secondPlaceTeams || []).filter(t => t.teamCode === teamCode);
                  const teamThirdPlaceTeams = (result.thirdPlaceTeams || []).filter(t => t.teamCode === teamCode);

                  return (
                    <div key={result._id?.toString()} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {programmeDetails.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                programmeDetails.category === 'arts' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : programmeDetails.category === 'sports'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {programmeDetails.category === 'arts' ? '🎨' : programmeDetails.category === 'sports' ? '🏃' : '📋'} {programmeDetails.category}
                              </span>
                              {programmeDetails.subcategory && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {programmeDetails.subcategory}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 capitalize">
                            {result.section.replace('-', ' ')} • {result.positionType}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-sm bg-gray-100 px-3 py-1 rounded-full font-mono">
                            {result.programme}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>     
                 <div className="space-y-3">
                        {/* Team-level first place */}
                        {teamFirstPlaceTeams.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('first').class}`}>
                              {getPositionBadge('first').icon} 1st Place (Team)
                            </span>
                            <span className="text-sm bg-yellow-50 px-3 py-1 rounded border border-yellow-200 font-medium">
                              Team {teamCode}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.firstPoints} points
                            </span>
                          </div>
                        )}

                        {/* Individual first place */}
                        {teamFirstPlace.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('first').class}`}>
                              {getPositionBadge('first').icon} 1st Place
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {teamFirstPlace.map((winner, index) => {
                                const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                return (
                                  <span key={index} className="text-sm bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                    {winner.chestNumber} - {candidate?.name || 'Unknown'}
                                    {winner.grade && (
                                      <span className="ml-1 text-xs text-yellow-700">({winner.grade})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.firstPoints} points
                            </span>
                          </div>
                        )}

                        {/* Team-level second place */}
                        {teamSecondPlaceTeams.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('second').class}`}>
                              {getPositionBadge('second').icon} 2nd Place (Team)
                            </span>
                            <span className="text-sm bg-gray-50 px-3 py-1 rounded border border-gray-200 font-medium">
                              Team {teamCode}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.secondPoints} points
                            </span>
                          </div>
                        )}

                        {/* Individual second place */}
                        {teamSecondPlace.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('second').class}`}>
                              {getPositionBadge('second').icon} 2nd Place
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {teamSecondPlace.map((winner, index) => {
                                const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                return (
                                  <span key={index} className="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                    {winner.chestNumber} - {candidate?.name || 'Unknown'}
                                    {winner.grade && (
                                      <span className="ml-1 text-xs text-gray-600">({winner.grade})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.secondPoints} points
                            </span>
                          </div>
                        )}      
                  {/* Team-level third place */}
                        {teamThirdPlaceTeams.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('third').class}`}>
                              {getPositionBadge('third').icon} 3rd Place (Team)
                            </span>
                            <span className="text-sm bg-orange-50 px-3 py-1 rounded border border-orange-200 font-medium">
                              Team {teamCode}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.thirdPoints} points
                            </span>
                          </div>
                        )}

                        {/* Individual third place */}
                        {teamThirdPlace.length > 0 && (
                          <div className="flex items-center space-x-3 flex-wrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPositionBadge('third').class}`}>
                              {getPositionBadge('third').icon} 3rd Place
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {teamThirdPlace.map((winner, index) => {
                                const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                return (
                                  <span key={index} className="text-sm bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                    {winner.chestNumber} - {candidate?.name || 'Unknown'}
                                    {winner.grade && (
                                      <span className="ml-1 text-xs text-orange-700">({winner.grade})</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              +{result.thirdPoints} points
                            </span>
                          </div>
                        )}

                        {/* Show all results for "All Results" tab */}
                        {activeTab === 'all' && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">All Winners:</h4>
                            <div className="space-y-2 text-sm">
                              {(result.firstPlace || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-yellow-700">🥇 1st: </span>
                                  {(result.firstPlace || []).map(w => `${w.chestNumber}${w.grade ? ` (${w.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                              {(result.secondPlace || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">🥈 2nd: </span>
                                  {(result.secondPlace || []).map(w => `${w.chestNumber}${w.grade ? ` (${w.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                              {(result.thirdPlace || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-orange-700">🥉 3rd: </span>
                                  {(result.thirdPlace || []).map(w => `${w.chestNumber}${w.grade ? ` (${w.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                              {(result.firstPlaceTeams || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-yellow-700">🥇 Teams: </span>
                                  {(result.firstPlaceTeams || []).map(t => `${t.teamCode}${t.grade ? ` (${t.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                              {(result.secondPlaceTeams || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">🥈 Teams: </span>
                                  {(result.secondPlaceTeams || []).map(t => `${t.teamCode}${t.grade ? ` (${t.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                              {(result.thirdPlaceTeams || []).length > 0 && (
                                <div>
                                  <span className="font-medium text-orange-700">🥉 Teams: </span>
                                  {(result.thirdPlaceTeams || []).map(t => `${t.teamCode}${t.grade ? ` (${t.grade})` : ''}`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>  
                    {result.notes && (
                        <div className="mt-4 p-3 rounded-lg border"
                             style={{ 
                               backgroundColor: `${currentTeam?.color || '#6366f1'}10`,
                               borderColor: `${currentTeam?.color || '#6366f1'}40`
                             }}>
                          <p className="text-sm" style={{ color: currentTeam?.color || '#6366f1' }}>
                            <span className="font-medium">📝 Notes: </span>
                            {result.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </ShowcaseSection>
    </div>
  );
}
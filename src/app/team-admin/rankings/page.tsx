'use client';

import { useState, useEffect } from 'react';
import { Result, Candidate, Programme, Team } from '@/types';
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { getGradePoints } from '@/utils/markingSystem';
import { useTeamAdmin } from '@/contexts/TeamAdminContext';

interface TeamRanking {
  teamCode: string;
  name: string;
  color: string;
  totalPoints: number;
  artsPoints: number;
  sportsPoints: number;
  totalResults: number;
  artsResults: number;
  sportsResults: number;
  firstPlaces: number;
  secondPlaces: number;
  thirdPlaces: number;
  rank: number;
}

export default function TeamRankingsPage() {
  const { teamCode } = useTeamAdmin();
  
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'arts' | 'sports'>('all');
  const [rankings, setRankings] = useState<TeamRanking[]>([]);

  useEffect(() => {
    if (teamCode && teamCode !== 'Loading...') {
      fetchData();
    }
  }, [teamCode]);

  useEffect(() => {
    if (allResults.length > 0 && teams.length > 0) {
      calculateRankings();
    }
  }, [allResults, teams, programmes, activeCategory]);

  const fetchData = async () => {
    if (!teamCode || teamCode === 'Loading...') {
      return;
    }

    try {
      console.log('🚀 Fetching rankings data for team:', teamCode);
      
      const [resultsRes, candidatesRes, programmesRes, teamsRes] = await Promise.all([
        fetch('/api/team-admin/results?status=published'),
        fetch(`/api/team-admin/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch('/api/teams')
      ]);

      const [resultsData, candidatesData, programmesData, teamsData] = await Promise.all([
        resultsRes.ok ? resultsRes.json() : [],
        candidatesRes.ok ? candidatesRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        teamsRes.ok ? teamsRes.json() : []
      ]);

      setAllResults(Array.isArray(resultsData) ? resultsData : []);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (error) {
      console.error('💥 Error fetching rankings data:', error);
      setAllResults([]);
      setCandidates([]);
      setProgrammes([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRankings = () => {
    const teamStats: { [teamCode: string]: TeamRanking } = {};
    
    // Initialize all teams
    teams.forEach(team => {
      teamStats[team.code] = {
        teamCode: team.code,
        name: team.name,
        color: team.color || '#6366f1',
        totalPoints: 0,
        artsPoints: 0,
        sportsPoints: 0,
        totalResults: 0,
        artsResults: 0,
        sportsResults: 0,
        firstPlaces: 0,
        secondPlaces: 0,
        thirdPlaces: 0,
        rank: 0
      };
    });

    // Process all published results
    const publishedResults = allResults.filter(r => r.status === 'published');
    
    publishedResults.forEach(result => {
      const programme = programmes.find(p => 
        p._id?.toString() === result.programmeId?.toString() ||
        p.id?.toString() === result.programmeId?.toString()
      );
      
      const isArts = programme?.category === 'arts';
      const isSports = programme?.category === 'sports';
      
      // Skip if filtering by category and this result doesn't match
      if (activeCategory === 'arts' && !isArts) return;
      if (activeCategory === 'sports' && !isSports) return;

      // Helper function to add points to team
      const addPointsToTeam = (teamCode: string, points: number, position: number) => {
        if (teamStats[teamCode]) {
          teamStats[teamCode].totalPoints += points;
          teamStats[teamCode].totalResults += 1;
          
          if (isArts) {
            teamStats[teamCode].artsPoints += points;
            teamStats[teamCode].artsResults += 1;
          } else if (isSports) {
            teamStats[teamCode].sportsPoints += points;
            teamStats[teamCode].sportsResults += 1;
          }
          
          if (position === 1) teamStats[teamCode].firstPlaces += 1;
          else if (position === 2) teamStats[teamCode].secondPlaces += 1;
          else if (position === 3) teamStats[teamCode].thirdPlaces += 1;
        }
      };

      // Process team results
      if (result.firstPlaceTeams) {
        result.firstPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          addPointsToTeam(winner.teamCode, result.firstPoints + gradePoints, 1);
        });
      }
      
      if (result.secondPlaceTeams) {
        result.secondPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          addPointsToTeam(winner.teamCode, result.secondPoints + gradePoints, 2);
        });
      }
      
      if (result.thirdPlaceTeams) {
        result.thirdPlaceTeams.forEach(winner => {
          const gradePoints = getGradePoints(winner.grade || '');
          addPointsToTeam(winner.teamCode, result.thirdPoints + gradePoints, 3);
        });
      }

      // Process individual results - map chest numbers to teams
      const processIndividualResults = (winners: any[], points: number, position: number) => {
        winners.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamCode) {
            const gradePoints = getGradePoints(winner.grade || '');
            addPointsToTeam(teamCode, points + gradePoints, position);
          }
        });
      };

      if (result.firstPlace) processIndividualResults(result.firstPlace, result.firstPoints, 1);
      if (result.secondPlace) processIndividualResults(result.secondPlace, result.secondPoints, 2);
      if (result.thirdPlace) processIndividualResults(result.thirdPlace, result.thirdPoints, 3);
    });

    // Convert to array and sort by points
    const rankingsArray = Object.values(teamStats)
      .filter(team => team.totalPoints > 0 || team.totalResults > 0) // Show teams with activity
      .sort((a, b) => {
        if (activeCategory === 'arts') return b.artsPoints - a.artsPoints;
        if (activeCategory === 'sports') return b.sportsPoints - a.sportsPoints;
        return b.totalPoints - a.totalPoints;
      })
      .map((team, index) => ({ ...team, rank: index + 1 }));

    setRankings(rankingsArray);
  };

  const getTeamCodeFromChestNumber = (chestNumber: string) => {
    if (!chestNumber) return '';
    
    const upperChestNumber = chestNumber.toUpperCase();
    
    // Try three letter match first
    const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
    if (threeLetterMatch) {
      return threeLetterMatch[1];
    }
    
    // Try two letter match
    const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
    if (twoLetterMatch) {
      const teamCode = twoLetterMatch[1];
      if (teamCode === 'SM') return 'SMD';
      if (teamCode === 'IN') return 'INT';
      if (teamCode === 'AQ') return 'AQS';
      return teamCode;
    }
    
    // Try single letter
    if (upperChestNumber.match(/^[A-Z]/)) {
      return upperChestNumber.charAt(0);
    }
    
    // Try numeric ranges
    const num = parseInt(chestNumber);
    if (!isNaN(num)) {
      if (num >= 600 && num < 700) return 'AQS';
      if (num >= 400 && num < 500) return 'INT';
      if (num >= 200 && num < 300) return 'SMD';
      if (num >= 100 && num < 200) return 'A';
    }
    
    return '';
  };

  const currentTeam = teams.find(t => t.code === teamCode);
  const currentTeamRanking = rankings.find(r => r.teamCode === teamCode);

  const displayTeamCode = teamCode || 'Loading...';

  return (
    <div className="space-y-6">
      <ShowcaseSection title="Team Rankings">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl p-8 text-white mb-6"
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Team Rankings</h1>
                <p className="text-white/90 text-lg">Live standings based on all published results</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-4xl">📈</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === 'all'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeCategory === 'all' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            🏆 Overall Rankings
          </button>
          <button
            onClick={() => setActiveCategory('arts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === 'arts'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeCategory === 'arts' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            🎨 Arts Rankings
          </button>
          <button
            onClick={() => setActiveCategory('sports')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === 'sports'
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeCategory === 'sports' ? currentTeam?.color || '#6366f1' : 'transparent'
            }}
          >
            🏃 Sports Rankings
          </button>
        </div>

        {/* Current Team Highlight */}
        {currentTeamRanking && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 rounded-xl p-6 mb-6"
               style={{ borderColor: `${currentTeam?.color}40` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                     style={{ backgroundColor: currentTeam?.color || '#6366f1' }}>
                  #{currentTeamRanking.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Team {teamCode}</h3>
                  <p className="text-gray-600">{currentTeam?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: currentTeam?.color || '#6366f1' }}>
                  {activeCategory === 'arts' ? currentTeamRanking.artsPoints : 
                   activeCategory === 'sports' ? currentTeamRanking.sportsPoints : 
                   currentTeamRanking.totalPoints}
                </div>
                <p className="text-sm text-gray-600">
                  {activeCategory === 'arts' ? 'Arts Points' : 
                   activeCategory === 'sports' ? 'Sports Points' : 
                   'Total Points'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rankings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeCategory === 'arts' ? '🎨 Arts Rankings' : 
               activeCategory === 'sports' ? '🏃 Sports Rankings' : 
               '🏆 Overall Rankings'}
            </h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rankings Available</h3>
              <p className="text-gray-500">Rankings will appear once results are published.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rankings.map((team, index) => {
                const isCurrentTeam = team.teamCode === teamCode;
                const points = activeCategory === 'arts' ? team.artsPoints : 
                              activeCategory === 'sports' ? team.sportsPoints : 
                              team.totalPoints;
                const results = activeCategory === 'arts' ? team.artsResults : 
                               activeCategory === 'sports' ? team.sportsResults : 
                               team.totalResults;
                
                return (
                  <div key={team.teamCode} 
                       className={`p-6 hover:bg-gray-50 transition-colors ${
                         isCurrentTeam ? 'bg-blue-50 border-l-4' : ''
                       }`}
                       style={{ 
                         borderLeftColor: isCurrentTeam ? team.color : 'transparent'
                       }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          team.rank === 1 ? 'bg-yellow-500' :
                          team.rank === 2 ? 'bg-gray-400' :
                          team.rank === 3 ? 'bg-orange-500' : ''
                        }`}
                        style={{ 
                          backgroundColor: team.rank > 3 ? team.color : undefined
                        }}>
                          {team.rank === 1 ? '🥇' : 
                           team.rank === 2 ? '🥈' : 
                           team.rank === 3 ? '🥉' : 
                           `#${team.rank}`}
                        </div>
                        
                        {/* Team Info */}
                        <div>
                          <h3 className={`text-lg font-semibold ${isCurrentTeam ? 'text-blue-900' : 'text-gray-900'}`}>
                            Team {team.teamCode}
                          </h3>
                          <p className={`text-sm ${isCurrentTeam ? 'text-blue-700' : 'text-gray-600'}`}>
                            {team.name}
                          </p>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isCurrentTeam ? 'text-blue-900' : 'text-gray-900'}`}>
                          {points}
                        </div>
                        <p className={`text-sm ${isCurrentTeam ? 'text-blue-700' : 'text-gray-600'}`}>
                          {results} results
                        </p>
                      </div>
                    </div>
                    
                    {/* Detailed Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-yellow-600">{team.firstPlaces}</div>
                        <div className="text-gray-600">🥇 First</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-600">{team.secondPlaces}</div>
                        <div className="text-gray-600">🥈 Second</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-orange-600">{team.thirdPlaces}</div>
                        <div className="text-gray-600">🥉 Third</div>
                      </div>
                    </div>
                    
                    {/* Category Breakdown for Overall Rankings */}
                    {activeCategory === 'all' && (
                      <div className="mt-4 flex justify-between text-xs">
                        <span className="text-purple-600">
                          🎨 Arts: {team.artsPoints} pts ({team.artsResults} results)
                        </span>
                        <span className="text-green-600">
                          🏃 Sports: {team.sportsPoints} pts ({team.sportsResults} results)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ShowcaseSection>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Team, EnhancedResult, Candidate, Programme } from '@/types';
import { getGradePoints } from '@/utils/markingSystem';

interface PublicRankingsProps {
  className?: string;
}

export default function PublicRankings({ className = '' }: PublicRankingsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [publishedResults, setPublishedResults] = useState<EnhancedResult[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced state for new features
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
  
  // Filters for Top Performers
  const [sectionFilter, setSectionFilter] = useState<'all' | 'senior' | 'junior' | 'sub-junior'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'all-arts' | 'arts-stage' | 'arts-non-stage' | 'sports'>('all');
  
  // Filters for Team Rankings
  const [teamRankingType, setTeamRankingType] = useState<'general' | 'group'>('general');
  
  // Expanded states for collapsible dropdowns
  const [expandedPerformers, setExpandedPerformers] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Fetch data from APIs - using published results
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [teamsRes, publishedRes, candidatesRes, programmesRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/results/status?status=published'),
        fetch('/api/candidates'),
        fetch('/api/programmes')
      ]);

      const [teamsData, publishedData, candidatesData, programmesData] = await Promise.all([
        teamsRes.json(),
        publishedRes.json(),
        candidatesRes.json(),
        programmesRes.json()
      ]);

      // Enrich published results with programme information
      const enrichedResults = publishedData.map((result: EnhancedResult) => {
        const programme = programmesData.find((p: Programme) => {
          const programmeIdStr = p._id?.toString();
          const resultProgrammeIdStr = result.programmeId?.toString();
          return programmeIdStr === resultProgrammeIdStr;
        });
        
        return {
          ...result,
          programmeName: programme?.name,
          programmeCode: programme?.code,
          programmeCategory: programme?.category,
          programmeSection: programme?.section,
          programmeSubcategory: programme?.subcategory,
          programmePositionType: programme?.positionType
        };
      });

      setTeams(teamsData || []);
      setPublishedResults(enrichedResults || []);
      setCandidates(candidatesData || []);
      setProgrammes(programmesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load rankings data');
      setTeams([]);
      setPublishedResults([]);
      setCandidates([]);
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get top individual performers
  const getTopPerformers = () => {
    if (!publishedResults || publishedResults.length === 0) return [];

    const performerScores: { [key: string]: { 
      totalMarks: number; 
      programs: any[];
      candidate?: Candidate;
    } } = {};

    publishedResults
      .filter(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.positionType === 'individual';
      })
      .forEach(result => {
        // Filter by category if specified
        if (categoryFilter !== 'all') {
          if (categoryFilter === 'sports' && result.programmeCategory !== 'sports') return;
          if (categoryFilter === 'all-arts' && result.programmeCategory !== 'arts') return;
          if (categoryFilter === 'arts-stage' && (result.programmeCategory !== 'arts' || result.programmeSubcategory !== 'stage')) return;
          if (categoryFilter === 'arts-non-stage' && (result.programmeCategory !== 'arts' || result.programmeSubcategory !== 'non-stage')) return;
        }

        // Process winners
        [
          { winners: result.firstPlace, points: result.firstPoints || 0, position: 'first' },
          { winners: result.secondPlace, points: result.secondPoints || 0, position: 'second' },
          { winners: result.thirdPlace, points: result.thirdPoints || 0, position: 'third' }
        ].forEach(({ winners, points, position }) => {
          winners?.forEach(winner => {
            const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
            
            // Filter by section if specified
            if (sectionFilter !== 'all' && candidate?.section !== sectionFilter) return;

            if (!performerScores[winner.chestNumber]) {
              performerScores[winner.chestNumber] = { totalMarks: 0, programs: [], candidate };
            }
            
            const totalPoints = points + (winner.grade ? getGradePoints(winner.grade) : 0);
            performerScores[winner.chestNumber].totalMarks += totalPoints;
            performerScores[winner.chestNumber].programs.push({
              programmeId: result.programmeId,
              programmeName: result.programmeName,
              programmeCode: result.programmeCode,
              section: result.section,
              category: result.programmeCategory,
              subcategory: result.programmeSubcategory,
              totalMarks: totalPoints,
              position,
              grade: winner.grade
            });
          });
        });
      });

    return Object.entries(performerScores)
      .map(([chestNumber, data]) => ({
        chestNumber,
        totalMarks: data.totalMarks,
        programmeResults: data.programs,
        candidate: data.candidate
      }))
      .filter(performer => performer.totalMarks > 0)
      .sort((a, b) => b.totalMarks - a.totalMarks)
      .slice(0, 20);
  };

  // Get team rankings
  const getTeamRankings = () => {
    if (!publishedResults || !teams) return [];

    const teamTotals = teams.map(team => {
      let totalMarks = 0;
      let programmeBreakdown: any[] = [];
      
      // Filter published results by team ranking type
      const teamResults = publishedResults.filter(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
        return programme && programme.positionType === teamRankingType;
      });
      
      teamResults.forEach(result => {
        let teamMarksFromResult = 0;
        let position = '';
        let grade = '';
        
        // Check team-specific properties
        const firstPlaceTeam = result.firstPlaceTeams?.find(t => t.teamCode === team.code);
        if (firstPlaceTeam) {
          teamMarksFromResult += result.firstPoints || 0;
          if (firstPlaceTeam.grade) {
            teamMarksFromResult += getGradePoints(firstPlaceTeam.grade);
            grade = firstPlaceTeam.grade;
          }
          position = 'first';
        }
        
        const secondPlaceTeam = result.secondPlaceTeams?.find(t => t.teamCode === team.code);
        if (secondPlaceTeam) {
          teamMarksFromResult += result.secondPoints || 0;
          if (secondPlaceTeam.grade) {
            teamMarksFromResult += getGradePoints(secondPlaceTeam.grade);
            grade = secondPlaceTeam.grade;
          }
          position = 'second';
        }
        
        const thirdPlaceTeam = result.thirdPlaceTeams?.find(t => t.teamCode === team.code);
        if (thirdPlaceTeam) {
          teamMarksFromResult += result.thirdPoints || 0;
          if (thirdPlaceTeam.grade) {
            teamMarksFromResult += getGradePoints(thirdPlaceTeam.grade);
            grade = thirdPlaceTeam.grade;
          }
          position = 'third';
        }

        // Fallback: Check individual results for team members
        if (teamMarksFromResult === 0) {
          const teamMembers = candidates.filter(c => c.team === team.code);
          
          [
            { winners: result.firstPlace, points: result.firstPoints || 0, pos: 'first' },
            { winners: result.secondPlace, points: result.secondPoints || 0, pos: 'second' },
            { winners: result.thirdPlace, points: result.thirdPoints || 0, pos: 'third' }
          ].forEach(({ winners, points, pos }) => {
            winners?.forEach(winner => {
              const isTeamMember = teamMembers.some(member => member.chestNumber === winner.chestNumber);
              if (isTeamMember) {
                teamMarksFromResult += points + (winner.grade ? getGradePoints(winner.grade) : 0);
                if (!position) position = pos;
                if (!grade && winner.grade) grade = winner.grade;
              }
            });
          });
        }
        
        if (teamMarksFromResult > 0) {
          totalMarks += teamMarksFromResult;
          programmeBreakdown.push({
            programmeId: result.programmeId,
            programmeName: result.programmeName,
            programmeCode: result.programmeCode,
            section: result.section,
            category: result.programmeCategory,
            subcategory: result.programmeSubcategory,
            totalMarks: teamMarksFromResult,
            position,
            grade
          });
        }
      });
      
      return {
        team,
        totalMarks,
        programmeBreakdown,
        rank: 0
      };
    })
    .filter(team => team.totalMarks > 0)
    .sort((a, b) => b.totalMarks - a.totalMarks)
    .map((team, index) => ({ ...team, rank: index + 1 }));

    return teamTotals;
  };
  
  const togglePerformerExpansion = (chestNumber: string) => {
    const newExpanded = new Set(expandedPerformers);
    if (newExpanded.has(chestNumber)) {
      newExpanded.delete(chestNumber);
    } else {
      newExpanded.add(chestNumber);
    }
    setExpandedPerformers(newExpanded);
  };
  
  const toggleTeamExpansion = (teamCode: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamCode)) {
      newExpanded.delete(teamCode);
    } else {
      newExpanded.add(teamCode);
    }
    setExpandedTeams(newExpanded);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Rankings</h3>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const topPerformers = getTopPerformers();
  const teamRankings = getTeamRankings();

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🏆 Competition Rankings</h2>
            <p className="text-gray-600">Live rankings based on published results</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Rankings</span>
          </div>
        </div>

        {/* Title for Top Performers Only */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">🌟 Top Performers</h3>
          <p className="text-sm text-gray-600">Individual competition champions and high achievers</p>
        </div>
      </div>

      {/* Content - Individual Rankings Only */}
      <div className="p-6">
        <div>
            {/* Individual Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sections</option>
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
                <option value="sub-junior">Sub-Junior</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="all-arts">🎨 All Arts</option>
                <option value="arts-stage">🎭 Arts Stage</option>
                <option value="arts-non-stage">📝 Arts Non-Stage</option>
                <option value="sports">⚽ Sports</option>
              </select>
              <span className="text-sm text-gray-500">
                {topPerformers.length} top performers
              </span>
            </div>

            {/* Top Performers */}
            {topPerformers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Individual Rankings Available</h3>
                <p className="text-gray-500">
                  Individual performer rankings will appear here once individual programme results are published.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((performer, index) => {
                  const team = teams.find(t => t.code === performer.candidate?.team);
                  return (
                    <motion.div
                      key={performer.chestNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-xl p-4 hover:shadow-md transition-all duration-200"
                      style={{ borderLeftColor: team?.color || '#6b7280', borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl font-bold text-gray-400">
                              #{index + 1}
                            </div>
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                              style={{ backgroundColor: team?.color || '#6b7280' }}
                            >
                              {team?.code || '?'}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">
                                {performer.candidate?.name || 'Unknown Participant'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                #{performer.chestNumber} • {team?.name || 'Unknown Team'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: team?.color || '#6b7280' }}>
                              {performer.totalMarks}
                            </div>
                            <div className="text-sm text-gray-500">Total Points</div>
                          </div>
                          <button
                            onClick={() => togglePerformerExpansion(performer.chestNumber)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg 
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedPerformers.has(performer.chestNumber) ? 'rotate-180' : ''
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Programme Results */}
                      {expandedPerformers.has(performer.chestNumber) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">Programme Results:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {performer.programmeResults.map((programme, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 text-sm">
                                      {programme.programmeName}
                                    </h5>
                                    <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                                      <span className={`px-2 py-1 rounded-full ${
                                        programme.category === 'arts' 
                                          ? 'bg-purple-100 text-purple-700' 
                                          : 'bg-green-100 text-green-700'
                                      }`}>
                                        {programme.category === 'arts' ? '🎨' : '⚽'} {programme.category}
                                      </span>
                                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                        {programme.section}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="font-bold text-lg" style={{ color: team?.color || '#6b7280' }}>
                                      {programme.totalMarks}
                                    </div>
                                    <div className="text-xs text-gray-500">points</div>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      programme.position === 'first' ? 'bg-yellow-100 text-yellow-800' :
                                      programme.position === 'second' ? 'bg-gray-100 text-gray-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {programme.position === 'first' ? '🥇 1st' :
                                       programme.position === 'second' ? '🥈 2nd' : '🥉 3rd'} Place
                                    </span>
                                    {programme.grade && (
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                        Grade: {programme.grade}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 font-mono">
                                    {programme.programmeCode}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
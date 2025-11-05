'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Team, Result, Candidate, Programme, EnhancedResult } from '@/types';
import { getGradePoints } from '@/utils/markingSystem';

export default function RankingsPage() {
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
  
  // Filters for Team Rankings (removed individual, only general and group)
  const [teamRankingType, setTeamRankingType] = useState<'general' | 'group'>('general');
  
  // Expanded states for collapsible dropdowns
  const [expandedPerformers, setExpandedPerformers] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // Fetch data from APIs - using published results from checklist
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

  // Enhanced filtering and ranking functions using published results
  const getTopPerformers = () => {
    if (!publishedResults || publishedResults.length === 0) return [];

    // Calculate individual performer scores from published results
    const performerScores: { [key: string]: { 
      totalMarks: number; 
      programs: any[];
      candidate?: Candidate;
    } } = {};

    // Process only individual programs from published results
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

        // Process first place winners
        result.firstPlace?.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          
          // Filter by section if specified
          if (sectionFilter !== 'all' && candidate?.section !== sectionFilter) return;

          if (!performerScores[winner.chestNumber]) {
            performerScores[winner.chestNumber] = { totalMarks: 0, programs: [], candidate };
          }
          
          const points = (result.firstPoints || 0) + (winner.grade ? getGradePoints(winner.grade) : 0);
          performerScores[winner.chestNumber].totalMarks += points;
          performerScores[winner.chestNumber].programs.push({
            programmeId: result.programmeId,
            programmeName: result.programmeName,
            programmeCode: result.programmeCode,
            section: result.section,
            category: result.programmeCategory,
            subcategory: result.programmeSubcategory,
            totalMarks: points,
            position: 'first',
            grade: winner.grade
          });
        });

        // Process second place winners
        result.secondPlace?.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          
          // Filter by section if specified
          if (sectionFilter !== 'all' && candidate?.section !== sectionFilter) return;

          if (!performerScores[winner.chestNumber]) {
            performerScores[winner.chestNumber] = { totalMarks: 0, programs: [], candidate };
          }
          
          const points = (result.secondPoints || 0) + (winner.grade ? getGradePoints(winner.grade) : 0);
          performerScores[winner.chestNumber].totalMarks += points;
          performerScores[winner.chestNumber].programs.push({
            programmeId: result.programmeId,
            programmeName: result.programmeName,
            programmeCode: result.programmeCode,
            section: result.section,
            category: result.programmeCategory,
            subcategory: result.programmeSubcategory,
            totalMarks: points,
            position: 'second',
            grade: winner.grade
          });
        });

        // Process third place winners
        result.thirdPlace?.forEach(winner => {
          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
          
          // Filter by section if specified
          if (sectionFilter !== 'all' && candidate?.section !== sectionFilter) return;

          if (!performerScores[winner.chestNumber]) {
            performerScores[winner.chestNumber] = { totalMarks: 0, programs: [], candidate };
          }
          
          const points = (result.thirdPoints || 0) + (winner.grade ? getGradePoints(winner.grade) : 0);
          performerScores[winner.chestNumber].totalMarks += points;
          performerScores[winner.chestNumber].programs.push({
            programmeId: result.programmeId,
            programmeName: result.programmeName,
            programmeCode: result.programmeCode,
            section: result.section,
            category: result.programmeCategory,
            subcategory: result.programmeSubcategory,
            totalMarks: points,
            position: 'third',
            grade: winner.grade
          });
        });
      });

    // Convert to array and sort by total marks
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

  const getTeamRankings = () => {
    if (!publishedResults || !teams) return [];

    console.log('🔍 Debug Team Rankings:');
    console.log('- publishedResults count:', publishedResults.length);
    console.log('- teams count:', teams.length);
    console.log('- teamRankingType:', teamRankingType);
    console.log('- programmes count:', programmes.length);

    const teamTotals = teams.map(team => {
      const teamMembers = candidates.filter(c => c.team === team.code);
      
      let totalMarks = 0;
      let programmeBreakdown: any[] = [];
      
      // Filter published results by team ranking type (general or group only)
      const teamResults = publishedResults.filter(result => {
        const programme = programmes.find(p => p._id?.toString() === result.programmeId?.toString());
        const matches = programme && programme.positionType === teamRankingType;
        if (programme) {
          console.log(`🔍 Programme: ${programme.name}, positionType: ${programme.positionType}, matches: ${matches}`);
        }
        return matches;
      });
      
      console.log(`🔍 Team ${team.code}: Found ${teamResults.length} matching results`);
      
      teamResults.forEach(result => {
        console.log(`🔍 Processing result for team ${team.code}:`, {
          programmeId: result.programmeId,
          hasFirstPlaceTeams: !!result.firstPlaceTeams,
          hasSecondPlaceTeams: !!result.secondPlaceTeams,
          hasThirdPlaceTeams: !!result.thirdPlaceTeams,
          hasFirstPlace: !!result.firstPlace,
          hasSecondPlace: !!result.secondPlace,
          hasThirdPlace: !!result.thirdPlace,
          allKeys: Object.keys(result)
        });
        
        // Calculate team marks from this result
        let teamMarksFromResult = 0;
        let position = '';
        let grade = '';
        
        // Method 1: Check team-specific properties (for general/group programs)
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
        
        // Method 2: Fallback - Check individual results and aggregate by team
        if (teamMarksFromResult === 0) {
          // Check if any team members won in individual results
          const teamMemberChestNumbers = teamMembers.map(m => m.chestNumber);
          
          // First place individual winners from this team
          const firstPlaceFromTeam = result.firstPlace?.filter(winner => 
            teamMemberChestNumbers.includes(winner.chestNumber)
          );
          if (firstPlaceFromTeam && firstPlaceFromTeam.length > 0) {
            firstPlaceFromTeam.forEach(winner => {
              teamMarksFromResult += result.firstPoints || 0;
              if (winner.grade) {
                teamMarksFromResult += getGradePoints(winner.grade);
                grade = winner.grade;
              }
            });
            position = 'first';
          }
          
          // Second place individual winners from this team
          const secondPlaceFromTeam = result.secondPlace?.filter(winner => 
            teamMemberChestNumbers.includes(winner.chestNumber)
          );
          if (secondPlaceFromTeam && secondPlaceFromTeam.length > 0) {
            secondPlaceFromTeam.forEach(winner => {
              teamMarksFromResult += result.secondPoints || 0;
              if (winner.grade) {
                teamMarksFromResult += getGradePoints(winner.grade);
                grade = winner.grade;
              }
            });
            if (!position) position = 'second';
          }
          
          // Third place individual winners from this team
          const thirdPlaceFromTeam = result.thirdPlace?.filter(winner => 
            teamMemberChestNumbers.includes(winner.chestNumber)
          );
          if (thirdPlaceFromTeam && thirdPlaceFromTeam.length > 0) {
            thirdPlaceFromTeam.forEach(winner => {
              teamMarksFromResult += result.thirdPoints || 0;
              if (winner.grade) {
                teamMarksFromResult += getGradePoints(winner.grade);
                grade = winner.grade;
              }
            });
            if (!position) position = 'third';
          }
        }
        
        console.log(`🔍 Team ${team.code} marks from this result: ${teamMarksFromResult}`);
        
        if (teamMarksFromResult > 0) {
          programmeBreakdown.push({
            programme: {
              name: result.programmeName,
              code: result.programmeCode,
              category: result.programmeCategory,
              subcategory: result.programmeSubcategory
            },
            marks: teamMarksFromResult,
            section: result.section,
            position,
            grade
          });
        }
        
        totalMarks += teamMarksFromResult;
      });

      return {
        ...team,
        totalMarks,
        memberCount: teamMembers.length,
        members: teamMembers,
        programmeBreakdown
      };
    });

    const filteredTeams = teamTotals.filter(team => team.totalMarks > 0);
    console.log('🔍 Final team rankings:', filteredTeams.map(t => ({ code: t.code, totalMarks: t.totalMarks })));
    
    return filteredTeams.sort((a, b) => b.totalMarks - a.totalMarks);
  };

  if (error) {
    return (
      <>
        <Breadcrumb pageName="Rankings Dashboard" />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-8">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Rankings Dashboard" />

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'individual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏆 Top Performers
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'team'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏆 Team Rankings
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Performers Tab */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Sections</option>
                    <option value="senior">Senior</option>
                    <option value="junior">Junior</option>
                    <option value="sub-junior">Sub-Junior</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category (Individual Only)</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="all-arts">🎨 All Arts</option>
                    <option value="arts-stage">🎭 Arts Stage</option>
                    <option value="arts-non-stage">📝 Arts Non-Stage</option>
                    <option value="sports">🏃 Sports</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Individual Performers</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading rankings...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTopPerformers().map((performer, index) => {
                    const candidate = performer.candidate || candidates.find(c => c.chestNumber === performer.chestNumber);
                    const team = teams?.find(t => t.code === candidate?.team);
                    const isExpanded = expandedPerformers.has(performer.chestNumber);
                    
                    // All programs are already individual programs from the filtering
                    const individualPrograms = performer.programmeResults || [];
                    
                    return (
                      <div key={performer.chestNumber} className="border border-gray-200 rounded-lg">
                        <div 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => togglePerformerExpansion(performer.chestNumber)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-500' : 
                                'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{candidate?.name || 'Unknown'}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>#{performer.chestNumber}</span>
                                <span>•</span>
                                <span>{candidate?.section}</span>
                                <span>•</span>
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: team?.color || '#6B7280' }}
                                  ></div>
                                  <span>{team?.name || candidate?.team}</span>
                                </div>
                                <span>•</span>
                                <span className="text-blue-600">{individualPrograms.length} programs</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{performer.totalMarks}</div>
                              <div className="text-sm text-gray-500">Total Points</div>
                            </div>
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Collapsible Program Details */}
                        {isExpanded && (
                          <div className="p-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-3">📋 Individual Programs Participated</h5>
                            <div className="space-y-3">
                              {individualPrograms.map((pr: any, prIndex: number) => (
                                <div key={prIndex} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-gray-900">{pr.programmeName}</h6>
                                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{pr.programmeCode}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{pr.section}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          pr.category === 'sports' ? 'bg-green-100 text-green-800' :
                                          pr.subcategory === 'stage' ? 'bg-pink-100 text-pink-800' :
                                          'bg-purple-100 text-purple-800'
                                        }`}>
                                          {pr.category === 'sports' ? '🏃 Sports' :
                                           pr.subcategory === 'stage' ? '🎭 Arts Stage' : '📝 Arts Non-Stage'}
                                        </span>
                                        {pr.grade && (
                                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                            Grade {pr.grade}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="text-lg font-bold text-green-600">{pr.totalMarks}</div>
                                      <div className="text-xs text-gray-500">Points</div>
                                      {pr.position && (
                                        <div className={`text-xs px-2 py-1 rounded mt-1 ${
                                          pr.position === 'first' ? 'bg-yellow-100 text-yellow-800' :
                                          pr.position === 'second' ? 'bg-gray-100 text-gray-800' :
                                          'bg-orange-100 text-orange-800'
                                        }`}>
                                          {pr.position === 'first' ? '🥇 1st' :
                                           pr.position === 'second' ? '🥈 2nd' : '🥉 3rd'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {individualPrograms.length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                <div className="text-2xl mb-2">📋</div>
                                <p>No individual programs found for this candidate.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {getTopPerformers().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">🏆</div>
                      <p>No performers match your filter criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Rankings Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Team Ranking Type Filter */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Ranking Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setTeamRankingType('general')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    teamRankingType === 'general'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏛️</div>
                    <div className="font-semibold">General Programs</div>
                    <div className="text-sm text-gray-600 mt-1">Team-based general competitions</div>
                  </div>
                </button>
                <button
                  onClick={() => setTeamRankingType('group')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    teamRankingType === 'group'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="font-semibold">Group Programs</div>
                    <div className="text-sm text-gray-600 mt-1">Team group performances</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🏆 Team Rankings - {teamRankingType === 'general' ? 'General Programs' : 'Group Programs'}
              </h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading rankings...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTeamRankings().map((team, index) => {
                    const isExpanded = expandedTeams.has(team.code);
                    const hasPrograms = team.programmeBreakdown && team.programmeBreakdown.length > 0;
                    
                    return (
                      <div key={team.code} className="border border-gray-200 rounded-lg">
                        <div 
                          className={`flex items-center justify-between p-4 bg-gray-50 rounded-t-lg ${
                            hasPrograms ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                          }`}
                          onClick={() => hasPrograms && toggleTeamExpansion(team.code)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-500' : 
                                'bg-blue-500'
                              }`}>
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: team.color }}
                              >
                                {team.code}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{team.name}</h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>{team.memberCount} members</span>
                                  {hasPrograms && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600">{team.programmeBreakdown.length} programs</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{team.totalMarks}</div>
                              <div className="text-sm text-gray-500">Total Points</div>
                            </div>
                            {hasPrograms && (
                              <div className="text-gray-400">
                                {isExpanded ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Collapsible Program Details */}
                        {isExpanded && hasPrograms && (
                          <div className="p-4 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-3">
                              📋 {teamRankingType === 'general' ? 'General' : 'Group'} Programs Participated
                            </h5>
                            <div className="space-y-3">
                              {team.programmeBreakdown.map((pb: any, pbIndex: number) => (
                                <div key={pbIndex} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-gray-900">{pb.programme.name}</h6>
                                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{pb.programme.code}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{pb.section}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          pb.programme.category === 'sports' ? 'bg-green-100 text-green-800' :
                                          pb.programme.subcategory === 'stage' ? 'bg-pink-100 text-pink-800' :
                                          'bg-purple-100 text-purple-800'
                                        }`}>
                                          {pb.programme.category === 'sports' ? '🏃 Sports' :
                                           pb.programme.subcategory === 'stage' ? '🎭 Arts Stage' : '📝 Arts Non-Stage'}
                                        </span>
                                        {pb.grade && (
                                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                            Grade {pb.grade}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="text-lg font-bold text-green-600">{pb.marks}</div>
                                      <div className="text-xs text-gray-500">Points</div>
                                      <div className={`text-xs px-2 py-1 rounded mt-1 ${
                                        pb.position === 'first' ? 'bg-yellow-100 text-yellow-800' :
                                        pb.position === 'second' ? 'bg-gray-100 text-gray-800' :
                                        'bg-orange-100 text-orange-800'
                                      }`}>
                                        {pb.position === 'first' ? '🥇 1st' :
                                         pb.position === 'second' ? '🥈 2nd' : '🥉 3rd'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {getTeamRankings().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">🏆</div>
                      <p>No teams have published results for {teamRankingType} programs yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Programme, Result, Team, Candidate } from '@/types';
import { getGradePoints } from '@/utils/markingSystem';

interface CandidateWithResults extends Candidate {
  achievements: {
    artsStage: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade?: string;
      gradePoints: number;
      totalPoints: number;
      section: string;
    }>;
    artsNonStage: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade?: string;
      gradePoints: number;
      totalPoints: number;
      section: string;
    }>;
    sports: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade?: string;
      gradePoints: number;
      totalPoints: number;
      section: string;
    }>;
  };
  totalPoints: {
    artsStage: number;
    artsNonStage: number;
    sports: number;
    total: number;
  };
  totalAchievements: {
    artsStage: number;
    artsNonStage: number;
    sports: number;
    total: number;
  };
  registeredProgrammes: {
    artsStage: number;
    artsNonStage: number;
    sports: number;
    total: number;
  };
}

interface ProgrammeResultsTabsProps {
  className?: string;
}

export default function ProgrammeResultsTabs({ className = '' }: ProgrammeResultsTabsProps) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesWithResults, setCandidatesWithResults] = useState<CandidateWithResults[]>([]);
  const [programmeParticipants, setProgrammeParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'arts-stage' | 'arts-non-stage' | 'sports'>('arts-stage');
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAllCandidates, setShowAllCandidates] = useState<{ [key: string]: boolean }>({
    'arts-stage': false,
    'arts-non-stage': false,
    'sports': false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programmesRes, resultsRes, teamsRes, candidatesRes, participantsRes] = await Promise.all([
        fetch('/api/programmes'),
        fetch('/api/results?teamView=true'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants')
      ]);

      const [programmesData, resultsData, teamsData, candidatesData, participantsData] = await Promise.all([
        programmesRes.json(),
        resultsRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        participantsRes.json()
      ]);

      setProgrammes(programmesData || []);
      setResults(resultsData || []);
      setTeams(teamsData || []);
      setCandidates(candidatesData || []);
      setProgrammeParticipants(participantsData || []);

      // Process candidates with their results and achievements
      processCandidatesWithResults(candidatesData, resultsData, programmesData, participantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processCandidatesWithResults = (
    candidatesData: Candidate[],
    resultsData: Result[],
    programmesData: Programme[],
    participantsData: any[]
  ) => {
    const processedCandidates: CandidateWithResults[] = candidatesData.map(candidate => {
      const achievements = {
        artsStage: [] as any[],
        artsNonStage: [] as any[],
        sports: [] as any[]
      };

      const totalPoints = {
        artsStage: 0,
        artsNonStage: 0,
        sports: 0,
        total: 0
      };

      const registeredProgrammes = {
        artsStage: 0,
        artsNonStage: 0,
        sports: 0,
        total: 0
      };

      // Count registered programmes
      participantsData.forEach(pp => {
        if (pp.participants.includes(candidate.chestNumber)) {
          const programme = programmesData.find(p => p._id?.toString() === pp.programmeId);
          if (programme) {
            if (programme.category === 'arts' && programme.subcategory === 'stage') {
              registeredProgrammes.artsStage++;
            } else if (programme.category === 'arts' && programme.subcategory === 'non-stage') {
              registeredProgrammes.artsNonStage++;
            } else if (programme.category === 'sports') {
              registeredProgrammes.sports++;
            }
            registeredProgrammes.total++;
          }
        }
      });

      // Process results and achievements
      resultsData.forEach(result => {
        const programme = programmesData.find(p => p._id?.toString() === result.programmeId);
        if (!programme) return;

        const checkWinner = (winners: any[], position: 'first' | 'second' | 'third', positionPoints: number) => {
          const winner = winners?.find(w => w.chestNumber === candidate.chestNumber);
          if (winner) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalAchievementPoints = positionPoints + gradePoints;

            const achievement = {
              programmeId: programme._id?.toString() || '',
              programmeName: programme.name,
              programmeCode: programme.code,
              position,
              positionPoints,
              grade: winner.grade,
              gradePoints,
              totalPoints: totalAchievementPoints,
              section: result.section
            };

            if (programme.category === 'arts' && programme.subcategory === 'stage') {
              achievements.artsStage.push(achievement);
              totalPoints.artsStage += totalAchievementPoints;
            } else if (programme.category === 'arts' && programme.subcategory === 'non-stage') {
              achievements.artsNonStage.push(achievement);
              totalPoints.artsNonStage += totalAchievementPoints;
            } else if (programme.category === 'sports') {
              achievements.sports.push(achievement);
              totalPoints.sports += totalAchievementPoints;
            }

            totalPoints.total += totalAchievementPoints;
          }
        };

        // Check all positions
        checkWinner(result.firstPlace || [], 'first', result.firstPoints || 0);
        checkWinner(result.secondPlace || [], 'second', result.secondPoints || 0);
        checkWinner(result.thirdPlace || [], 'third', result.thirdPoints || 0);
      });

      const totalAchievements = {
        artsStage: achievements.artsStage.length,
        artsNonStage: achievements.artsNonStage.length,
        sports: achievements.sports.length,
        total: achievements.artsStage.length + achievements.artsNonStage.length + achievements.sports.length
      };

      return {
        ...candidate,
        achievements,
        totalPoints,
        totalAchievements,
        registeredProgrammes
      };
    });

    setCandidatesWithResults(processedCandidates);
  };

  const getFilteredCandidates = (category: string, subcategory?: string): CandidateWithResults[] => {
    return candidatesWithResults.filter(candidate => {
      // Filter by category achievements
      const hasAchievements = category === 'sports' 
        ? candidate.totalAchievements.sports > 0
        : subcategory === 'stage' 
          ? candidate.totalAchievements.artsStage > 0
          : candidate.totalAchievements.artsNonStage > 0;

      // Apply filters
      const matchesTeam = selectedTeam === 'all' || candidate.team === selectedTeam;
      const matchesSection = selectedSection === 'all' || candidate.section === selectedSection;
      const matchesSearch = !searchTerm || 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.chestNumber.toLowerCase().includes(searchTerm.toLowerCase());

      return hasAchievements && matchesTeam && matchesSection && matchesSearch;
    }).sort((a, b) => {
      // Sort by total points in the current category
      const aPoints = category === 'sports' 
        ? a.totalPoints.sports
        : subcategory === 'stage' 
          ? a.totalPoints.artsStage
          : a.totalPoints.artsNonStage;
      
      const bPoints = category === 'sports' 
        ? b.totalPoints.sports
        : subcategory === 'stage' 
          ? b.totalPoints.artsStage
          : b.totalPoints.artsNonStage;

      return bPoints - aPoints;
    });
  };

  const toggleCandidateExpansion = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };

  const getPositionIcon = (position: 'first' | 'second' | 'third') => {
    switch (position) {
      case 'first': return '🥇';
      case 'second': return '🥈';
      case 'third': return '🥉';
      default: return '🏆';
    }
  };

  const getPositionColor = (position: 'first' | 'second' | 'third') => {
    switch (position) {
      case 'first': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'second': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'third': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const renderCandidateCard = (candidate: CandidateWithResults, category: string, subcategory?: string) => {
    const isExpanded = expandedCandidates.has(candidate._id?.toString() || '');
    const team = teams.find(t => t.code === candidate.team);
    
    const categoryAchievements = category === 'sports' 
      ? candidate.achievements.sports
      : subcategory === 'stage' 
        ? candidate.achievements.artsStage
        : candidate.achievements.artsNonStage;

    const categoryPoints = category === 'sports' 
      ? candidate.totalPoints.sports
      : subcategory === 'stage' 
        ? candidate.totalPoints.artsStage
        : candidate.totalPoints.artsNonStage;

    const categoryRegistrations = category === 'sports' 
      ? candidate.registeredProgrammes.sports
      : subcategory === 'stage' 
        ? candidate.registeredProgrammes.artsStage
        : candidate.registeredProgrammes.artsNonStage;
    
    return (
      <div key={candidate._id?.toString()} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        {/* Candidate Header */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => toggleCandidateExpansion(candidate._id?.toString() || '')}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team?.color || '#6B7280' }}
                >
                  {candidate.chestNumber}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team?.color || '#6B7280' }}
                    ></span>
                    <span>{team?.name || candidate.team}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {candidate.section}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-4 mb-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{categoryAchievements.length}</div>
                  <div className="text-xs text-gray-500">Achievements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{categoryPoints}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{categoryRegistrations}</div>
                  <div className="text-xs text-gray-500">Registered</div>
                </div>
              </div>
              
              <button className="text-gray-400 hover:text-gray-600">
                {isExpanded ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Achievements */}
        {isExpanded && categoryAchievements.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">🏆 Achievements & Results</h4>
            
            <div className="space-y-3">
              {categoryAchievements.map((achievement, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-1">
                        {achievement.programmeName}
                      </h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          {achievement.programmeCode}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {achievement.section}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getPositionColor(achievement.position)}`}>
                        <span className="text-lg">{getPositionIcon(achievement.position)}</span>
                        <div>
                          <div className="font-semibold">
                            {achievement.position.charAt(0).toUpperCase() + achievement.position.slice(1)} Place
                          </div>
                          <div className="text-xs">
                            {achievement.totalPoints} total points
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Breakdown */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-semibold text-blue-600">{achievement.positionPoints} pts</span>
                      </div>
                      {achievement.grade && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Grade {achievement.grade}:</span>
                          <span className="font-semibold text-green-600">{achievement.gradePoints} pts</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {achievement.totalPoints} pts
                      </div>
                      <div className="text-xs text-gray-500">Total Earned</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Achievements Message */}
        {isExpanded && categoryAchievements.length === 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
            <div className="text-gray-500 text-sm">
              <div className="text-2xl mb-2">🏆</div>
              <p>No achievements in this category yet.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = (category: string, subcategory?: string) => {
    const filteredCandidates = getFilteredCandidates(category, subcategory);
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        </div>
      );
    }

    const categoryStats = {
      totalCandidates: filteredCandidates.length,
      totalAchievements: filteredCandidates.reduce((sum, c) => {
        return sum + (category === 'sports' 
          ? c.totalAchievements.sports
          : subcategory === 'stage' 
            ? c.totalAchievements.artsStage
            : c.totalAchievements.artsNonStage);
      }, 0),
      totalPoints: filteredCandidates.reduce((sum, c) => {
        return sum + (category === 'sports' 
          ? c.totalPoints.sports
          : subcategory === 'stage' 
            ? c.totalPoints.artsStage
            : c.totalPoints.artsNonStage);
      }, 0),
      totalRegistrations: filteredCandidates.reduce((sum, c) => {
        return sum + (category === 'sports' 
          ? c.registeredProgrammes.sports
          : subcategory === 'stage' 
            ? c.registeredProgrammes.artsStage
            : c.registeredProgrammes.artsNonStage);
      }, 0)
    };

    return (
      <div className="space-y-6">
        {/* Filter Controls */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Candidates</label>
              <input
                type="text"
                placeholder="Search by name or chest number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team.code} value={team.code}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sections</option>
                <option value="senior">Senior</option>
                <option value="junior">Junior</option>
                <option value="sub-junior">Sub-Junior</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTeam('all');
                  setSelectedSection('all');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{categoryStats.totalCandidates}</div>
            <div className="text-sm text-blue-800">Candidates with Achievements</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{categoryStats.totalAchievements}</div>
            <div className="text-sm text-green-800">Total Achievements</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{categoryStats.totalPoints}</div>
            <div className="text-sm text-purple-800">Total Points Earned</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{categoryStats.totalRegistrations}</div>
            <div className="text-sm text-orange-800">Total Registrations</div>
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">
              {category === 'sports' ? '🏃' : subcategory === 'stage' ? '🎭' : '📝'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Candidates Found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedTeam !== 'all' || selectedSection !== 'all'
                ? 'No candidates match your current filters.'
                : `No candidates have achievements in ${category === 'sports' ? 'Sports' : subcategory === 'stage' ? 'Arts Stage' : 'Arts Non-Stage'} yet.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredCandidates.slice(0, showAllCandidates[activeTab] ? undefined : 10).map(candidate => 
                renderCandidateCard(candidate, category, subcategory)
              )}
            </div>
            
            {/* Show More Button */}
            {filteredCandidates.length > 10 && (
              <div className="text-center mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAllCandidates(prev => ({
                    ...prev,
                    [activeTab]: !prev[activeTab]
                  }))}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {showAllCandidates[activeTab] 
                    ? `Show Less (${filteredCandidates.length - 10} hidden)` 
                    : `Show More (${filteredCandidates.length - 10} more candidates)`
                  }
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {showAllCandidates[activeTab] ? filteredCandidates.length : Math.min(10, filteredCandidates.length)} of {filteredCandidates.length} candidates
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className} flex flex-col`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🏆 Candidate Achievements & Results</h2>
        <p className="text-gray-600">Explore individual candidate achievements and results by category</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('arts-stage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'arts-stage'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            🎭 Arts Stage
            <span className="ml-2 bg-pink-100 text-pink-800 py-0.5 px-2 rounded-full text-xs">
              {candidatesWithResults.filter(c => c.totalAchievements.artsStage > 0).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('arts-non-stage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'arts-non-stage'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📝 Arts Non-Stage
            <span className="ml-2 bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full text-xs">
              {candidatesWithResults.filter(c => c.totalAchievements.artsNonStage > 0).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sports'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            🏃 Sports
            <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">
              {candidatesWithResults.filter(c => c.totalAchievements.sports > 0).length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {activeTab === 'arts-stage' && renderTabContent('arts', 'stage')}
          {activeTab === 'arts-non-stage' && renderTabContent('arts', 'non-stage')}
          {activeTab === 'sports' && renderTabContent('sports')}
        </div>
      </div>
    </div>
  );
}
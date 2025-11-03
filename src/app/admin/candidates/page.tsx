'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Candidate, Team, EnhancedResult } from '@/types';
import { getGradePoints } from '@/utils/markingSystem';

interface CandidateWithStats extends Candidate {
  registeredProgrammes: {
    artsStage: {
      individual: number;
      group: number;
      general: number;
      total: number;
      programmes: Array<{
        id: string;
        name: string;
        code: string;
        positionType: string;
        section: string;
      }>;
    };
    artsNonStage: {
      individual: number;
      group: number;
      general: number;
      total: number;
      programmes: Array<{
        id: string;
        name: string;
        code: string;
        positionType: string;
        section: string;
      }>;
    };
    sports: {
      individual: number;
      group: number;
      general: number;
      total: number;
      programmes: Array<{
        id: string;
        name: string;
        code: string;
        positionType: string;
        section: string;
      }>;
    };
    total: number;
  };
  earnedPoints: {
    artsStage: number;
    artsNonStage: number;
    sports: number;
    total: number;
  };
  results: {
    artsStage: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade: string;
      gradePoints: number;
      totalPoints: number;
      positionType: string;
      section: string;
    }>;
    artsNonStage: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade: string;
      gradePoints: number;
      totalPoints: number;
      positionType: string;
      section: string;
    }>;
    sports: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade: string;
      gradePoints: number;
      totalPoints: number;
      positionType: string;
      section: string;
    }>;
    total: Array<{
      programmeId: string;
      programmeName: string;
      programmeCode: string;
      position: 'first' | 'second' | 'third';
      positionPoints: number;
      grade: string;
      gradePoints: number;
      totalPoints: number;
      positionType: string;
      section: string;
      category: string;
      subcategory?: string;
    }>;
  };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesWithStats, setCandidatesWithStats] = useState<CandidateWithStats[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [programmeParticipants, setProgrammeParticipants] = useState<any[]>([]);
  const [results, setResults] = useState<EnhancedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'arts-stage' | 'arts-non-stage' | 'sports'>('overview');
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  // Filter out blank/empty candidates with enhanced logging
  const filterValidCandidates = (candidates: Candidate[]) => {
    const valid: Candidate[] = [];
    const rejected: Candidate[] = [];
    
    candidates.forEach(candidate => {
      const issues: string[] = [];
      
      // Check for missing or empty fields
      if (!candidate.name || candidate.name.trim() === '') {
        issues.push('Missing or empty name');
      }
      if (!candidate.chestNumber || candidate.chestNumber.trim() === '') {
        issues.push('Missing or empty chestNumber');
      }
      if (!candidate.team || candidate.team.trim() === '') {
        issues.push('Missing or empty team');
      }
      if (!candidate.section || candidate.section.trim() === '') {
        issues.push('Missing or empty section');
      }
      
      // More lenient filtering - only reject if completely empty or missing critical fields
      const hasMinimumData = candidate._id && (
        (candidate.name && candidate.name.trim()) ||
        (candidate.chestNumber && candidate.chestNumber.trim())
      );
      
      if (hasMinimumData && issues.length <= 2) {
        // Allow candidates with minor data issues
        valid.push(candidate);
        if (issues.length > 0) {
          console.warn(`⚠️ Candidate with data issues included:`, {
            id: candidate._id,
            name: candidate.name || '[MISSING]',
            chestNumber: candidate.chestNumber || '[MISSING]',
            team: candidate.team || '[MISSING]',
            section: candidate.section || '[MISSING]',
            issues: issues
          });
        }
      } else {
        rejected.push(candidate);
        console.warn(`❌ Candidate filtered out:`, {
          id: candidate._id,
          name: candidate.name || '[MISSING]',
          chestNumber: candidate.chestNumber || '[MISSING]',
          team: candidate.team || '[MISSING]',
          section: candidate.section || '[MISSING]',
          issues: issues
        });
      }
    });
    
    if (rejected.length > 0) {
      console.log(`🔍 Filtering Summary: ${valid.length} candidates included, ${rejected.length} candidates filtered out`);
    }
    
    return valid;
  };

  // Fetch all data from APIs
  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, teamsRes, programmesRes, participantsRes, resultsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/teams'),
        fetch('/api/programmes'),
        fetch('/api/programme-participants'),
        fetch('/api/results?published=true')
      ]);

      const [candidatesData, teamsData, programmesData, participantsData, resultsData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json(),
        programmesRes.json(),
        participantsRes.json(),
        resultsRes.json()
      ]);

      // Filter out blank/empty candidates
      const validCandidates = filterValidCandidates(candidatesData);

      setCandidates(validCandidates);
      setTeams(teamsData);
      setProgrammes(programmesData);
      setProgrammeParticipants(participantsData);
      setResults(resultsData);

      // Calculate stats for each candidate
      calculateCandidateStats(validCandidates, programmesData, participantsData, resultsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate registered programmes and earned points for each candidate
  const calculateCandidateStats = (
    candidatesData: Candidate[],
    programmesData: any[],
    participantsData: any[],
    resultsData: EnhancedResult[]
  ) => {
    const candidatesWithStats: CandidateWithStats[] = candidatesData.map(candidate => {
      // Find programmes this candidate is registered for
      const candidateParticipations = participantsData.filter(teamRegistration =>
        teamRegistration.participants &&
        teamRegistration.participants.includes(candidate.chestNumber)
      );

      // Count programmes by category, subcategory, and position type
      const registeredProgrammes = {
        artsStage: {
          individual: 0,
          group: 0,
          general: 0,
          total: 0,
          programmes: [] as Array<{
            id: string;
            name: string;
            code: string;
            positionType: string;
            section: string;
          }>
        },
        artsNonStage: {
          individual: 0,
          group: 0,
          general: 0,
          total: 0,
          programmes: [] as Array<{
            id: string;
            name: string;
            code: string;
            positionType: string;
            section: string;
          }>
        },
        sports: {
          individual: 0,
          group: 0,
          general: 0,
          total: 0,
          programmes: [] as Array<{
            id: string;
            name: string;
            code: string;
            positionType: string;
            section: string;
          }>
        },
        total: candidateParticipations.length
      };

      candidateParticipations.forEach(teamRegistration => {
        const programme = programmesData.find(p =>
          p._id?.toString() === teamRegistration.programmeId?.toString()
        );

        if (programme) {
          const category = programme.category?.toLowerCase();
          const subcategory = programme.subcategory?.toLowerCase();
          const positionType = programme.positionType?.toLowerCase();

          const programmeInfo = {
            id: programme._id?.toString() || '',
            name: programme.name || '',
            code: programme.code || '',
            positionType: programme.positionType || '',
            section: programme.section || ''
          };

          if (category === 'arts') {
            if (subcategory === 'stage') {
              registeredProgrammes.artsStage.total++;
              registeredProgrammes.artsStage.programmes.push(programmeInfo);
              if (positionType === 'individual') {
                registeredProgrammes.artsStage.individual++;
              } else if (positionType === 'group') {
                registeredProgrammes.artsStage.group++;
              } else if (positionType === 'general') {
                registeredProgrammes.artsStage.general++;
              }
            } else if (subcategory === 'non-stage') {
              registeredProgrammes.artsNonStage.total++;
              registeredProgrammes.artsNonStage.programmes.push(programmeInfo);
              if (positionType === 'individual') {
                registeredProgrammes.artsNonStage.individual++;
              } else if (positionType === 'group') {
                registeredProgrammes.artsNonStage.group++;
              } else if (positionType === 'general') {
                registeredProgrammes.artsNonStage.general++;
              }
            }
          } else if (category === 'sports') {
            registeredProgrammes.sports.total++;
            registeredProgrammes.sports.programmes.push(programmeInfo);
            if (positionType === 'individual') {
              registeredProgrammes.sports.individual++;
            } else if (positionType === 'group') {
              registeredProgrammes.sports.group++;
            } else if (positionType === 'general') {
              registeredProgrammes.sports.general++;
            }
          }
        }
      });

      // Calculate earned points by category and collect detailed results
      const earnedPoints = {
        artsStage: 0,
        artsNonStage: 0,
        sports: 0,
        total: 0
      };

      const results = {
        artsStage: [] as Array<{
          programmeId: string;
          programmeName: string;
          programmeCode: string;
          position: 'first' | 'second' | 'third';
          positionPoints: number;
          grade: string;
          gradePoints: number;
          totalPoints: number;
          positionType: string;
          section: string;
        }>,
        artsNonStage: [] as Array<{
          programmeId: string;
          programmeName: string;
          programmeCode: string;
          position: 'first' | 'second' | 'third';
          positionPoints: number;
          grade: string;
          gradePoints: number;
          totalPoints: number;
          positionType: string;
          section: string;
        }>,
        sports: [] as Array<{
          programmeId: string;
          programmeName: string;
          programmeCode: string;
          position: 'first' | 'second' | 'third';
          positionPoints: number;
          grade: string;
          gradePoints: number;
          totalPoints: number;
          positionType: string;
          section: string;
        }>,
        total: [] as Array<{
          programmeId: string;
          programmeName: string;
          programmeCode: string;
          position: 'first' | 'second' | 'third';
          positionPoints: number;
          grade: string;
          gradePoints: number;
          totalPoints: number;
          positionType: string;
          section: string;
          category: string;
          subcategory?: string;
        }>
      };

      resultsData.forEach(result => {
        const programme = programmesData.find(p =>
          p._id?.toString() === result.programmeId?.toString()
        );

        if (!programme) return;

        const category = programme.category?.toLowerCase();
        const subcategory = programme.subcategory?.toLowerCase();
        let pointsEarned = 0;

        // Check individual winners (by chest number)
        if (result.firstPlace) {
          result.firstPlace.forEach((winner: any) => {
            if (winner.chestNumber === candidate.chestNumber) {
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = result.firstPoints + gradePoints;
              pointsEarned += totalPoints;
              
              const resultInfo = {
                programmeId: programme._id?.toString() || '',
                programmeName: programme.name || '',
                programmeCode: programme.code || '',
                position: 'first' as const,
                positionPoints: result.firstPoints,
                grade: winner.grade || '',
                gradePoints,
                totalPoints,
                positionType: programme.positionType || '',
                section: programme.section || ''
              };

              // Add to category-specific results
              if (category === 'arts') {
                if (subcategory === 'stage') {
                  results.artsStage.push(resultInfo);
                } else if (subcategory === 'non-stage') {
                  results.artsNonStage.push(resultInfo);
                }
              } else if (category === 'sports') {
                results.sports.push(resultInfo);
              }

              // Add to total results
              results.total.push({
                ...resultInfo,
                category: programme.category || '',
                subcategory: programme.subcategory || ''
              });
            }
          });
        }

        if (result.secondPlace) {
          result.secondPlace.forEach((winner: any) => {
            if (winner.chestNumber === candidate.chestNumber) {
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = result.secondPoints + gradePoints;
              pointsEarned += totalPoints;
              
              const resultInfo = {
                programmeId: programme._id?.toString() || '',
                programmeName: programme.name || '',
                programmeCode: programme.code || '',
                position: 'second' as const,
                positionPoints: result.secondPoints,
                grade: winner.grade || '',
                gradePoints,
                totalPoints,
                positionType: programme.positionType || '',
                section: programme.section || ''
              };

              // Add to category-specific results
              if (category === 'arts') {
                if (subcategory === 'stage') {
                  results.artsStage.push(resultInfo);
                } else if (subcategory === 'non-stage') {
                  results.artsNonStage.push(resultInfo);
                }
              } else if (category === 'sports') {
                results.sports.push(resultInfo);
              }

              // Add to total results
              results.total.push({
                ...resultInfo,
                category: programme.category || '',
                subcategory: programme.subcategory || ''
              });
            }
          });
        }

        if (result.thirdPlace) {
          result.thirdPlace.forEach((winner: any) => {
            if (winner.chestNumber === candidate.chestNumber) {
              const gradePoints = getGradePoints(winner.grade || '');
              const totalPoints = result.thirdPoints + gradePoints;
              pointsEarned += totalPoints;
              
              const resultInfo = {
                programmeId: programme._id?.toString() || '',
                programmeName: programme.name || '',
                programmeCode: programme.code || '',
                position: 'third' as const,
                positionPoints: result.thirdPoints,
                grade: winner.grade || '',
                gradePoints,
                totalPoints,
                positionType: programme.positionType || '',
                section: programme.section || ''
              };

              // Add to category-specific results
              if (category === 'arts') {
                if (subcategory === 'stage') {
                  results.artsStage.push(resultInfo);
                } else if (subcategory === 'non-stage') {
                  results.artsNonStage.push(resultInfo);
                }
              } else if (category === 'sports') {
                results.sports.push(resultInfo);
              }

              // Add to total results
              results.total.push({
                ...resultInfo,
                category: programme.category || '',
                subcategory: programme.subcategory || ''
              });
            }
          });
        }

        // Check team winners (for group/general programmes)
        if (result.firstPlaceTeams) {
          result.firstPlaceTeams.forEach((winner: any) => {
            if (winner.teamCode === candidate.team) {
              const candidateParticipated = candidateParticipations.some(participation =>
                participation.programmeId?.toString() === result.programmeId?.toString()
              );

              if (candidateParticipated) {
                const gradePoints = getGradePoints(winner.grade || '');
                const totalPoints = result.firstPoints + gradePoints;
                pointsEarned += totalPoints;
                
                const resultInfo = {
                  programmeId: programme._id?.toString() || '',
                  programmeName: programme.name || '',
                  programmeCode: programme.code || '',
                  position: 'first' as const,
                  positionPoints: result.firstPoints,
                  grade: winner.grade || '',
                  gradePoints,
                  totalPoints,
                  positionType: programme.positionType || '',
                  section: programme.section || ''
                };

                // Add to category-specific results
                if (category === 'arts') {
                  if (subcategory === 'stage') {
                    results.artsStage.push(resultInfo);
                  } else if (subcategory === 'non-stage') {
                    results.artsNonStage.push(resultInfo);
                  }
                } else if (category === 'sports') {
                  results.sports.push(resultInfo);
                }

                // Add to total results
                results.total.push({
                  ...resultInfo,
                  category: programme.category || '',
                  subcategory: programme.subcategory || ''
                });
              }
            }
          });
        }

        if (result.secondPlaceTeams) {
          result.secondPlaceTeams.forEach((winner: any) => {
            if (winner.teamCode === candidate.team) {
              const candidateParticipated = candidateParticipations.some(participation =>
                participation.programmeId?.toString() === result.programmeId?.toString()
              );

              if (candidateParticipated) {
                const gradePoints = getGradePoints(winner.grade || '');
                const totalPoints = result.secondPoints + gradePoints;
                pointsEarned += totalPoints;
                
                const resultInfo = {
                  programmeId: programme._id?.toString() || '',
                  programmeName: programme.name || '',
                  programmeCode: programme.code || '',
                  position: 'second' as const,
                  positionPoints: result.secondPoints,
                  grade: winner.grade || '',
                  gradePoints,
                  totalPoints,
                  positionType: programme.positionType || '',
                  section: programme.section || ''
                };

                // Add to category-specific results
                if (category === 'arts') {
                  if (subcategory === 'stage') {
                    results.artsStage.push(resultInfo);
                  } else if (subcategory === 'non-stage') {
                    results.artsNonStage.push(resultInfo);
                  }
                } else if (category === 'sports') {
                  results.sports.push(resultInfo);
                }

                // Add to total results
                results.total.push({
                  ...resultInfo,
                  category: programme.category || '',
                  subcategory: programme.subcategory || ''
                });
              }
            }
          });
        }

        if (result.thirdPlaceTeams) {
          result.thirdPlaceTeams.forEach((winner: any) => {
            if (winner.teamCode === candidate.team) {
              const candidateParticipated = candidateParticipations.some(participation =>
                participation.programmeId?.toString() === result.programmeId?.toString()
              );

              if (candidateParticipated) {
                const gradePoints = getGradePoints(winner.grade || '');
                const totalPoints = result.thirdPoints + gradePoints;
                pointsEarned += totalPoints;
                
                const resultInfo = {
                  programmeId: programme._id?.toString() || '',
                  programmeName: programme.name || '',
                  programmeCode: programme.code || '',
                  position: 'third' as const,
                  positionPoints: result.thirdPoints,
                  grade: winner.grade || '',
                  gradePoints,
                  totalPoints,
                  positionType: programme.positionType || '',
                  section: programme.section || ''
                };

                // Add to category-specific results
                if (category === 'arts') {
                  if (subcategory === 'stage') {
                    results.artsStage.push(resultInfo);
                  } else if (subcategory === 'non-stage') {
                    results.artsNonStage.push(resultInfo);
                  }
                } else if (category === 'sports') {
                  results.sports.push(resultInfo);
                }

                // Add to total results
                results.total.push({
                  ...resultInfo,
                  category: programme.category || '',
                  subcategory: programme.subcategory || ''
                });
              }
            }
          });
        }

        // Assign points to appropriate category
        if (pointsEarned > 0) {
          if (category === 'arts') {
            if (subcategory === 'stage') {
              earnedPoints.artsStage += pointsEarned;
            } else if (subcategory === 'non-stage') {
              earnedPoints.artsNonStage += pointsEarned;
            }
          } else if (category === 'sports') {
            earnedPoints.sports += pointsEarned;
          }
          earnedPoints.total += pointsEarned;
        }
      });

      return {
        ...candidate,
        registeredProgrammes,
        earnedPoints,
        results
      };
    });

    setCandidatesWithStats(candidatesWithStats);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter candidates by selected team
  const filteredCandidates = selectedTeam === 'all'
    ? candidatesWithStats
    : candidatesWithStats.filter(candidate => candidate.team === selectedTeam);

  // Toggle expanded state for candidate
  const toggleCandidateExpanded = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };

  // Validate candidate data and return warnings
  const validateCandidate = (candidate: Candidate) => {
    const warnings: string[] = [];
    if (!candidate.name || candidate.name.trim() === '') warnings.push('Missing name');
    if (!candidate.chestNumber || candidate.chestNumber.trim() === '') warnings.push('Missing chest number');
    if (!candidate.team || candidate.team.trim() === '') warnings.push('Missing team');
    if (!candidate.section || candidate.section.trim() === '') warnings.push('Missing section');
    return warnings;
  };

  // Group candidates by team for statistics
  const candidatesByTeam = teams.map(team => {
    const teamCandidates = candidatesWithStats.filter(c => c.team === team.code);
    const totalEarnedPoints = teamCandidates.reduce((sum, c) => sum + c.earnedPoints.total, 0);
    const totalRegistrations = teamCandidates.reduce((sum, c) => sum + c.registeredProgrammes.total, 0);

    return {
      ...team,
      candidateCount: teamCandidates.length,
      totalEarnedPoints,
      totalRegistrations,
      avgEarnedPoints: teamCandidates.length > 0
        ? (totalEarnedPoints / teamCandidates.length).toFixed(1)
        : '0',
      avgRegistrations: teamCandidates.length > 0
        ? (totalRegistrations / teamCandidates.length).toFixed(1)
        : '0'
    };
  });

  // Render candidate table for specific category
  const renderCandidateTable = (candidates: CandidateWithStats[], category: 'artsStage' | 'artsNonStage' | 'sports') => {
    const filteredCandidates = selectedTeam === 'all'
      ? candidates
      : candidates.filter(candidate => candidate.team === selectedTeam);

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

    return (
      <>
        {/* Filter Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Teams ({candidates.length})</option>
              {teams.map((team) => (
                <option key={team.code} value={team.code}>
                  {team.name} ({candidates.filter(c => c.team === team.code).length})
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </div>
        </div>

        {/* Candidates Table */}
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Candidates Found</h3>
            <p className="text-gray-500">
              {selectedTeam === 'all'
                ? `No candidates are registered for ${category === 'artsStage' ? 'Arts Stage' : category === 'artsNonStage' ? 'Arts Non-Stage' : 'Sports'} programmes.`
                : `No candidates from ${teams.find(t => t.code === selectedTeam)?.name} are registered for ${category === 'artsStage' ? 'Arts Stage' : category === 'artsNonStage' ? 'Arts Non-Stage' : 'Sports'} programmes.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Chest Number</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Name</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Team</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-700">Individual</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-700">Group</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-700">General</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-700">Total Programmes</th>
                  <th className="text-center py-4 px-4 font-bold text-gray-700">Earned Points</th>
                  <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => {
                  const team = teams.find(t => t.code === candidate.team);
                  const categoryData = candidate.registeredProgrammes[category];
                  const earnedPoints = candidate.earnedPoints[category];
                  const candidateId = candidate._id?.toString() || candidate.chestNumber;
                  const isExpanded = expandedCandidates.has(candidateId);
                  
                  return (
                    <React.Fragment key={candidateId}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleCandidateExpanded(candidateId)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                            <span className="font-mono font-bold text-gray-900">{candidate.chestNumber}</span>
                          </div>
                        </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {candidate.name || '[Missing Name]'}
                          </span>
                          {(() => {
                            const warnings = validateCandidate(candidate);
                            return warnings.length > 0 && (
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help"
                                title={`Data Issues: ${warnings.join(', ')}`}
                              >
                                ⚠️ {warnings.length}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: team?.color }}
                          >
                            {candidate.team}
                          </div>
                          <span className="font-medium">{team?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 capitalize">
                          {candidate.section.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          categoryData.individual > 0 
                            ? category === 'artsStage' ? 'bg-pink-100 text-pink-800' : category === 'artsNonStage' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {categoryData.individual}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          categoryData.group > 0 
                            ? category === 'artsStage' ? 'bg-pink-100 text-pink-800' : category === 'artsNonStage' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {categoryData.group}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          categoryData.general > 0 
                            ? category === 'artsStage' ? 'bg-pink-100 text-pink-800' : category === 'artsNonStage' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {categoryData.general}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {categoryData.total}
                          </span>
                          {categoryData.total > 0 && (
                            <span className="text-xs text-gray-500">
                              ({categoryData.programmes.length} programmes)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-green-600">
                            {earnedPoints}
                          </span>
                          <span className="text-xs text-gray-500">points</span>
                          {earnedPoints > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              🏆 Winner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      </td>
                    </tr>
                    
                    {/* Collapsible Programme Details Row with Subcategory Organization */}
                    {isExpanded && categoryData.programmes.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={10} className="py-4 px-4">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              📋 {category === 'artsStage' ? '🎭 Arts Stage' : category === 'artsNonStage' ? '📝 Arts Non-Stage' : '🏃 Sports'} Programmes ({categoryData.programmes.length})
                            </h4>
                            
                            {/* Individual Programmes */}
                            {categoryData.individual > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    category === 'artsStage' ? 'bg-pink-100 text-pink-800' : 
                                    category === 'artsNonStage' ? 'bg-purple-100 text-purple-800' : 
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    👤 Individual ({categoryData.individual})
                                  </span>
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {categoryData.programmes
                                    .filter(programme => programme.positionType.toLowerCase() === 'individual')
                                    .map((programme, index) => (
                                    <div
                                      key={`${programme.id}-${index}`}
                                      className={`p-3 rounded-lg border ${
                                        category === 'artsStage' 
                                          ? 'bg-pink-50 border-pink-200' 
                                          : category === 'artsNonStage' 
                                          ? 'bg-purple-50 border-purple-200' 
                                          : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium text-gray-900 mb-1">
                                            {programme.name}
                                          </h6>
                                          <p className="text-xs text-gray-600">
                                            Code: {programme.code}
                                          </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          category === 'artsStage' ? 'bg-pink-100 text-pink-800' : 
                                          category === 'artsNonStage' ? 'bg-purple-100 text-purple-800' : 
                                          'bg-blue-100 text-blue-800'
                                        }`}>
                                          Individual
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          category === 'artsStage' 
                                            ? 'bg-pink-100 text-pink-700' 
                                            : category === 'artsNonStage' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {category === 'artsStage' ? '🎭 Stage' : category === 'artsNonStage' ? '📝 Non-Stage' : '🏃 Sports'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Group Programmes */}
                            {categoryData.group > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    category === 'artsStage' ? 'bg-pink-200 text-pink-900' : 
                                    category === 'artsNonStage' ? 'bg-purple-200 text-purple-900' : 
                                    'bg-blue-200 text-blue-900'
                                  }`}>
                                    👥 Group ({categoryData.group})
                                  </span>
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {categoryData.programmes
                                    .filter(programme => programme.positionType.toLowerCase() === 'group')
                                    .map((programme, index) => (
                                    <div
                                      key={`${programme.id}-${index}`}
                                      className={`p-3 rounded-lg border ${
                                        category === 'artsStage' 
                                          ? 'bg-pink-50 border-pink-200' 
                                          : category === 'artsNonStage' 
                                          ? 'bg-purple-50 border-purple-200' 
                                          : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium text-gray-900 mb-1">
                                            {programme.name}
                                          </h6>
                                          <p className="text-xs text-gray-600">
                                            Code: {programme.code}
                                          </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          category === 'artsStage' ? 'bg-pink-200 text-pink-900' : 
                                          category === 'artsNonStage' ? 'bg-purple-200 text-purple-900' : 
                                          'bg-blue-200 text-blue-900'
                                        }`}>
                                          Group
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          category === 'artsStage' 
                                            ? 'bg-pink-100 text-pink-700' 
                                            : category === 'artsNonStage' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {category === 'artsStage' ? '🎭 Stage' : category === 'artsNonStage' ? '📝 Non-Stage' : '🏃 Sports'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* General Programmes */}
                            {categoryData.general > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-medium mb-2 flex items-center">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    category === 'artsStage' ? 'bg-pink-300 text-pink-900' : 
                                    category === 'artsNonStage' ? 'bg-purple-300 text-purple-900' : 
                                    'bg-blue-300 text-blue-900'
                                  }`}>
                                    🌐 General ({categoryData.general})
                                  </span>
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {categoryData.programmes
                                    .filter(programme => programme.positionType.toLowerCase() === 'general')
                                    .map((programme, index) => (
                                    <div
                                      key={`${programme.id}-${index}`}
                                      className={`p-3 rounded-lg border ${
                                        category === 'artsStage' 
                                          ? 'bg-pink-50 border-pink-200' 
                                          : category === 'artsNonStage' 
                                          ? 'bg-purple-50 border-purple-200' 
                                          : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium text-gray-900 mb-1">
                                            {programme.name}
                                          </h6>
                                          <p className="text-xs text-gray-600">
                                            Code: {programme.code}
                                          </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          category === 'artsStage' ? 'bg-pink-300 text-pink-900' : 
                                          category === 'artsNonStage' ? 'bg-purple-300 text-purple-900' : 
                                          'bg-blue-300 text-blue-900'
                                        }`}>
                                          General
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                          category === 'artsStage' 
                                            ? 'bg-pink-100 text-pink-700' 
                                            : category === 'artsNonStage' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {category === 'artsStage' ? '🎭 Stage' : category === 'artsNonStage' ? '📝 Non-Stage' : '🏃 Sports'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Results Section for Category Tabs */}
                            {(() => {
                              const categoryResults = candidate.results[category];
                              return categoryResults.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-300">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    🏆 Results & Achievements ({categoryResults.length})
                                  </h4>
                                  
                                  <div className="space-y-3">
                                    {categoryResults.map((result, index) => (
                                      <div
                                        key={`${result.programmeId}-${index}`}
                                        className={`p-3 rounded-lg border ${
                                          result.position === 'first' 
                                            ? 'bg-yellow-50 border-yellow-200' 
                                            : result.position === 'second'
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-orange-50 border-orange-200'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <h6 className="text-sm font-medium text-gray-900 mb-1">
                                              {result.programmeName}
                                            </h6>
                                            <p className="text-xs text-gray-600">
                                              Code: {result.programmeCode}
                                            </p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                              result.position === 'first' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : result.position === 'second'
                                                ? 'bg-gray-100 text-gray-800'
                                                : 'bg-orange-100 text-orange-800'
                                            }`}>
                                              {result.position === 'first' ? '🥇 1st' : result.position === 'second' ? '🥈 2nd' : '🥉 3rd'}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                              {result.totalPoints} pts
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                          <div className="flex items-center space-x-3">
                                            <span>Section: {result.section.charAt(0).toUpperCase() + result.section.slice(1).replace('-', ' ')}</span>
                                            <span>Type: {result.positionType.charAt(0).toUpperCase() + result.positionType.slice(1)}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                              Position: {result.positionPoints} pts
                                            </span>
                                            {result.grade && (
                                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                result.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                result.grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                              }`}>
                                                Grade {result.grade}: +{result.gradePoints} pts
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <Breadcrumb pageName="Candidates Management" />

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900">Admin Management View</h3>
              <p className="text-blue-700 text-sm">
                Candidates are added and managed by team admins. This page provides an overview of all registered candidates across teams.
              </p>
            </div>
          </div>
        </div>

        {/* Team Statistics */}
        <ShowcaseSection title="Team Statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidatesByTeam.map((team) => (
              <div key={team._id?.toString()} className="bg-white border-2 rounded-lg p-6 hover:shadow-md transition-shadow"
                style={{ borderColor: team.color + '40' }}>
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold mr-4"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-900">{team.candidateCount}</div>
                    <div className="text-xs text-gray-500">Candidates</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">{team.totalRegistrations}</div>
                    <div className="text-xs text-gray-500">Registrations</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ color: team.color }}>{team.totalEarnedPoints}</div>
                    <div className="text-xs text-gray-500">Earned Points</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-700">{team.avgEarnedPoints}</div>
                    <div className="text-xs text-gray-500">Avg Points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📋 Overview
                <span className="ml-2 bg-gray-100 text-gray-800 py-0.5 px-2 rounded-full text-xs">
                  {candidatesWithStats.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('arts-stage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'arts-stage'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                🎭 Arts Stage
                <span className="ml-2 bg-pink-100 text-pink-800 py-0.5 px-2 rounded-full text-xs">
                  {candidatesWithStats.filter(c => c.registeredProgrammes.artsStage.total > 0).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('arts-non-stage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'arts-non-stage'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                📝 Arts Non-Stage
                <span className="ml-2 bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full text-xs">
                  {candidatesWithStats.filter(c => c.registeredProgrammes.artsNonStage.total > 0).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('sports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                🏃 Sports
                <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">
                  {candidatesWithStats.filter(c => c.registeredProgrammes.sports.total > 0).length}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Candidates Overview</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading candidates...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filter Controls */}
              <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filter by Team:</label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Teams ({candidatesWithStats.length})</option>
                    {teams.map((team) => (
                      <option key={team.code} value={team.code}>
                        {team.name} ({candidatesWithStats.filter(c => c.team === team.code).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredCandidates.length} of {candidatesWithStats.length} candidates
                </div>
              </div>

              {/* Candidates Table */}
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Candidates Found</h3>
                  <p className="text-gray-500">
                    {selectedTeam === 'all'
                      ? 'No candidates have been registered yet. Team admins can add candidates through their portals.'
                      : `No candidates found for ${teams.find(t => t.code === selectedTeam)?.name}. Team admin can add candidates through their portal.`
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Chest Number</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Name</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Team</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Section</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-700">Registered Programmes</th>
                        <th className="text-center py-4 px-4 font-bold text-gray-700">Earned Points</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => {
                        const team = teams.find(t => t.code === candidate.team);
                        const candidateId = candidate._id?.toString() || candidate.chestNumber;
                        const isExpanded = expandedCandidates.has(candidateId);
                        
                        return (
                          <React.Fragment key={candidateId}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleCandidateExpanded(candidateId)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                  </button>
                                  <span className="font-mono font-bold text-gray-900">{candidate.chestNumber}</span>
                                </div>
                              </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {candidate.name || '[Missing Name]'}
                                </span>
                                {(() => {
                                  const warnings = validateCandidate(candidate);
                                  return warnings.length > 0 && (
                                    <span 
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help"
                                      title={`Data Issues: ${warnings.join(', ')}`}
                                    >
                                      ⚠️ {warnings.length}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: team?.color }}
                                >
                                  {candidate.team}
                                </div>
                                <span className="font-medium">{team?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 capitalize">
                                {candidate.section.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-center">
                                {candidate.registeredProgrammes.total === 0 ? (
                                  <div className="text-gray-400">
                                    <div className="text-sm">No registrations</div>
                                    <div className="text-xs">Not registered yet</div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="space-y-2">
                                      {/* Arts Stage Breakdown */}
                                      {candidate.registeredProgrammes.artsStage.total > 0 && (
                                        <div>
                                          <div className="flex items-center justify-center mb-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                              🎭 Arts Stage: {candidate.registeredProgrammes.artsStage.total}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-center space-x-1">
                                            {candidate.registeredProgrammes.artsStage.individual > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">
                                                Individual: {candidate.registeredProgrammes.artsStage.individual}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.artsStage.group > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">
                                                Group: {candidate.registeredProgrammes.artsStage.group}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.artsStage.general > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-50 text-pink-700 border border-pink-200">
                                                General: {candidate.registeredProgrammes.artsStage.general}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Arts Non-Stage Breakdown */}
                                      {candidate.registeredProgrammes.artsNonStage.total > 0 && (
                                        <div>
                                          <div className="flex items-center justify-center mb-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                              📝 Arts Non-Stage: {candidate.registeredProgrammes.artsNonStage.total}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-center space-x-1">
                                            {candidate.registeredProgrammes.artsNonStage.individual > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                                Individual: {candidate.registeredProgrammes.artsNonStage.individual}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.artsNonStage.group > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                                Group: {candidate.registeredProgrammes.artsNonStage.group}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.artsNonStage.general > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                                General: {candidate.registeredProgrammes.artsNonStage.general}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Sports Breakdown */}
                                      {candidate.registeredProgrammes.sports.total > 0 && (
                                        <div>
                                          <div className="flex items-center justify-center mb-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              🏃 Sports: {candidate.registeredProgrammes.sports.total}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-center space-x-1">
                                            {candidate.registeredProgrammes.sports.individual > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                                Individual: {candidate.registeredProgrammes.sports.individual}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.sports.group > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                                Group: {candidate.registeredProgrammes.sports.group}
                                              </span>
                                            )}
                                            {candidate.registeredProgrammes.sports.general > 0 && (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                                General: {candidate.registeredProgrammes.sports.general}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                      Total: {candidate.registeredProgrammes.total}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-green-600">
                                  {candidate.earnedPoints.total}
                                </span>
                                <span className="text-xs text-gray-500">points</span>
                                {candidate.earnedPoints.total > 0 && (
                                  <span className="text-xs text-green-600 font-medium">
                                    🏆 Winner
                                  </span>
                                )}
                                {/* Points breakdown */}
                                <div className="text-xs text-gray-600 mt-1">
                                  {candidate.earnedPoints.artsStage > 0 && (
                                    <div>🎭 Stage: {candidate.earnedPoints.artsStage}</div>
                                  )}
                                  {candidate.earnedPoints.artsNonStage > 0 && (
                                    <div>📝 Non-Stage: {candidate.earnedPoints.artsNonStage}</div>
                                  )}
                                  {candidate.earnedPoints.sports > 0 && (
                                    <div>🏃 Sports: {candidate.earnedPoints.sports}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                Active
                              </span>
                            </td>
                          </tr>
                          
                          {/* Collapsible Programme Details Row */}
                          {isExpanded && candidate.registeredProgrammes.total > 0 && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="py-4 px-4">
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    📋 Registered Programmes ({candidate.registeredProgrammes.total})
                                  </h4>
                                  
                                  {/* Arts Stage Programmes */}
                                  {candidate.registeredProgrammes.artsStage.total > 0 && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-pink-800 mb-2 flex items-center">
                                        🎭 Arts Stage ({candidate.registeredProgrammes.artsStage.total} programmes)
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {candidate.registeredProgrammes.artsStage.programmes.map((programme, index) => (
                                          <div
                                            key={`${programme.id}-${index}`}
                                            className="p-3 rounded-lg border bg-pink-50 border-pink-200"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h6 className="text-sm font-medium text-gray-900 mb-1">
                                                  {programme.name}
                                                </h6>
                                                <p className="text-xs text-gray-600">
                                                  Code: {programme.code}
                                                </p>
                                              </div>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                                {programme.positionType.charAt(0).toUpperCase() + programme.positionType.slice(1)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                              <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                              <span className="px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-700">
                                                🎭 Stage
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Arts Non-Stage Programmes */}
                                  {candidate.registeredProgrammes.artsNonStage.total > 0 && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                                        📝 Arts Non-Stage ({candidate.registeredProgrammes.artsNonStage.total} programmes)
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {candidate.registeredProgrammes.artsNonStage.programmes.map((programme, index) => (
                                          <div
                                            key={`${programme.id}-${index}`}
                                            className="p-3 rounded-lg border bg-purple-50 border-purple-200"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h6 className="text-sm font-medium text-gray-900 mb-1">
                                                  {programme.name}
                                                </h6>
                                                <p className="text-xs text-gray-600">
                                                  Code: {programme.code}
                                                </p>
                                              </div>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {programme.positionType.charAt(0).toUpperCase() + programme.positionType.slice(1)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                              <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                              <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                📝 Non-Stage
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Sports Programmes */}
                                  {candidate.registeredProgrammes.sports.total > 0 && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                        🏃 Sports ({candidate.registeredProgrammes.sports.total} programmes)
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {candidate.registeredProgrammes.sports.programmes.map((programme, index) => (
                                          <div
                                            key={`${programme.id}-${index}`}
                                            className="p-3 rounded-lg border bg-blue-50 border-blue-200"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h6 className="text-sm font-medium text-gray-900 mb-1">
                                                  {programme.name}
                                                </h6>
                                                <p className="text-xs text-gray-600">
                                                  Code: {programme.code}
                                                </p>
                                              </div>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {programme.positionType.charAt(0).toUpperCase() + programme.positionType.slice(1)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                              <span>Section: {programme.section.charAt(0).toUpperCase() + programme.section.slice(1).replace('-', ' ')}</span>
                                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                🏃 Sports
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Results Section */}
                                  {candidate.results.total.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-300">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                        🏆 Results & Achievements ({candidate.results.total.length})
                                      </h4>
                                      
                                      <div className="space-y-3">
                                        {candidate.results.total.map((result, index) => (
                                          <div
                                            key={`${result.programmeId}-${index}`}
                                            className={`p-3 rounded-lg border ${
                                              result.position === 'first' 
                                                ? 'bg-yellow-50 border-yellow-200' 
                                                : result.position === 'second'
                                                ? 'bg-gray-50 border-gray-200'
                                                : 'bg-orange-50 border-orange-200'
                                            }`}
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex-1">
                                                <h6 className="text-sm font-medium text-gray-900 mb-1">
                                                  {result.programmeName}
                                                </h6>
                                                <p className="text-xs text-gray-600">
                                                  Code: {result.programmeCode} • {result.category}{result.subcategory ? ` • ${result.subcategory}` : ''}
                                                </p>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                                  result.position === 'first' 
                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                    : result.position === 'second'
                                                    ? 'bg-gray-100 text-gray-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                  {result.position === 'first' ? '🥇 1st' : result.position === 'second' ? '🥈 2nd' : '🥉 3rd'}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                  {result.totalPoints} pts
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-600">
                                              <div className="flex items-center space-x-3">
                                                <span>Section: {result.section.charAt(0).toUpperCase() + result.section.slice(1).replace('-', ' ')}</span>
                                                <span>Type: {result.positionType.charAt(0).toUpperCase() + result.positionType.slice(1)}</span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                  Position: {result.positionPoints} pts
                                                </span>
                                                {result.grade && (
                                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    result.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                    result.grade === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                  }`}>
                                                    Grade {result.grade}: +{result.gradePoints} pts
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
            </div>
          )}

          {/* Arts Stage Tab */}
          {activeTab === 'arts-stage' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Arts Stage Candidates</h2>
              {renderCandidateTable(candidatesWithStats.filter(c => c.registeredProgrammes.artsStage.total > 0), 'artsStage')}
            </div>
          )}

          {/* Arts Non-Stage Tab */}
          {activeTab === 'arts-non-stage' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Arts Non-Stage Candidates</h2>
              {renderCandidateTable(candidatesWithStats.filter(c => c.registeredProgrammes.artsNonStage.total > 0), 'artsNonStage')}
            </div>
          )}

          {/* Sports Tab */}
          {activeTab === 'sports' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sports Candidates</h2>
              {renderCandidateTable(candidatesWithStats.filter(c => c.registeredProgrammes.sports.total > 0), 'sports')}
            </div>
          )}
        </div>

        {/* Instructions */}
        <ShowcaseSection title="How to Manage Candidates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-semibold text-blue-900 mb-2">Team Admins Add Candidates</h3>
              <p className="text-sm text-blue-700">
                Each team admin can add their own team members through the Team Admin Portal.
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-green-900 mb-2">Admin Monitors Progress</h3>
              <p className="text-sm text-green-700">
                View statistics, track registrations, and monitor team performance from this dashboard.
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-semibold text-purple-900 mb-2">Results & Rankings</h3>
              <p className="text-sm text-purple-700">
                Manage competition results and update candidate points through the Results page.
              </p>
            </div>
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Programme, ResultStatus, Team, Candidate } from '@/types';
import ResultReviewModal from '@/components/admin/ResultReviewModal';
import ResultCard from '@/components/admin/ResultCard';
import MarksSummary from '@/components/admin/MarksSummary';
import { useGrandMarks } from '@/contexts/GrandMarksContext';
import { getGradePoints } from '@/utils/markingSystem';

export default function CheckListPage() {
  const [pendingResults, setPendingResults] = useState<EnhancedResult[]>([]);
  const [checkedResults, setCheckedResults] = useState<EnhancedResult[]>([]);
  const [publishedResults, setPublishedResults] = useState<EnhancedResult[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmeParticipants, setProgrammeParticipants] = useState<any[]>([]);
  
  const { setGrandMarks, setIsCalculationActive } = useGrandMarks();
  const [selectedResult, setSelectedResult] = useState<EnhancedResult | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'checked' | 'calculation' | 'published' | 'summary'>('pending');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [checkedSearchTerm, setCheckedSearchTerm] = useState('');
  const [checkedFilterSection, setCheckedFilterSection] = useState('');
  const [checkedFilterCategory, setCheckedFilterCategory] = useState('');
  
  const [calculationResults, setCalculationResults] = useState<EnhancedResult[]>([]);
  const [grandMarksPreview, setGrandMarksPreview] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setIsCalculationActive(activeTab === 'calculation');
  }, [activeTab, setIsCalculationActive]);

  const fetchData = async () => {
    try {
      const [pendingRes, checkedRes, publishedRes, programmesRes, teamsRes, candidatesRes, participantsRes] = await Promise.all([
        fetch('/api/results/status?status=pending'),
        fetch('/api/results/status?status=checked'),
        fetch('/api/results/status?status=published'),
        fetch('/api/programmes'),
        fetch('/api/teams'),
        fetch('/api/candidates'),
        fetch('/api/programme-participants')
      ]);

      if (!pendingRes.ok || !checkedRes.ok || !publishedRes.ok || !programmesRes.ok || !teamsRes.ok || !candidatesRes.ok || !participantsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [pending, checked, published, programmesData, teamsData, candidatesData, participantsData] = await Promise.all([
        pendingRes.json(),
        checkedRes.json(),
        publishedRes.json(),
        programmesRes.json(),
        teamsRes.json(),
        candidatesRes.json(),
        participantsRes.json()
      ]);

      const enrichResults = (results: EnhancedResult[]) => {
        return results.map(result => {
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
            programmeSection: programme?.section
          };
        });
      };

      setPendingResults(enrichResults(pending));
      setCheckedResults(enrichResults(checked));
      setPublishedResults(enrichResults(published));
      setProgrammes(programmesData);
      setTeams(teamsData);
      setCandidates(candidatesData);
      setProgrammeParticipants(participantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleReviewResult = (result: EnhancedResult) => {
    setSelectedResult(result);
    setShowReviewModal(true);
  };

  const handleStatusUpdate = async (resultId: string, newStatus: ResultStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/results/${resultId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, notes })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      await fetchData();
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkStatusUpdate = async (resultIds: string[], newStatus: ResultStatus) => {
    try {
      const response = await fetch('/api/results/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resultIds, status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update statuses');
      }

      const result = await response.json();
      alert(`Updated ${result.modifiedCount} results`);
      await fetchData();
    } catch (error) {
      console.error('Error updating statuses:', error);
    }
  };

  const getProgrammeName = (result: EnhancedResult) => {
    if (result.programmeName && result.programmeCode) {
      return `${result.programmeName} (${result.programmeCode})`;
    }

    const programme = programmes.find(p => p._id?.toString() === result.programmeId);
    return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
  };

  const getFilteredResults = (results: EnhancedResult[]) => {
    return results.filter(result => {
      const programmeName = getProgrammeName(result).toLowerCase();
      const matchesSearch = searchTerm === '' || 
        programmeName.includes(searchTerm.toLowerCase()) ||
        result.programmeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.section.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSection = filterSection === '' || result.section === filterSection;
      const matchesCategory = filterCategory === '' || result.programmeCategory === filterCategory;
      
      return matchesSearch && matchesSection && matchesCategory;
    });
  };

  const getFilteredCheckedResults = (results: EnhancedResult[]) => {
    return results.filter(result => {
      const programmeName = getProgrammeName(result).toLowerCase();
      const matchesSearch = checkedSearchTerm === '' || 
        programmeName.includes(checkedSearchTerm.toLowerCase()) ||
        result.programmeCode?.toLowerCase().includes(checkedSearchTerm.toLowerCase()) ||
        result.section.toLowerCase().includes(checkedSearchTerm.toLowerCase());
      
      const matchesSection = checkedFilterSection === '' || result.section === checkedFilterSection;
      const matchesCategory = checkedFilterCategory === '' || result.programmeCategory === checkedFilterCategory;
      
      return matchesSearch && matchesSection && matchesCategory;
    });
  };

  const getAvailableSections = () => {
    const sections = [...new Set(pendingResults.map(r => r.section))];
    return sections.sort();
  };

  const getAvailableCategories = () => {
    const categories = [...new Set(pendingResults.map(r => r.programmeCategory).filter(Boolean))];
    return categories.sort();
  };

  const getAvailableCheckedSections = () => {
    const sections = [...new Set(checkedResults.map(r => r.section))];
    return sections.sort();
  };

  const getAvailableCheckedCategories = () => {
    const categories = [...new Set(checkedResults.map(r => r.programmeCategory).filter(Boolean))];
    return categories.sort();
  };

  const handleAddToCalculation = (result: EnhancedResult) => {
    if (!calculationResults.find(r => r._id === result._id)) {
      setCalculationResults(prev => [...prev, result]);
      updateGrandMarksPreview([...calculationResults, result]);
    }
  };

  const handleRemoveFromCalculation = (resultId: string) => {
    const updatedResults = calculationResults.filter(r => r._id?.toString() !== resultId);
    setCalculationResults(updatedResults);
    updateGrandMarksPreview(updatedResults);
  };

  const updateGrandMarksPreview = (results: EnhancedResult[]) => {
    const teamTotals: { [teamCode: string]: { name: string; points: number; results: number } } = {};
    
    teams.forEach(team => {
      teamTotals[team.code] = { name: team.name, points: 0, results: 0 };
    });
    
    publishedResults.forEach(result => {
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
    });
    
    results.forEach(result => {
      if (result.firstPlace && result.firstPlace.length > 0) {
        result.firstPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.secondPlace && result.secondPlace.length > 0) {
        result.secondPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.thirdPlace && result.thirdPlace.length > 0) {
        result.thirdPlace.forEach(winner => {
          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
          if (teamTotals[teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamTotals[teamCode].points += totalPoints;
            teamTotals[teamCode].results += 1;
          }
        });
      }
      
      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
        result.firstPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.firstPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
      
      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
        result.secondPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.secondPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
      
      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
        result.thirdPlaceTeams.forEach(winner => {
          if (teamTotals[winner.teamCode]) {
            const gradePoints = getGradePoints(winner.grade || '');
            const totalPoints = result.thirdPoints + gradePoints;
            teamTotals[winner.teamCode].points += totalPoints;
            teamTotals[winner.teamCode].results += 1;
          }
        });
      }
    });

    const preview = Object.entries(teamTotals)
      .map(([code, data]) => {
        const teamData = teams.find(t => t.code === code);
        return { 
          teamCode: code, 
          ...data,
          color: teamData?.color || '#6366f1'
        };
      })
      .sort((a, b) => b.points - a.points);
    
    setGrandMarksPreview(preview);
    setGrandMarks(preview);
  };

  const getTeamCodeFromChestNumber = (chestNumber: string) => {
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
    
    const availableTeamCodes = teams.map(t => t.code.toUpperCase());
    for (const teamCode of availableTeamCodes) {
      if (upperChestNumber.includes(teamCode)) {
        return teamCode;
      }
    }
    
    return '';
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-2">📋</span>
          Result Check List
        </h1>
        <p className="text-gray-600">
          Review and verify competition results before publication
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending Review
              {pendingResults.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-800 py-0.5 px-2 rounded-full text-xs">
                  {pendingResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('checked')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'checked'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Checked Results
              {checkedResults.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 py-0.5 px-2 rounded-full text-xs">
                  {checkedResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              📊 Checked Marks Summary
              {checkedResults.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-800 py-0.5 px-2 rounded-full text-xs">
                  {checkedResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('calculation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'calculation'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              🧮 Calculation
              {checkedResults.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full text-xs">
                  {checkedResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'published'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              📊 Published Summary
              {publishedResults.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">
                  {publishedResults.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Checked Results Tab */}
      {activeTab === 'checked' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Checked Results ({getFilteredCheckedResults(checkedResults).length} of {checkedResults.length})
            </h2>
            {checkedResults.length > 0 && (
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const resultIds = checkedResults.map(r => r._id!.toString());
                    handleBulkStatusUpdate(resultIds, ResultStatus.PUBLISHED);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🚀 Publish All
                </button>
                <button
                  onClick={() => {
                    const resultIds = checkedResults.map(r => r._id!.toString());
                    handleBulkStatusUpdate(resultIds, ResultStatus.PENDING);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  ↩️ Move to Pending
                </button>
              </div>
            )}
          </div>

          {checkedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Checked Results</h3>
              <p className="text-gray-500">Results will appear here after being reviewed and checked.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFilteredCheckedResults(checkedResults).map((result) => (
                <ResultCard
                  key={result._id?.toString()}
                  result={result}
                  programmeName={getProgrammeName(result)}
                  onReview={() => handleReviewResult(result)}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
                  actionMode="checkOnly"
                  teams={teams}
                  candidates={candidates}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checked Marks Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📊 Checked Results Marks Summary
            </h2>
            <p className="text-gray-600">
              Comprehensive breakdown of team performance and marks distribution from checked results only.
            </p>
          </div>

          {checkedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Checked Results</h3>
              <p className="text-gray-500">
                Marks summary will appear here after results are checked and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Stats for Checked Results */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">📊 Checked Results</h3>
                  <div className="text-2xl font-bold text-orange-700">{checkedResults.length}</div>
                  <p className="text-sm text-orange-600">Total programmes</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🏆 Active Teams</h3>
                  <div className="text-2xl font-bold text-green-700">{teams.length}</div>
                  <p className="text-sm text-green-600">Competing teams</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🎯 Total Points</h3>
                  <div className="text-2xl font-bold text-purple-700">
                    {(() => {
                      let totalPoints = 0;
                      checkedResults.forEach(result => {
                        // Calculate individual winners with grade points
                        if (result.firstPlace) {
                          result.firstPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.firstPoints + gradePoints;
                          });
                        }
                        if (result.secondPlace) {
                          result.secondPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.secondPoints + gradePoints;
                          });
                        }
                        if (result.thirdPlace) {
                          result.thirdPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.thirdPoints + gradePoints;
                          });
                        }
                        
                        // Calculate team winners with grade points
                        if (result.firstPlaceTeams) {
                          result.firstPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.firstPoints + gradePoints;
                          });
                        }
                        if (result.secondPlaceTeams) {
                          result.secondPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.secondPoints + gradePoints;
                          });
                        }
                        if (result.thirdPlaceTeams) {
                          result.thirdPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.thirdPoints + gradePoints;
                          });
                        }
                      });
                      return Math.round(totalPoints);
                    })()}
                  </div>
                  <p className="text-sm text-purple-600">Points to be awarded (with grades)</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">👥 Participants</h3>
                  <div className="text-2xl font-bold text-blue-700">
                    {(() => {
                      const uniqueParticipants = new Set();
                      checkedResults.forEach(result => {
                        result.firstPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                        result.secondPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                        result.thirdPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                      });
                      return uniqueParticipants.size;
                    })()}
                  </div>
                  <p className="text-sm text-blue-600">Winners recorded</p>
                </div>
              </div>

              {/* Enhanced Marks Summary Dashboard for Checked Results */}
              <MarksSummary results={checkedResults} showDailyProgress={true} />
            </div>
          )}
        </div>
      )}

      {/* Calculation Tab */}
      {activeTab === 'calculation' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🧮 Grand Marks Calculation
            </h2>
            <p className="text-gray-600">
              Drag and drop checked results to calculate combined grand marks with published results.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Before Calculation (Checked Results) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📋</span>
                  Checked Results
                </h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  {checkedResults.length} Results
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {checkedResults.map((result) => (
                  <div
                    key={result._id?.toString()}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(result));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {getProgrammeName(result)}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                          <span className="capitalize">{result.section.replace('-', ' ')}</span>
                          <span>•</span>
                          <span className="capitalize">{result.positionType}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Drag →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - After Calculation (Grand Marks Preview) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🏆</span>
                  Grand Marks Preview
                </h3>
                <button 
                  onClick={() => {
                    setCalculationResults(checkedResults);
                    updateGrandMarksPreview(checkedResults);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  📊 Calculate All
                </button>
              </div>

              <div
                className="min-h-96 border-2 border-dashed border-gray-300 rounded-lg p-4"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  
                  try {
                    const resultData = JSON.parse(e.dataTransfer.getData('application/json'));
                    handleAddToCalculation(resultData);
                  } catch (error) {
                    console.error('Error processing dropped result:', error);
                  }
                }}
              >
                {calculationResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-gray-400 text-4xl mb-4">🎯</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Drop Results Here</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      Drag checked results from the left to calculate grand marks
                    </p>
                    <div className="bg-gray-100 rounded-lg p-4 text-left">
                      <h5 className="font-medium text-gray-900 mb-2">Calculation Preview:</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Position Points + Grade Points</div>
                        <div>• Team Rankings Update</div>
                        <div>• Grand Total Calculation</div>
                        <div>• Final Standings Preview</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Added to Calculation ({calculationResults.length})
                      </h4>
                      <button
                        onClick={() => {
                          setCalculationResults([]);
                          setGrandMarksPreview([]);
                          setGrandMarks([]);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {calculationResults.map((result) => (
                      <div
                        key={result._id?.toString()}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">
                              {getProgrammeName(result)}
                            </h5>
                            <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                              <span className="capitalize">{result.section.replace('-', ' ')}</span>
                              <span>•</span>
                              <span className="capitalize">{result.positionType}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCalculation(result._id!.toString())}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Grand Marks Preview</h5>
                      {grandMarksPreview.length > 0 ? (
                        <div className="space-y-2">
                          {grandMarksPreview.slice(0, 5).map((team, index) => (
                            <div key={team.teamCode} className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                #{index + 1} {team.name}
                              </span>
                              <span className="text-blue-700 font-bold">
                                {Math.round(team.points)} pts
                              </span>
                            </div>
                          ))}
                          {grandMarksPreview.length > 5 && (
                            <div className="text-xs text-gray-600 text-center">
                              ... and {grandMarksPreview.length - 5} more teams
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Add results to see grand marks preview
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Combined Grand Marks Preview */}
          {calculationResults.length > 0 && grandMarksPreview.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                  <span className="mr-2">🏆</span>
                  Combined Grand Marks Preview
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-700 bg-blue-100 px-2 py-1 rounded-full">
                    {publishedResults.length} Published
                  </span>
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                    {calculationResults.length} Calculating
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {grandMarksPreview.map((team, index) => (
                  <div
                    key={team.teamCode}
                    className="bg-white rounded-lg border-2 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                    style={{ 
                      borderColor: team.color + '40',
                      backgroundColor: team.color + '08'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.teamCode}
                        </div>
                        <div className="text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold" style={{ color: team.color }}>
                          {Math.round(team.points)}
                        </div>
                        <div className="text-xs text-gray-600">points</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate" title={team.name}>
                        {team.name}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{team.results} results</span>
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{
                            backgroundColor: team.color,
                            width: `${Math.min((team.points / Math.max(...grandMarksPreview.map(t => t.points))) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Published Results Tab */}
      {activeTab === 'published' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📊 Published Results Summary
            </h2>
            <p className="text-gray-600">
              Comprehensive overview of all published competition results and team standings.
            </p>
          </div>

          {publishedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Results</h3>
              <p className="text-gray-500">
                Results will appear here after being checked and published.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Published Results</h3>
                  <div className="text-2xl font-bold text-blue-700">{publishedResults.length}</div>
                  <p className="text-sm text-blue-600">Total programmes</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🏆 Active Teams</h3>
                  <div className="text-2xl font-bold text-green-700">{teams.length}</div>
                  <p className="text-sm text-green-600">Competing teams</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🎯 Total Points</h3>
                  <div className="text-2xl font-bold text-purple-700">
                    {(() => {
                      let totalPoints = 0;
                      publishedResults.forEach(result => {
                        // Calculate individual winners with grade points
                        if (result.firstPlace) {
                          result.firstPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.firstPoints + gradePoints;
                          });
                        }
                        if (result.secondPlace) {
                          result.secondPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.secondPoints + gradePoints;
                          });
                        }
                        if (result.thirdPlace) {
                          result.thirdPlace.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.thirdPoints + gradePoints;
                          });
                        }
                        
                        // Calculate team winners with grade points
                        if (result.firstPlaceTeams) {
                          result.firstPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.firstPoints + gradePoints;
                          });
                        }
                        if (result.secondPlaceTeams) {
                          result.secondPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.secondPoints + gradePoints;
                          });
                        }
                        if (result.thirdPlaceTeams) {
                          result.thirdPlaceTeams.forEach(winner => {
                            const gradePoints = getGradePoints(winner.grade || '');
                            totalPoints += result.thirdPoints + gradePoints;
                          });
                        }
                      });
                      return Math.round(totalPoints);
                    })()}
                  </div>
                  <p className="text-sm text-purple-600">Points awarded (with grades)</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">👥 Winners</h3>
                  <div className="text-2xl font-bold text-orange-700">
                    {(() => {
                      const uniqueWinners = new Set();
                      publishedResults.forEach(result => {
                        result.firstPlace?.forEach(winner => uniqueWinners.add(winner.chestNumber));
                        result.secondPlace?.forEach(winner => uniqueWinners.add(winner.chestNumber));
                        result.thirdPlace?.forEach(winner => uniqueWinners.add(winner.chestNumber));
                      });
                      return uniqueWinners.size;
                    })()}
                  </div>
                  <p className="text-sm text-orange-600">Individual winners</p>
                </div>
              </div>

              {/* Enhanced Marks Summary Dashboard with Team Earnings Integration */}
              <MarksSummary results={publishedResults} showDailyProgress={true} />
            </div>
          )}
        </div>
      )}

      {/* Pending Results Tab */}
      {activeTab === 'pending' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Results ({getFilteredResults(pendingResults).length} of {pendingResults.length})
            </h2>
            {pendingResults.length > 0 && (
              <button
                onClick={() => {
                  const resultIds = pendingResults.map(r => r._id!.toString());
                  handleBulkStatusUpdate(resultIds, ResultStatus.CHECKED);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✓ Check All
              </button>
            )}
          </div>

          {pendingResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Results</h3>
              <p className="text-gray-500">All results have been reviewed and checked.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFilteredResults(pendingResults).map((result) => (
                <ResultCard
                  key={result._id?.toString()}
                  result={result}
                  programmeName={getProgrammeName(result)}
                  onReview={() => handleReviewResult(result)}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
                  actionMode="checkOnly"
                  teams={teams}
                  candidates={candidates}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Review Modal */}
      {showReviewModal && selectedResult && (
        <ResultReviewModal
          result={selectedResult}
          programme={programmes.find(p => p._id?.toString() === selectedResult.programmeId)}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedResult(null);
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
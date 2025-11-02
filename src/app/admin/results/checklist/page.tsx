'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Programme, ResultStatus, Team, Candidate } from '@/types';
import ResultReviewModal from '@/components/admin/ResultReviewModal';
import ResultCard from '@/components/admin/ResultCard';
// Removed LoadingSpinner import for faster page load
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
  
  // Grand marks context
  const { setGrandMarks, setIsCalculationActive } = useGrandMarks();
  // Removed loading state for faster page load
  const [selectedResult, setSelectedResult] = useState<EnhancedResult | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'checked' | 'calculation' | 'published' | 'summary'>('pending');
  
  // Search and filter states for pending
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Search and filter states for checked
  const [checkedSearchTerm, setCheckedSearchTerm] = useState('');
  const [checkedFilterSection, setCheckedFilterSection] = useState('');
  const [checkedFilterCategory, setCheckedFilterCategory] = useState('');
  
  // Calculation tab states
  const [calculationResults, setCalculationResults] = useState<EnhancedResult[]>([]);
  const [grandMarksPreview, setGrandMarksPreview] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Update calculation active state when tab changes
  useEffect(() => {
    setIsCalculationActive(activeTab === 'calculation');
  }, [activeTab, setIsCalculationActive]);



  const fetchData = async () => {
    try {
      // Removed loading state for faster UI
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

      // Enrich results with programme information
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
    } finally {
      // No loading state to manage
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

      await fetchData(); // Refresh data
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
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating statuses:', error);
    }
  };

  const getProgrammeName = (result: EnhancedResult) => {
    // First try to use enriched data
    if (result.programmeName && result.programmeCode) {
      return `${result.programmeName} (${result.programmeCode})`;
    }

    // Fallback to finding programme by ID
    const programme = programmes.find(p => p._id?.toString() === result.programmeId);
    return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
  };

  // Filter and search functions
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

  // Filter function for checked results
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

  // Get unique sections and categories for filters
  const getAvailableSections = () => {
    const sections = [...new Set(pendingResults.map(r => r.section))];
    return sections.sort();
  };

  const getAvailableCategories = () => {
    const categories = [...new Set(pendingResults.map(r => r.programmeCategory).filter(Boolean))];
    return categories.sort();
  };

  // Get unique sections and categories for checked results filters
  const getAvailableCheckedSections = () => {
    const sections = [...new Set(checkedResults.map(r => r.section))];
    return sections.sort();
  };

  const getAvailableCheckedCategories = () => {
    const categories = [...new Set(checkedResults.map(r => r.programmeCategory).filter(Boolean))];
    return categories.sort();
  };

  // Calculation functions
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
    // Initialize team totals
    const teamTotals: { [teamCode: string]: { name: string; points: number; results: number } } = {};
    
    // Initialize all teams with 0 points
    teams.forEach(team => {
      teamTotals[team.code] = { name: team.name, points: 0, results: 0 };
    });
    
    // First, add points from all published results (baseline)
    publishedResults.forEach(result => {
      // Individual/Group results - assign points to specific teams based on chest numbers
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
      
      // Team results - assign points directly to teams
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
    
    // Then, add points from checked results being calculated
    results.forEach(result => {
      // Individual/Group results - assign points to specific teams based on chest numbers
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
      
      // Team results - assign points directly to teams
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

    // Convert to array and sort by points, include team colors
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
    setGrandMarks(preview); // Update context for header display
  };

  // Helper function to extract team code from chest number
  const getTeamCodeFromChestNumber = (chestNumber: string) => {
    if (!chestNumber) return '';
    
    const upperChestNumber = chestNumber.toUpperCase();
    
    // Method 1: Check if it starts with 3 letters (like SMD001, INT001, AQS001)
    const threeLetterMatch = upperChestNumber.match(/^([A-Z]{3})/);
    if (threeLetterMatch) {
      return threeLetterMatch[1];
    }
    
    // Method 2: Check if it starts with 2 letters (like SM001, IN001, AQ001)
    const twoLetterMatch = upperChestNumber.match(/^([A-Z]{2})/);
    if (twoLetterMatch) {
      const teamCode = twoLetterMatch[1];
      // Map 2-letter codes to 3-letter team codes
      if (teamCode === 'SM') return 'SMD';
      if (teamCode === 'IN') return 'INT';
      if (teamCode === 'AQ') return 'AQS';
      return teamCode;
    }
    
    // Method 3: Single letter (like A001, B002) 
    if (upperChestNumber.match(/^[A-Z]/)) {
      return upperChestNumber.charAt(0);
    }
    
    // Method 4: Pure numbers (like 605, 402, 211) - map to teams
    const num = parseInt(chestNumber);
    if (!isNaN(num)) {
      if (num >= 600 && num < 700) {
        return 'AQS'; // Team 6xx = AQS (AQSA)
      } else if (num >= 400 && num < 500) {
        return 'INT'; // Team 4xx = INT (INTIFADA)  
      } else if (num >= 200 && num < 300) {
        return 'SMD'; // Team 2xx = SMD (SUMUD)
      } else if (num >= 100 && num < 200) {
        return 'A'; // Team 1xx = Team A
      } else {
        // Default mapping based on first digit
        return chestNumber.charAt(0);
      }
    }
    
    // Method 5: Fallback - try to find matching team code in available teams
    const availableTeamCodes = teams.map(t => t.code.toUpperCase());
    for (const teamCode of availableTeamCodes) {
      if (upperChestNumber.includes(teamCode)) {
        return teamCode;
      }
    }
    
    return '';
  };

  // Note: Using centralized getGradePoints from markingSystem utility

  // Removed loading spinner - show content immediately

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

          {/* Search and Filter Controls */}
          {pendingResults.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search by programme name, code, or section..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-48">
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Sections</option>
                    {getAvailableSections().map(section => (
                      <option key={section} value={section}>
                        {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-48">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Categories</option>
                    {getAvailableCategories().map(category => (
                      <option key={category} value={category}>
                        {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchTerm || filterSection || filterCategory) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterSection('');
                      setFilterCategory('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {pendingResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Results</h3>
              <p className="text-gray-500">All results have been reviewed and checked.</p>
            </div>
          ) : getFilteredResults(pendingResults).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
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

          {/* Search and Filter Controls for Checked Results */}
          {checkedResults.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search checked results by programme name, code, or section..."
                  value={checkedSearchTerm}
                  onChange={(e) => setCheckedSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-700"
                />
                {checkedSearchTerm && (
                  <button
                    onClick={() => setCheckedSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-48">
                  <select
                    value={checkedFilterSection}
                    onChange={(e) => setCheckedFilterSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Sections</option>
                    {getAvailableCheckedSections().map(section => (
                      <option key={section} value={section}>
                        {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-48">
                  <select
                    value={checkedFilterCategory}
                    onChange={(e) => setCheckedFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-700 text-sm"
                  >
                    <option value="">All Categories</option>
                    {getAvailableCheckedCategories().map(category => (
                      <option key={category} value={category}>
                        {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {(checkedSearchTerm || checkedFilterSection || checkedFilterCategory) && (
                  <button
                    onClick={() => {
                      setCheckedSearchTerm('');
                      setCheckedFilterSection('');
                      setCheckedFilterCategory('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {checkedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Checked Results</h3>
              <p className="text-gray-500">Results will appear here after being reviewed and checked.</p>
            </div>
          ) : getFilteredCheckedResults(checkedResults).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
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
            <MarksSummary results={checkedResults} />
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
              Drag checked results to preview combined grand marks (published + checked results).
            </p>
          </div>

          {checkedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🧮</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Checked Results</h3>
              <p className="text-gray-500">
                Results must be checked before they can be calculated for grand marks.
              </p>
            </div>
          ) : (
            <div>
              {/* Detailed Overview Section */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Published Results</h3>
                  <div className="text-2xl font-bold text-blue-700">{publishedResults.length}</div>
                  <p className="text-sm text-blue-600">Already published</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">✅ Checked Results</h3>
                  <div className="text-2xl font-bold text-orange-700">{checkedResults.length}</div>
                  <p className="text-sm text-orange-600">Ready for calculation</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">🎯 In Calculation</h3>
                  <div className="text-2xl font-bold text-green-700">{calculationResults.length}</div>
                  <p className="text-sm text-green-600">Being calculated</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">🏆 Combined Total</h3>
                  <div className="text-2xl font-bold text-purple-700">{publishedResults.length + calculationResults.length}</div>
                  <p className="text-sm text-purple-600">Grand marks preview</p>
                </div>
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
                              setGrandMarks([]); // Clear header preview
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
                    {grandMarksPreview.map((team, index) => {
                      const teamData = teams.find(t => t.code === team.teamCode);
                      const teamColor = teamData?.color || '#6366f1';
                      
                      return (
                        <div
                          key={team.teamCode}
                          className="p-4 rounded-lg border-2 transition-all duration-200 bg-white border-gray-200 shadow-sm hover:shadow-md"
                          style={{ 
                            borderColor: teamColor + '40',
                            backgroundColor: teamColor + '08'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: teamColor }}
                              >
                                {index + 1}
                              </div>
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                style={{ backgroundColor: teamColor }}
                              >
                                {team.teamCode}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{team.name}</h4>
                                <p className="text-xs text-gray-600">{team.teamCode}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div 
                                className="text-lg font-bold"
                                style={{ color: teamColor }}
                              >
                                {Math.round(team.points)}
                              </div>
                              <p className="text-xs text-gray-600">points</p>
                            </div>
                          </div>
                          
                          {index < 3 && (
                            <div className="mt-2 flex items-center justify-center">
                              <span 
                                className="text-xs text-white px-2 py-1 rounded-full font-medium"
                                style={{ backgroundColor: teamColor }}
                              >
                                {index === 0 ? '🥇 Gold' : index === 1 ? '🥈 Silver' : '🥉 Bronze'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {grandMarksPreview.length > 4 && (
                    <div className="mt-4 text-center">
                      <button className="text-purple-700 hover:text-purple-900 text-sm font-medium">
                        View All {grandMarksPreview.length} Teams →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Published Summary Tab */}
      {activeTab === 'published' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📊 Published Results Summary
            </h2>
            <p className="text-gray-600">
              Complete team performance summary from all published results.
            </p>
            <div className="mt-4 flex space-x-3">
              <a
                href="/results"
                target="_blank"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                👁️ View Public Results
              </a>
            </div>
          </div>
          
          {publishedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Results</h3>
              <p className="text-gray-500">Results summary will appear here after being published to the public.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Stats */}
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
                        // Count all position points
                        const firstCount = (result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0);
                        const secondCount = (result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0);
                        const thirdCount = (result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0);
                        
                        totalPoints += (firstCount * result.firstPoints) + (secondCount * result.secondPoints) + (thirdCount * result.thirdPoints);
                      });
                      return Math.round(totalPoints);
                    })()}
                  </div>
                  <p className="text-sm text-purple-600">Points awarded</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">👥 Participants</h3>
                  <div className="text-2xl font-bold text-orange-700">
                    {(() => {
                      const uniqueParticipants = new Set();
                      publishedResults.forEach(result => {
                        result.firstPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                        result.secondPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                        result.thirdPlace?.forEach(winner => uniqueParticipants.add(winner.chestNumber));
                      });
                      return uniqueParticipants.size;
                    })()}
                  </div>
                  <p className="text-sm text-orange-600">Winners recorded</p>
                </div>
              </div>

              {/* Team Earnings Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <span className="mr-2">🏆</span>
                  Team Earnings from Published Results
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(() => {
                    // Calculate team earnings from published results
                    const teamEarnings: { [teamCode: string]: { name: string; points: number; color: string; programmes: number } } = {};
                    
                    // Initialize all teams
                    teams.forEach(team => {
                      teamEarnings[team.code] = { 
                        name: team.name, 
                        points: 0, 
                        color: team.color || '#6366f1',
                        programmes: 0
                      };
                    });
                    
                    // Calculate points from published results
                    publishedResults.forEach(result => {
                      // Individual/Group results
                      if (result.firstPlace && result.firstPlace.length > 0) {
                        result.firstPlace.forEach(winner => {
                          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                          if (teamEarnings[teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[teamCode].points += result.firstPoints + gradePoints;
                            teamEarnings[teamCode].programmes += 1;
                          }
                        });
                      }
                      
                      if (result.secondPlace && result.secondPlace.length > 0) {
                        result.secondPlace.forEach(winner => {
                          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                          if (teamEarnings[teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[teamCode].points += result.secondPoints + gradePoints;
                            teamEarnings[teamCode].programmes += 1;
                          }
                        });
                      }
                      
                      if (result.thirdPlace && result.thirdPlace.length > 0) {
                        result.thirdPlace.forEach(winner => {
                          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                          if (teamEarnings[teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[teamCode].points += result.thirdPoints + gradePoints;
                            teamEarnings[teamCode].programmes += 1;
                          }
                        });
                      }
                      
                      // Team results
                      if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
                        result.firstPlaceTeams.forEach(winner => {
                          if (teamEarnings[winner.teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[winner.teamCode].points += result.firstPoints + gradePoints;
                            teamEarnings[winner.teamCode].programmes += 1;
                          }
                        });
                      }
                      
                      if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
                        result.secondPlaceTeams.forEach(winner => {
                          if (teamEarnings[winner.teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[winner.teamCode].points += result.secondPoints + gradePoints;
                            teamEarnings[winner.teamCode].programmes += 1;
                          }
                        });
                      }
                      
                      if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
                        result.thirdPlaceTeams.forEach(winner => {
                          if (teamEarnings[winner.teamCode]) {
                            const gradePoints = getGradePoints(winner.grade || '');
                            teamEarnings[winner.teamCode].points += result.thirdPoints + gradePoints;
                            teamEarnings[winner.teamCode].programmes += 1;
                          }
                        });
                      }
                    });
                    
                    // Sort teams by points
                    const sortedTeams = Object.entries(teamEarnings)
                      .map(([code, data]) => ({ teamCode: code, ...data }))
                      .sort((a, b) => b.points - a.points);
                    
                    return sortedTeams.map((team, index) => (
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
                            <span>{team.programmes} programmes</span>
                            <span>#{index + 1}</span>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-1000"
                              style={{
                                backgroundColor: team.color,
                                width: `${Math.min((team.points / Math.max(...sortedTeams.map(t => t.points))) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
              
              {/* Detailed Programme Results with Prizes and Grades */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">🏅</span>
                    Programme Results - Prizes & Grades Details
                  </h3>
                  <div className="text-sm text-gray-600">
                    {publishedResults.length} programmes published
                  </div>
                </div>
                
                {/* Search and Filter for Programme Results */}
                {publishedResults.length > 0 && (
                  <div className="mb-6 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">🔍</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search programmes by name, section, or type..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
                        onChange={(e) => {
                          const searchValue = e.target.value.toLowerCase();
                          const programmeCards = document.querySelectorAll('[data-programme-card]');
                          programmeCards.forEach(card => {
                            const programmeName = card.getAttribute('data-programme-name')?.toLowerCase() || '';
                            const programmeSection = card.getAttribute('data-programme-section')?.toLowerCase() || '';
                            const programmeType = card.getAttribute('data-programme-type')?.toLowerCase() || '';
                            
                            if (programmeName.includes(searchValue) || 
                                programmeSection.includes(searchValue) || 
                                programmeType.includes(searchValue)) {
                              (card as HTMLElement).style.display = 'block';
                            } else {
                              (card as HTMLElement).style.display = 'none';
                            }
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Programme Results Statistics */}
                {publishedResults.length > 0 && (
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-2xl font-bold text-yellow-700">
                        {publishedResults.reduce((sum, result) => 
                          sum + (result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0), 0
                        )}
                      </div>
                      <div className="text-sm text-yellow-600">🥇 First Places</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-700">
                        {publishedResults.reduce((sum, result) => 
                          sum + (result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0), 0
                        )}
                      </div>
                      <div className="text-sm text-gray-600">🥈 Second Places</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="text-2xl font-bold text-orange-700">
                        {publishedResults.reduce((sum, result) => 
                          sum + (result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0), 0
                        )}
                      </div>
                      <div className="text-sm text-orange-600">🥉 Third Places</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-700">
                        {publishedResults.reduce((sum, result) => {
                          const gradeCount = 
                            (result.firstPlace?.filter(w => w.grade).length || 0) +
                            (result.secondPlace?.filter(w => w.grade).length || 0) +
                            (result.thirdPlace?.filter(w => w.grade).length || 0) +
                            (result.firstPlaceTeams?.filter(w => w.grade).length || 0) +
                            (result.secondPlaceTeams?.filter(w => w.grade).length || 0) +
                            (result.thirdPlaceTeams?.filter(w => w.grade).length || 0);
                          return sum + gradeCount;
                        }, 0)}
                      </div>
                      <div className="text-sm text-green-600">📊 With Grades</div>
                    </div>
                  </div>
                )}
                
                {publishedResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No published results to display</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {publishedResults.map((result, resultIndex) => {
                      const programmeName = getProgrammeName(result);
                      
                      return (
                        <div 
                          key={result._id?.toString() || resultIndex} 
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          data-programme-card
                          data-programme-name={programmeName}
                          data-programme-section={result.section}
                          data-programme-type={result.positionType}
                        >
                          {/* Programme Header */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{programmeName}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {result.section}
                                </span>
                                <span className="capitalize bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  {result.positionType}
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  Points: {result.firstPoints}-{result.secondPoints}-{result.thirdPoints}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Results Display */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* First Place */}
                            {((result.firstPlace && result.firstPlace.length > 0) || (result.firstPlaceTeams && result.firstPlaceTeams.length > 0)) && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h5 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                  <span className="mr-2">🥇</span>
                                  First Place ({result.firstPoints} pts)
                                </h5>
                                <div className="space-y-2">
                                  {/* Individual/Group Winners */}
                                  {result.firstPlace?.map((winner, index) => {
                                    const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                    const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                                    const team = teams.find(t => t.code === teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.firstPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-300">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                            <div className="text-xs text-gray-600">{candidate?.name || 'Unknown'}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-yellow-800">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Team Winners */}
                                  {result.firstPlaceTeams?.map((winner, index) => {
                                    const team = teams.find(t => t.code === winner.teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.firstPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-300">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {winner.teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{team?.name || winner.teamCode}</div>
                                            <div className="text-xs text-gray-600">Team Result</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-yellow-800">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Second Place */}
                            {((result.secondPlace && result.secondPlace.length > 0) || (result.secondPlaceTeams && result.secondPlaceTeams.length > 0)) && (
                              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                                  <span className="mr-2">🥈</span>
                                  Second Place ({result.secondPoints} pts)
                                </h5>
                                <div className="space-y-2">
                                  {/* Individual/Group Winners */}
                                  {result.secondPlace?.map((winner, index) => {
                                    const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                    const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                                    const team = teams.find(t => t.code === teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.secondPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-400">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                            <div className="text-xs text-gray-600">{candidate?.name || 'Unknown'}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-gray-700">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Team Winners */}
                                  {result.secondPlaceTeams?.map((winner, index) => {
                                    const team = teams.find(t => t.code === winner.teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.secondPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-400">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {winner.teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{team?.name || winner.teamCode}</div>
                                            <div className="text-xs text-gray-600">Team Result</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-gray-700">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Third Place */}
                            {((result.thirdPlace && result.thirdPlace.length > 0) || (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0)) && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <h5 className="font-semibold text-orange-700 mb-3 flex items-center">
                                  <span className="mr-2">🥉</span>
                                  Third Place ({result.thirdPoints} pts)
                                </h5>
                                <div className="space-y-2">
                                  {/* Individual/Group Winners */}
                                  {result.thirdPlace?.map((winner, index) => {
                                    const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                    const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                                    const team = teams.find(t => t.code === teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.thirdPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-300">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                            <div className="text-xs text-gray-600">{candidate?.name || 'Unknown'}</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-orange-700">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Team Winners */}
                                  {result.thirdPlaceTeams?.map((winner, index) => {
                                    const team = teams.find(t => t.code === winner.teamCode);
                                    const gradePoints = getGradePoints(winner.grade || '');
                                    const totalPoints = result.thirdPoints + gradePoints;
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-300">
                                        <div className="flex items-center space-x-3">
                                          <div 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: team?.color || '#6366f1' }}
                                          >
                                            {winner.teamCode}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{team?.name || winner.teamCode}</div>
                                            <div className="text-xs text-gray-600">Team Result</div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {winner.grade && (
                                            <div className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full mb-1">
                                              Grade {winner.grade} (+{gradePoints})
                                            </div>
                                          )}
                                          <div className="font-bold text-orange-700">{totalPoints} pts</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Complete Programme Participants Details */}
                          <div className="mt-6 pt-4 border-t border-gray-300">
                            <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                              <span className="mr-2">📋</span>
                              Complete Programme Details
                            </h5>
                            
                            {(() => {
                              // Find programme participants for this result
                              const programme = programmes.find(p => 
                                p._id?.toString() === result.programmeId ||
                                result.programme?.includes(p.name) ||
                                result.programme?.includes(p.code)
                              );
                              
                              const participants = programmeParticipants.filter(pp => 
                                pp.programmeId === result.programmeId ||
                                (programme && pp.programmeId === programme._id?.toString())
                              );
                              
                              // Get all participants from registrations
                              const allRegisteredParticipants = participants.flatMap(pp => 
                                pp.participants.map((chestNumber: string) => {
                                  const candidate = candidates.find(c => c.chestNumber === chestNumber);
                                  const teamCode = getTeamCodeFromChestNumber(chestNumber);
                                  const team = teams.find(t => t.code === teamCode);
                                  return {
                                    chestNumber,
                                    candidate,
                                    teamCode,
                                    team,
                                    registrationTeam: pp.teamCode
                                  };
                                })
                              );
                              
                              // Get all winners (prize winners - both individual and team)
                              const allWinners = [
                                ...(result.firstPlace?.map(w => ({ ...w, position: 'first', positionPoints: result.firstPoints, type: 'individual' })) || []),
                                ...(result.secondPlace?.map(w => ({ ...w, position: 'second', positionPoints: result.secondPoints, type: 'individual' })) || []),
                                ...(result.thirdPlace?.map(w => ({ ...w, position: 'third', positionPoints: result.thirdPoints, type: 'individual' })) || [])
                              ];
                              
                              // Get team winners
                              const allTeamWinners = [
                                ...(result.firstPlaceTeams?.map(w => ({ ...w, position: 'first', positionPoints: result.firstPoints, type: 'team' })) || []),
                                ...(result.secondPlaceTeams?.map(w => ({ ...w, position: 'second', positionPoints: result.secondPoints, type: 'team' })) || []),
                                ...(result.thirdPlaceTeams?.map(w => ({ ...w, position: 'third', positionPoints: result.thirdPoints, type: 'team' })) || [])
                              ];
                              
                              // Get participation grade participants
                              const participationGradeParticipants = result.participationGrades || [];
                              const participationTeamGrades = result.participationTeamGrades || [];
                              
                              // Combine and categorize all participants
                              const categorizedParticipants = {
                                winners: allWinners,
                                teamWinners: allTeamWinners,
                                gradeParticipants: participationGradeParticipants,
                                teamGradeParticipants: participationTeamGrades,
                                allRegistered: allRegisteredParticipants
                              };
                              
                              return (
                                <div className="space-y-4">
                                  {/* Prize Winners Section */}
                                  {categorizedParticipants.winners.length > 0 && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                                      <h6 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                        <span className="mr-2">🏆</span>
                                        Prize Winners ({categorizedParticipants.winners.length})
                                      </h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categorizedParticipants.winners.map((winner, index) => {
                                          const candidate = candidates.find(c => c.chestNumber === winner.chestNumber);
                                          const teamCode = getTeamCodeFromChestNumber(winner.chestNumber);
                                          const team = teams.find(t => t.code === teamCode);
                                          const gradePoints = getGradePoints(winner.grade || '');
                                          const totalPoints = winner.positionPoints + gradePoints;
                                          
                                          return (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-yellow-300 shadow-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                    style={{ backgroundColor: team?.color || '#6366f1' }}
                                                  >
                                                    {teamCode}
                                                  </div>
                                                  <span className="text-lg">
                                                    {winner.position === 'first' ? '🥇' : winner.position === 'second' ? '🥈' : '🥉'}
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-bold text-yellow-700">{totalPoints} pts</div>
                                                  {winner.grade && (
                                                    <div className="text-xs text-yellow-600">Grade {winner.grade}</div>
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="font-medium text-gray-900">{winner.chestNumber}</div>
                                                <div className="text-sm text-gray-600">{candidate?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500 capitalize">{winner.position} place</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Team Winners Section */}
                                  {categorizedParticipants.teamWinners.length > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                      <h6 className="font-semibold text-green-800 mb-3 flex items-center">
                                        <span className="mr-2">🏆</span>
                                        Team Prize Winners ({categorizedParticipants.teamWinners.length})
                                      </h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categorizedParticipants.teamWinners.map((winner, index) => {
                                          const team = teams.find(t => t.code === winner.teamCode);
                                          const gradePoints = getGradePoints(winner.grade || '');
                                          const totalPoints = winner.positionPoints + gradePoints;
                                          
                                          return (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-green-300 shadow-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                    style={{ backgroundColor: team?.color || '#6366f1' }}
                                                  >
                                                    {winner.teamCode}
                                                  </div>
                                                  <span className="text-lg">
                                                    {winner.position === 'first' ? '🥇' : winner.position === 'second' ? '🥈' : '🥉'}
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-bold text-green-700">{totalPoints} pts</div>
                                                  {winner.grade && (
                                                    <div className="text-xs text-green-600">Grade {winner.grade}</div>
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="font-medium text-gray-900">{team?.name || winner.teamCode}</div>
                                                <div className="text-sm text-gray-600">Team Result</div>
                                                <div className="text-xs text-gray-500 capitalize">{winner.position} place</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Participation Grade Participants */}
                                  {categorizedParticipants.gradeParticipants.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                      <h6 className="font-semibold text-blue-800 mb-3 flex items-center">
                                        <span className="mr-2">📊</span>
                                        Participation Grades ({categorizedParticipants.gradeParticipants.length})
                                      </h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categorizedParticipants.gradeParticipants.map((participant, index) => {
                                          const candidate = candidates.find(c => c.chestNumber === participant.chestNumber);
                                          const teamCode = getTeamCodeFromChestNumber(participant.chestNumber);
                                          const team = teams.find(t => t.code === teamCode);
                                          
                                          return (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-300 shadow-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                    style={{ backgroundColor: team?.color || '#6366f1' }}
                                                  >
                                                    {teamCode}
                                                  </div>
                                                  <span className="text-lg">📊</span>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-bold text-blue-700">{participant.points} pts</div>
                                                  <div className="text-xs text-blue-600">Grade {participant.grade}</div>
                                                </div>
                                              </div>
                                              <div>
                                                <div className="font-medium text-gray-900">{participant.chestNumber}</div>
                                                <div className="text-sm text-gray-600">{candidate?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">Participation</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Team Participation Grades */}
                                  {categorizedParticipants.teamGradeParticipants.length > 0 && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                                      <h6 className="font-semibold text-indigo-800 mb-3 flex items-center">
                                        <span className="mr-2">📊</span>
                                        Team Participation Grades ({categorizedParticipants.teamGradeParticipants.length})
                                      </h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {categorizedParticipants.teamGradeParticipants.map((participant, index) => {
                                          const team = teams.find(t => t.code === participant.teamCode);
                                          
                                          return (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-indigo-300 shadow-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                    style={{ backgroundColor: team?.color || '#6366f1' }}
                                                  >
                                                    {participant.teamCode}
                                                  </div>
                                                  <span className="text-lg">📊</span>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-bold text-indigo-700">{participant.points} pts</div>
                                                  <div className="text-xs text-indigo-600">Grade {participant.grade}</div>
                                                </div>
                                              </div>
                                              <div>
                                                <div className="font-medium text-gray-900">{team?.name || participant.teamCode}</div>
                                                <div className="text-sm text-gray-600">Team Participation</div>
                                                <div className="text-xs text-gray-500">Grade {participant.grade}</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* All Registered Participants */}
                                  {categorizedParticipants.allRegistered.length > 0 && (
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
                                      <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                        <span className="mr-2">👥</span>
                                        All Registered Participants ({categorizedParticipants.allRegistered.length})
                                      </h6>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {categorizedParticipants.allRegistered.map((participant, index) => {
                                          // Check if this participant is a winner or has participation grade
                                          const isWinner = allWinners.some(w => w.chestNumber === participant.chestNumber);
                                          const hasParticipationGrade = participationGradeParticipants.some(pg => pg.chestNumber === participant.chestNumber);
                                          
                                          let statusBadge = '';
                                          let statusColor = 'bg-gray-100 text-gray-600';
                                          
                                          if (isWinner) {
                                            const winnerInfo = allWinners.find(w => w.chestNumber === participant.chestNumber);
                                            statusBadge = winnerInfo?.position === 'first' ? '🥇' : winnerInfo?.position === 'second' ? '🥈' : '🥉';
                                            statusColor = 'bg-yellow-100 text-yellow-800';
                                          } else if (hasParticipationGrade) {
                                            statusBadge = '📊';
                                            statusColor = 'bg-blue-100 text-blue-800';
                                          } else {
                                            statusBadge = '👤';
                                            statusColor = 'bg-gray-100 text-gray-600';
                                          }
                                          
                                          return (
                                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-300 shadow-sm">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                  <div 
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                    style={{ backgroundColor: participant.team?.color || '#6366f1' }}
                                                  >
                                                    {participant.teamCode}
                                                  </div>
                                                  <span className="text-sm">{statusBadge}</span>
                                                </div>
                                                <div className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                                  {isWinner ? 'Winner' : hasParticipationGrade ? 'Graded' : 'Participant'}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="font-medium text-gray-900 text-sm">{participant.chestNumber}</div>
                                                <div className="text-xs text-gray-600">{participant.candidate?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{participant.team?.name || participant.teamCode}</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Summary Statistics */}
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                                    <h6 className="font-semibold text-purple-800 mb-3 flex items-center">
                                      <span className="mr-2">📈</span>
                                      Programme Statistics
                                    </h6>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                                      <div>
                                        <div className="text-2xl font-bold text-purple-700">{categorizedParticipants.allRegistered.length}</div>
                                        <div className="text-xs text-purple-600">Registered</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-yellow-700">{categorizedParticipants.winners.length}</div>
                                        <div className="text-xs text-yellow-600">Individual Winners</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-green-700">{categorizedParticipants.teamWinners.length}</div>
                                        <div className="text-xs text-green-600">Team Winners</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-blue-700">{categorizedParticipants.gradeParticipants.length}</div>
                                        <div className="text-xs text-blue-600">Individual Grades</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-indigo-700">{categorizedParticipants.teamGradeParticipants.length}</div>
                                        <div className="text-xs text-indigo-600">Team Grades</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold text-pink-700">
                                          {[...new Set(categorizedParticipants.allRegistered.map(p => p.teamCode))].length}
                                        </div>
                                        <div className="text-xs text-pink-600">Teams</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Programme Summary */}
                          <div className="mt-4 pt-3 border-t border-gray-300">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>
                                Total Winners: {
                                  (result.firstPlace?.length || 0) + 
                                  (result.secondPlace?.length || 0) + 
                                  (result.thirdPlace?.length || 0) +
                                  (result.firstPlaceTeams?.length || 0) + 
                                  (result.secondPlaceTeams?.length || 0) + 
                                  (result.thirdPlaceTeams?.length || 0)
                                }
                              </span>
                              <span>
                                Total Points Awarded: {
                                  ((result.firstPlace?.length || 0) + (result.firstPlaceTeams?.length || 0)) * result.firstPoints +
                                  ((result.secondPlace?.length || 0) + (result.secondPlaceTeams?.length || 0)) * result.secondPoints +
                                  ((result.thirdPlace?.length || 0) + (result.thirdPlaceTeams?.length || 0)) * result.thirdPoints +
                                  // Add grade points
                                  (result.firstPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                  (result.secondPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                  (result.thirdPlace?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                  (result.firstPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                  (result.secondPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0) +
                                  (result.thirdPlaceTeams?.reduce((sum, w) => sum + getGradePoints(w.grade || ''), 0) || 0)
                                } pts
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Detailed Marks Summary */}
              <MarksSummary results={publishedResults} showDailyProgress={true} />
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
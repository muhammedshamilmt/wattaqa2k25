'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Programme, ResultStatus, Team } from '@/types';
import ResultCard from '@/components/admin/ResultCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PublishPage() {
  const [publishedResults, setPublishedResults] = useState<EnhancedResult[]>([]);
  const [checkedResults, setCheckedResults] = useState<EnhancedResult[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'ready'>('published');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [publishedRes, checkedRes, programmesRes, teamsRes] = await Promise.all([
        fetch('/api/results/status?status=published'),
        fetch('/api/results/status?status=checked'),
        fetch('/api/programmes'),
        fetch('/api/teams')
      ]);

      if (!publishedRes.ok || !checkedRes.ok || !programmesRes.ok || !teamsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [published, checked, programmesData, teamsData] = await Promise.all([
        publishedRes.json(),
        checkedRes.json(),
        programmesRes.json(),
        teamsRes.json()
      ]);

      // Enrich results with programme information
      const enrichResults = (results: EnhancedResult[]) => {
        return results.map(result => {
          const programme = programmesData.find((p: Programme) => 
            p._id?.toString() === result.programmeId?.toString()
          );
          
          return {
            ...result,
            programmeName: programme?.name,
            programmeCode: programme?.code,
            programmeCategory: programme?.category,
            programmeSection: programme?.section
          };
        });
      };

      setPublishedResults(enrichResults(published));
      setCheckedResults(enrichResults(checked));
      setProgrammes(programmesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkPublish = async () => {
    if (checkedResults.length === 0) return;
    
    if (!confirm(`Are you sure you want to publish ${checkedResults.length} results? This will make them visible to the public.`)) {
      return;
    }

    try {
      const resultIds = checkedResults.map(r => r._id!.toString());
      const response = await fetch('/api/results/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resultIds, status: ResultStatus.PUBLISHED })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish results');
      }

      const result = await response.json();
      alert(`Successfully published ${result.modifiedCount} results!`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error publishing results:', error);
      alert('Failed to publish results. Please try again.');
    }
  };

  const getProgrammeName = (result: EnhancedResult) => {
    if (result.programmeName && result.programmeCode) {
      return `${result.programmeName} (${result.programmeCode})`;
    }

    const programme = programmes.find(p => p._id?.toString() === result.programmeId);
    return programme ? `${programme.name} (${programme.code})` : 'Unknown Programme';
  };

  const calculateTotalPoints = () => {
    return publishedResults.reduce((total, result) => {
      let resultTotal = 0;
      if (result.firstPlace) resultTotal += result.firstPlace.length * result.firstPoints;
      if (result.secondPlace) resultTotal += result.secondPlace.length * result.secondPoints;
      if (result.thirdPlace) resultTotal += result.thirdPlace.length * result.thirdPoints;
      if (result.participationGrades) {
        resultTotal += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
      }
      if (result.firstPlaceTeams) resultTotal += result.firstPlaceTeams.length * result.firstPoints;
      if (result.secondPlaceTeams) resultTotal += result.secondPlaceTeams.length * result.secondPoints;
      if (result.thirdPlaceTeams) resultTotal += result.thirdPlaceTeams.length * result.thirdPoints;
      if (result.participationTeamGrades) {
        resultTotal += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
      }
      return total + resultTotal;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-2">🚀</span>
          Publish Results
        </h1>
        <p className="text-gray-600">
          Manage and publish competition results for public viewing
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-blue-600 text-2xl mr-3">🚀</div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{publishedResults.length}</div>
              <div className="text-sm text-blue-600">Published Results</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-900">{checkedResults.length}</div>
              <div className="text-sm text-green-600">Ready to Publish</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-purple-600 text-2xl mr-3">🏆</div>
            <div>
              <div className="text-2xl font-bold text-purple-900">{calculateTotalPoints()}</div>
              <div className="text-sm text-purple-600">Total Points Awarded</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-orange-600 text-2xl mr-3">📊</div>
            <div>
              <div className="text-2xl font-bold text-orange-900">{programmes.length}</div>
              <div className="text-sm text-orange-600">Total Programmes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('published')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'published'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Published Results
              {publishedResults.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">
                  {publishedResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ready'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Ready to Publish
              {checkedResults.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 py-0.5 px-2 rounded-full text-xs">
                  {checkedResults.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Published Results Tab */}
      {activeTab === 'published' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Published Results ({publishedResults.length})
            </h2>
            <div className="flex space-x-3">
              <a
                href="/results"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                👁️ View Public Results
              </a>
            </div>
          </div>

          {publishedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Results</h3>
              <p className="text-gray-500">Results will appear here after being published.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedResults.map((result) => (
                <ResultCard
                  key={result._id?.toString()}
                  result={result}
                  programmeName={getProgrammeName(result)}
                  onReview={() => {}}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ready to Publish Tab */}
      {activeTab === 'ready' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Ready to Publish ({checkedResults.length})
            </h2>
            {checkedResults.length > 0 && (
              <button
                onClick={handleBulkPublish}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Publish All ({checkedResults.length})</span>
              </button>
            )}
          </div>

          {checkedResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Ready</h3>
              <p className="text-gray-500">
                Results will appear here after being checked and approved in the checklist.
              </p>
              <div className="mt-4">
                <a
                  href="/admin/results/checklist"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <span className="mr-2">📋</span>
                  Go to Checklist
                </a>
              </div>
            </div>
          ) : (
            <div>
              {/* Bulk Action Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-green-600 text-xl mr-3">ℹ️</div>
                  <div>
                    <h3 className="text-green-800 font-medium">Ready for Publication</h3>
                    <p className="text-green-700 text-sm">
                      These {checkedResults.length} results have been reviewed and are ready to be published. 
                      Once published, they will be visible to all users on the public results page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {checkedResults.map((result) => (
                  <ResultCard
                    key={result._id?.toString()}
                    result={result}
                    programmeName={getProgrammeName(result)}
                    onReview={() => {}}
                    onStatusUpdate={handleStatusUpdate}
                    showActions={true}
                    isChecked={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
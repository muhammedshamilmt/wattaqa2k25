'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Programme, ResultStatus } from '@/types';
import ResultReviewModal from '@/components/admin/ResultReviewModal';
import ResultCard from '@/components/admin/ResultCard';
// Removed LoadingSpinner import for faster page load
import MarksSummary from '@/components/admin/MarksSummary';

export default function CheckListPage() {
  const [pendingResults, setPendingResults] = useState<EnhancedResult[]>([]);
  const [checkedResults, setCheckedResults] = useState<EnhancedResult[]>([]);
  const [publishedResults, setPublishedResults] = useState<EnhancedResult[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  // Removed loading state for faster page load
  const [selectedResult, setSelectedResult] = useState<EnhancedResult | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'checked' | 'published' | 'summary'>('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Removed loading state for faster UI
      const [pendingRes, checkedRes, publishedRes, programmesRes] = await Promise.all([
        fetch('/api/results/status?status=pending'),
        fetch('/api/results/status?status=checked'),
        fetch('/api/results/status?status=published'),
        fetch('/api/programmes')
      ]);

      if (!pendingRes.ok || !checkedRes.ok || !publishedRes.ok || !programmesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [pending, checked, published, programmesData] = await Promise.all([
        pendingRes.json(),
        checkedRes.json(),
        publishedRes.json(),
        programmesRes.json()
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
              Pending Results ({pendingResults.length})
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingResults.map((result) => (
                <ResultCard
                  key={result._id?.toString()}
                  result={result}
                  programmeName={getProgrammeName(result)}
                  onReview={() => handleReviewResult(result)}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
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
              Checked Results ({checkedResults.length})
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checkedResults.map((result) => (
                <ResultCard
                  key={result._id?.toString()}
                  result={result}
                  programmeName={getProgrammeName(result)}
                  onReview={() => handleReviewResult(result)}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
                  isChecked={true}
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
            <MarksSummary results={publishedResults} />
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
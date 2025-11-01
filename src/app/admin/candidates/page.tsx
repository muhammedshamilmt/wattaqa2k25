'use client';

import { useState, useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Candidate, Team } from '@/types';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Filter out blank/empty candidates
  const filterValidCandidates = (candidates: Candidate[]) => {
    return candidates.filter(candidate =>
      candidate.name &&
      candidate.name.trim() !== '' &&
      candidate.chestNumber &&
      candidate.chestNumber.trim() !== '' &&
      candidate.team &&
      candidate.team.trim() !== '' &&
      candidate.section &&
      candidate.section.trim() !== ''
    );
  };

  // Fetch candidates and teams from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, teamsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/teams')
      ]);

      const [candidatesData, teamsData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json()
      ]);

      // Filter out blank/empty candidates
      const validCandidates = filterValidCandidates(candidatesData);

      setCandidates(validCandidates);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter candidates by selected team
  const filteredCandidates = selectedTeam === 'all' 
    ? candidates 
    : candidates.filter(candidate => candidate.team === selectedTeam);

  // Group candidates by team for statistics
  const candidatesByTeam = teams.map(team => ({
    ...team,
    candidateCount: candidates.filter(c => c.team === team.code).length,
    totalPoints: candidates.filter(c => c.team === team.code).reduce((sum, c) => sum + c.points, 0),
    avgPoints: candidates.filter(c => c.team === team.code).length > 0 
      ? (candidates.filter(c => c.team === team.code).reduce((sum, c) => sum + c.points, 0) / candidates.filter(c => c.team === team.code).length).toFixed(1)
      : '0'
  }));

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
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{team.candidateCount}</div>
                    <div className="text-xs text-gray-500">Candidates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: team.color }}>{team.totalPoints}</div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{team.avgPoints}</div>
                    <div className="text-xs text-gray-500">Avg Points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        {/* Candidates Overview */}
        <ShowcaseSection title="Candidates Overview">
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
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Points</th>
                        <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => {
                        const team = teams.find(t => t.code === candidate.team);
                        return (
                          <tr key={candidate._id?.toString()} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">{candidate.chestNumber}</td>
                            <td className="py-3 px-4 font-medium text-gray-900">{candidate.name}</td>
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
                              <span className="font-bold text-gray-900">{candidate.points}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                Active
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </ShowcaseSection>

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
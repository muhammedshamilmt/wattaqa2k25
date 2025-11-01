'use client';

import { useState, useEffect } from 'react';
import { EnhancedResult, Programme, ResultStatus, Candidate, Team } from '@/types';

interface ResultReviewModalProps {
  result: EnhancedResult;
  programme?: Programme;
  onClose: () => void;
  onStatusUpdate: (resultId: string, status: ResultStatus, notes?: string) => void;
}

export default function ResultReviewModal({ 
  result, 
  programme, 
  onClose, 
  onStatusUpdate 
}: ResultReviewModalProps) {
  const [reviewNotes, setReviewNotes] = useState(result.reviewNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatesAndTeams();
  }, []);

  const fetchCandidatesAndTeams = async () => {
    try {
      const [candidatesRes, teamsRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/teams')
      ]);

      const [candidatesData, teamsData] = await Promise.all([
        candidatesRes.json(),
        teamsRes.json()
      ]);

      setCandidates(candidatesData || []);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error fetching candidates and teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: ResultStatus) => {
    setIsSubmitting(true);
    try {
      await onStatusUpdate(result._id!.toString(), status, reviewNotes);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grade points mapping
  const getGradePoints = (grade: string) => {
    const gradePoints: { [key: string]: number } = {
      'A': 5,
      'B': 3,
      'C': 1
    };
    return gradePoints[grade] || 0;
  };

  const getTotalPoints = () => {
    let total = 0;
    
    // Individual/Group results with grades
    if (result.firstPlace) {
      result.firstPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.firstPoints + gradePoints;
      });
    }
    if (result.secondPlace) {
      result.secondPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.secondPoints + gradePoints;
      });
    }
    if (result.thirdPlace) {
      result.thirdPlace.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.thirdPoints + gradePoints;
      });
    }
    if (result.participationGrades) {
      total += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
    }
    
    // Team results with grades
    if (result.firstPlaceTeams) {
      result.firstPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.firstPoints + gradePoints;
      });
    }
    if (result.secondPlaceTeams) {
      result.secondPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.secondPoints + gradePoints;
      });
    }
    if (result.thirdPlaceTeams) {
      result.thirdPlaceTeams.forEach(winner => {
        const gradePoints = getGradePoints(winner.grade || '');
        total += result.thirdPoints + gradePoints;
      });
    }
    if (result.participationTeamGrades) {
      total += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
    }
    
    return total;
  };

  const getCandidateInfo = (chestNumber: string) => {
    const candidate = candidates.find(c => c.chestNumber === chestNumber);
    const team = candidate ? teams.find(t => t.code === candidate.team) : null;
    return { candidate, team };
  };

  const getTeamInfo = (teamCode: string) => {
    return teams.find(t => t.code === teamCode);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" 
        style={{ 
          zIndex: 100000,
          position: 'relative'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Review Result: {programme?.name || result.programmeName}
            </h2>
            <p className="text-sm text-gray-600">
              {programme?.code || result.programmeCode} • {result.section.replace('-', ' ')} • {result.positionType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Programme Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Programme Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Category:</span>
                <span className="ml-2 text-blue-800">{programme?.category || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Position Type:</span>
                <span className="ml-2 text-blue-800 capitalize">{result.positionType}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Section:</span>
                <span className="ml-2 text-blue-800 capitalize">{result.section.replace('-', ' ')}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Total Points:</span>
                <span className="ml-2 text-blue-800 font-bold">{getTotalPoints()}</span>
              </div>
            </div>
          </div>

          {/* Results Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Results Details</h3>
            
            {/* Individual/Group Results */}
            {result.positionType !== 'general' && (
              <div className="space-y-4">
                {/* Winners Section */}
                <div className="space-y-3">
                  {/* First Place */}
                  {result.firstPlace && result.firstPlace.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                        <span className="mr-2">🥇</span>
                        First Place ({result.firstPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.firstPlace.map((winner, index) => {
                          const { candidate, team } = getCandidateInfo(winner.chestNumber);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="font-mono font-bold text-lg text-gray-900">
                                  {winner.chestNumber}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {candidate?.name || 'Unknown Participant'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {candidate?.section} section
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {team && (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div className="text-right">
                                  <div className="flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">{result.firstPoints}</span>
                                      {winner.grade && (
                                        <>
                                          <span className="text-xs text-gray-400">+</span>
                                          <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                            {winner.grade}({getGradePoints(winner.grade)})
                                          </span>
                                        </>
                                      )}
                                      <span className="font-bold text-yellow-600">
                                        = {result.firstPoints + getGradePoints(winner.grade || '')} pts
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{team?.name}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Second Place */}
                  {result.secondPlace && result.secondPlace.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🥈</span>
                        Second Place ({result.secondPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.secondPlace.map((winner, index) => {
                          const { candidate, team } = getCandidateInfo(winner.chestNumber);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="font-mono font-bold text-lg text-gray-900">
                                  {winner.chestNumber}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {candidate?.name || 'Unknown Participant'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {candidate?.section} section
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {team && (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div className="text-right">
                                  <div className="flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">{result.secondPoints}</span>
                                      {winner.grade && (
                                        <>
                                          <span className="text-xs text-gray-400">+</span>
                                          <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                            {winner.grade}({getGradePoints(winner.grade)})
                                          </span>
                                        </>
                                      )}
                                      <span className="font-bold text-gray-600">
                                        = {result.secondPoints + getGradePoints(winner.grade || '')} pts
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{team?.name}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Third Place */}
                  {result.thirdPlace && result.thirdPlace.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-800 mb-3 flex items-center">
                        <span className="mr-2">🥉</span>
                        Third Place ({result.thirdPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.thirdPlace.map((winner, index) => {
                          const { candidate, team } = getCandidateInfo(winner.chestNumber);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="font-mono font-bold text-lg text-gray-900">
                                  {winner.chestNumber}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {candidate?.name || 'Unknown Participant'}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {candidate?.section} section
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {team && (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div className="text-right">
                                  <div className="flex flex-col items-end space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">{result.thirdPoints}</span>
                                      {winner.grade && (
                                        <>
                                          <span className="text-xs text-gray-400">+</span>
                                          <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                            {winner.grade}({getGradePoints(winner.grade)})
                                          </span>
                                        </>
                                      )}
                                      <span className="font-bold text-orange-600">
                                        = {result.thirdPoints + getGradePoints(winner.grade || '')} pts
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">{team?.name}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Participants */}
                {result.participationGrades && result.participationGrades.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                      <span className="mr-2">🎖️</span>
                      Other Participants ({result.participationGrades.length})
                    </h4>
                    <div className="space-y-2">
                      {result.participationGrades.map((pg, index) => {
                        const { candidate, team } = getCandidateInfo(pg.chestNumber);
                        return (
                          <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="font-mono font-bold text-lg text-gray-900">
                                {pg.chestNumber}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {candidate?.name || 'Unknown Participant'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {candidate?.section} section
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {team && (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: team.color }}
                                >
                                  {team.code}
                                </div>
                              )}
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                                    {pg.grade}
                                  </span>
                                  <span className="font-bold text-purple-600">{pg.points} pts</span>
                                </div>
                                <div className="text-xs text-gray-500">{team?.name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Team Results */}
            {result.positionType === 'general' && (
              <div className="space-y-4">
                {/* Winners Section */}
                <div className="space-y-3">
                  {/* First Place Teams */}
                  {result.firstPlaceTeams && result.firstPlaceTeams.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                        <span className="mr-2">🥇</span>
                        First Place Teams ({result.firstPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.firstPlaceTeams.map((winner, index) => {
                          const team = getTeamInfo(winner.teamCode);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {team && (
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {team?.name || winner.teamCode}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Team Event
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex flex-col items-end space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{result.firstPoints}</span>
                                    {winner.grade && (
                                      <>
                                        <span className="text-xs text-gray-400">+</span>
                                        <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                          {winner.grade}({getGradePoints(winner.grade)})
                                        </span>
                                      </>
                                    )}
                                    <span className="font-bold text-yellow-600">
                                      = {result.firstPoints + getGradePoints(winner.grade || '')} pts
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">Winner</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Second Place Teams */}
                  {result.secondPlaceTeams && result.secondPlaceTeams.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🥈</span>
                        Second Place Teams ({result.secondPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.secondPlaceTeams.map((winner, index) => {
                          const team = getTeamInfo(winner.teamCode);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {team && (
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {team?.name || winner.teamCode}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Team Event
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex flex-col items-end space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{result.secondPoints}</span>
                                    {winner.grade && (
                                      <>
                                        <span className="text-xs text-gray-400">+</span>
                                        <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                          {winner.grade}({getGradePoints(winner.grade)})
                                        </span>
                                      </>
                                    )}
                                    <span className="font-bold text-gray-600">
                                      = {result.secondPoints + getGradePoints(winner.grade || '')} pts
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">Runner-up</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Third Place Teams */}
                  {result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-medium text-orange-800 mb-3 flex items-center">
                        <span className="mr-2">🥉</span>
                        Third Place Teams ({result.thirdPoints} points each)
                      </h4>
                      <div className="space-y-2">
                        {result.thirdPlaceTeams.map((winner, index) => {
                          const team = getTeamInfo(winner.teamCode);
                          return (
                            <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {team && (
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {team.code}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {team?.name || winner.teamCode}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Team Event
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex flex-col items-end space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{result.thirdPoints}</span>
                                    {winner.grade && (
                                      <>
                                        <span className="text-xs text-gray-400">+</span>
                                        <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold">
                                          {winner.grade}({getGradePoints(winner.grade)})
                                        </span>
                                      </>
                                    )}
                                    <span className="font-bold text-orange-600">
                                      = {result.thirdPoints + getGradePoints(winner.grade || '')} pts
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">Third Place</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Participating Teams */}
                {result.participationTeamGrades && result.participationTeamGrades.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                      <span className="mr-2">🎖️</span>
                      Other Participating Teams ({result.participationTeamGrades.length})
                    </h4>
                    <div className="space-y-2">
                      {result.participationTeamGrades.map((pg, index) => {
                        const team = getTeamInfo(pg.teamCode);
                        return (
                          <div key={index} className="bg-white rounded-lg px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {team && (
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: team.color }}
                                >
                                  {team.code}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {team?.name || pg.teamCode}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Team Event
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                                  {pg.grade}
                                </span>
                                <span className="font-bold text-purple-600">{pg.points} pts</span>
                              </div>
                              <div className="text-xs text-gray-500">Participant</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Original Notes */}
          {result.notes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Original Notes</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                {result.notes}
              </div>
            </div>
          )}

          {/* Review Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="Add any review comments or corrections needed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className="flex space-x-3">
            {result.status === ResultStatus.PENDING && (
              <button
                onClick={() => handleStatusUpdate(ResultStatus.CHECKED)}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <span>✓</span>
                <span>{isSubmitting ? 'Checking...' : 'Mark as Checked'}</span>
              </button>
            )}
            
            {result.status === ResultStatus.CHECKED && (
              <>
                <button
                  onClick={() => handleStatusUpdate(ResultStatus.PENDING)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  ↩️ Move to Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate(ResultStatus.PUBLISHED)}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>🚀</span>
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Result'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
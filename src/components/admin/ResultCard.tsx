'use client';

import { EnhancedResult, ResultStatus } from '@/types';

interface ResultCardProps {
    result: EnhancedResult;
    programmeName: string;
    onReview: () => void;
    onStatusUpdate: (resultId: string, status: ResultStatus, notes?: string) => void;
    showActions?: boolean;
    isChecked?: boolean;
}

export default function ResultCard({
    result,
    programmeName,
    onReview,
    onStatusUpdate,
    showActions = true,
    isChecked = false
}: ResultCardProps) {
    const getStatusBadge = (status: ResultStatus) => {
        const badges = {
            [ResultStatus.PENDING]: 'bg-orange-100 text-orange-800 border-orange-200',
            [ResultStatus.CHECKED]: 'bg-green-100 text-green-800 border-green-200',
            [ResultStatus.PUBLISHED]: 'bg-blue-100 text-blue-800 border-blue-200'
        };

        const labels = {
            [ResultStatus.PENDING]: '⏳ Pending',
            [ResultStatus.CHECKED]: '✅ Checked',
            [ResultStatus.PUBLISHED]: '🚀 Published'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const getTeamParticipation = () => {
        const teamCounts: { [teamCode: string]: number } = {};

        // Count individual participants by team
        const countIndividualsByTeam = (participants: { chestNumber: string }[]) => {
            participants.forEach(p => {
                // Extract team code from chest number (assuming format like "A001", "B002", etc.)
                const teamCode = p.chestNumber.charAt(0);
                teamCounts[teamCode] = (teamCounts[teamCode] || 0) + 1;
            });
        };

        if (result.firstPlace) countIndividualsByTeam(result.firstPlace);
        if (result.secondPlace) countIndividualsByTeam(result.secondPlace);
        if (result.thirdPlace) countIndividualsByTeam(result.thirdPlace);
        if (result.participationGrades) {
            result.participationGrades.forEach(pg => {
                const teamCode = pg.chestNumber.charAt(0);
                teamCounts[teamCode] = (teamCounts[teamCode] || 0) + 1;
            });
        }

        // Count team participants
        if (result.firstPlaceTeams) {
            result.firstPlaceTeams.forEach(t => {
                teamCounts[t.teamCode] = (teamCounts[t.teamCode] || 0) + 1;
            });
        }
        if (result.secondPlaceTeams) {
            result.secondPlaceTeams.forEach(t => {
                teamCounts[t.teamCode] = (teamCounts[t.teamCode] || 0) + 1;
            });
        }
        if (result.thirdPlaceTeams) {
            result.thirdPlaceTeams.forEach(t => {
                teamCounts[t.teamCode] = (teamCounts[t.teamCode] || 0) + 1;
            });
        }
        if (result.participationTeamGrades) {
            result.participationTeamGrades.forEach(pg => {
                teamCounts[pg.teamCode] = (teamCounts[pg.teamCode] || 0) + 1;
            });
        }

        return teamCounts;
    };

    const getTotalParticipants = () => {
        const teamCounts = getTeamParticipation();
        return Object.values(teamCounts).reduce((sum, count) => sum + count, 0);
    };

    const getTotalPoints = () => {
        let total = 0;
        if (result.firstPlace) total += result.firstPlace.length * result.firstPoints;
        if (result.secondPlace) total += result.secondPlace.length * result.secondPoints;
        if (result.thirdPlace) total += result.thirdPlace.length * result.thirdPoints;
        if (result.participationGrades) {
            total += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
        }
        if (result.firstPlaceTeams) total += result.firstPlaceTeams.length * result.firstPoints;
        if (result.secondPlaceTeams) total += result.secondPlaceTeams.length * result.secondPoints;
        if (result.thirdPlaceTeams) total += result.thirdPlaceTeams.length * result.thirdPoints;
        if (result.participationTeamGrades) {
            total += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
        }
        return total;
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {programmeName}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="capitalize">{result.section.replace('-', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">{result.positionType}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(result.status)}
                    <div className="text-xs text-gray-500">
                        {new Date(result.createdAt || '').toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Total Participants</div>
                    <div className="text-xl font-bold text-gray-900">{getTotalParticipants()}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-sm text-blue-600">Total Points</div>
                    <div className="text-xl font-bold text-blue-900">{getTotalPoints()}</div>
                </div>
            </div>

            {/* Notes */}
            {result.notes && (
                <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Notes:</div>
                    <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                        {result.notes}
                    </div>
                </div>
            )}

            {/* Review Notes */}
            {result.reviewNotes && (
                <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Review Notes:</div>
                    <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                        {result.reviewNotes}
                    </div>
                </div>
            )}

            {/* Actions */}
            {showActions && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button
                        onClick={onReview}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                    >
                        <span>👁️</span>
                        <span>Review Details</span>
                    </button>

                    <div className="flex space-x-2">
                        {result.status === ResultStatus.PENDING && (
                            <button
                                onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.CHECKED)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                                ✓ Check
                            </button>
                        )}

                        {result.status === ResultStatus.CHECKED && (
                            <>
                                <button
                                    onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.PUBLISHED)}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                    🚀 Publish
                                </button>
                                <button
                                    onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.PENDING)}
                                    className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                                >
                                    ↩️ Pending
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
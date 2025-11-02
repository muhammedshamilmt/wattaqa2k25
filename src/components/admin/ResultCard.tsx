'use client';

import { useState } from 'react';
import { EnhancedResult, ResultStatus, Team, Candidate } from '@/types';

interface ResultCardProps {
    result: EnhancedResult;
    programmeName: string;
    onReview: () => void;
    onStatusUpdate: (resultId: string, status: ResultStatus, notes?: string) => void;
    showActions?: boolean;
    teams?: Team[];
    candidates?: Candidate[];
}

export default function ResultCard({
    result,
    programmeName,
    onReview,
    onStatusUpdate,
    showActions = true,
    teams = [],
    candidates = []
}: ResultCardProps) {
    const [showDetails, setShowDetails] = useState(false);
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

    const getMarkBreakdown = () => {
        let positionPoints = 0;
        let gradePoints = 0;
        let participationPoints = 0;

        // Individual/Group results
        if (result.firstPlace) {
            result.firstPlace.forEach(winner => {
                positionPoints += result.firstPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.secondPlace) {
            result.secondPlace.forEach(winner => {
                positionPoints += result.secondPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.thirdPlace) {
            result.thirdPlace.forEach(winner => {
                positionPoints += result.thirdPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.participationGrades) {
            participationPoints += result.participationGrades.reduce((sum, pg) => sum + pg.points, 0);
        }

        // Team results
        if (result.firstPlaceTeams) {
            result.firstPlaceTeams.forEach(winner => {
                positionPoints += result.firstPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.secondPlaceTeams) {
            result.secondPlaceTeams.forEach(winner => {
                positionPoints += result.secondPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.thirdPlaceTeams) {
            result.thirdPlaceTeams.forEach(winner => {
                positionPoints += result.thirdPoints;
                gradePoints += getGradePoints(winner.grade || '');
            });
        }
        if (result.participationTeamGrades) {
            participationPoints += result.participationTeamGrades.reduce((sum, pg) => sum + pg.points, 0);
        }

        return { positionPoints, gradePoints, participationPoints };
    };

    // Helper function to get participant name from chest number
    const getParticipantName = (chestNumber: string) => {
        if (!chestNumber) return 'Unknown Participant';
        
        const candidate = candidates.find(c => c.chestNumber === chestNumber);
        return candidate ? candidate.name : 'Unknown Participant';
    };

    // Helper function to get team name from chest number
    const getTeamName = (chestNumber: string) => {
        if (!chestNumber) return 'Unknown Team';
        
        // Extract team code from chest number
        let teamCode = '';
        
        // Method 1: Check if it starts with 3 letters (like SMD001, INT001, AQS001)
        const threeLetterMatch = chestNumber.match(/^([A-Z]{3})/i);
        if (threeLetterMatch) {
            teamCode = threeLetterMatch[1].toUpperCase();
        } else if (chestNumber.match(/^[A-Z]/i)) {
            // Method 2: Single letter (like A001, B002) 
            teamCode = chestNumber.charAt(0).toUpperCase();
        } else {
            // Method 3: Pure numbers (like 605, 402, 211) - map to teams
            const num = parseInt(chestNumber);
            if (num >= 600 && num < 700) {
                teamCode = 'AQS'; // Team 6xx = AQS
            } else if (num >= 400 && num < 500) {
                teamCode = 'INT'; // Team 4xx = INT  
            } else if (num >= 200 && num < 300) {
                teamCode = 'SMD'; // Team 2xx = SMD
            } else if (num >= 100 && num < 200) {
                teamCode = 'A'; // Team 1xx = Team A
            } else {
                // Default mapping based on first digit
                const firstDigit = chestNumber.charAt(0);
                teamCode = firstDigit;
            }
        }
        
        // Find team by code
        const team = teams.find(t => t.code?.toUpperCase() === teamCode);
        
        // Return team name or fallback
        if (team) {
            return team.name;
        } else {
            // If no team found, show just the team code
            return teamCode;
        }
    };

    const getWinnersDisplay = () => {
        const winners: Array<{
            position: string;
            participants: Array<{
                chestNumber: string;
                participantName?: string;
                teamName: string;
                grade?: string;
            }>;
            color: string;
        }> = [];
        
        // Individual winners
        if (result.firstPlace && result.firstPlace.length > 0) {
            winners.push({
                position: '🥇 1st Prize',
                participants: result.firstPlace.map(w => ({
                    chestNumber: w.chestNumber,
                    participantName: getParticipantName(w.chestNumber),
                    teamName: getTeamName(w.chestNumber),
                    grade: w.grade
                })),
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
            });
        }
        if (result.secondPlace && result.secondPlace.length > 0) {
            winners.push({
                position: '🥈 2nd Prize',
                participants: result.secondPlace.map(w => ({
                    chestNumber: w.chestNumber,
                    participantName: getParticipantName(w.chestNumber),
                    teamName: getTeamName(w.chestNumber),
                    grade: w.grade
                })),
                color: 'bg-gray-100 text-gray-800 border-gray-200'
            });
        }
        if (result.thirdPlace && result.thirdPlace.length > 0) {
            winners.push({
                position: '🥉 3rd Prize',
                participants: result.thirdPlace.map(w => ({
                    chestNumber: w.chestNumber,
                    participantName: getParticipantName(w.chestNumber),
                    teamName: getTeamName(w.chestNumber),
                    grade: w.grade
                })),
                color: 'bg-orange-100 text-orange-800 border-orange-200'
            });
        }

        // Team winners
        if (result.firstPlaceTeams && result.firstPlaceTeams.length > 0) {
            winners.push({
                position: '🥇 1st Prize (Team)',
                participants: result.firstPlaceTeams.map(w => ({
                    chestNumber: w.teamCode,
                    teamName: `Team ${w.teamCode}`,
                    grade: w.grade
                })),
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
            });
        }
        if (result.secondPlaceTeams && result.secondPlaceTeams.length > 0) {
            winners.push({
                position: '🥈 2nd Prize (Team)',
                participants: result.secondPlaceTeams.map(w => ({
                    chestNumber: w.teamCode,
                    teamName: `Team ${w.teamCode}`,
                    grade: w.grade
                })),
                color: 'bg-gray-100 text-gray-800 border-gray-200'
            });
        }
        if (result.thirdPlaceTeams && result.thirdPlaceTeams.length > 0) {
            winners.push({
                position: '🥉 3rd Prize (Team)',
                participants: result.thirdPlaceTeams.map(w => ({
                    chestNumber: w.teamCode,
                    teamName: `Team ${w.teamCode}`,
                    grade: w.grade
                })),
                color: 'bg-orange-100 text-orange-800 border-orange-200'
            });
        }

        return winners;
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className={`text-base font-semibold mb-1 leading-tight ${
                        result.status === ResultStatus.PENDING ? 'text-orange-700' :
                        result.status === ResultStatus.CHECKED ? 'text-green-700' :
                        result.status === ResultStatus.PUBLISHED ? 'text-blue-700' :
                        'text-gray-900'
                    }`}>
                        {programmeName}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <span className="capitalize">{result.section.replace('-', ' ')}</span>
                        <span>•</span>
                        <span className="capitalize">{result.positionType}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                    {getStatusBadge(result.status)}
                    <div className="text-xs text-gray-500">
                        {new Date(result.createdAt || '').toLocaleDateString()}
                    </div>
                </div>
            </div>



            {/* Toggle Details Button */}
            <div className="mb-3">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <span className="text-xs font-medium text-gray-700">
                        {showDetails ? 'Hide Details' : 'Show Details'}
                    </span>
                    <span className={`transform transition-transform text-xs ${showDetails ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>
            </div>

            {/* Expandable Details */}
            {showDetails && (
                <div className="mb-3 space-y-2">
                    {/* Winners */}
                    {getWinnersDisplay().length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-gray-800 mb-2">🏆 Winners</h4>
                            <div className="space-y-2">
                                {getWinnersDisplay().map((winner, index) => (
                                    <div key={index}>
                                        {winner.participants.map((participant, pIndex) => (
                                            <div key={pIndex} className="flex items-center justify-between py-1.5 px-2 rounded border border-gray-200 bg-white mb-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-medium text-gray-700">{winner.position}:</span>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center space-x-1">
                                                            <span className="font-bold text-gray-900 text-sm">{participant.chestNumber}</span>
                                                            {participant.grade && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                                                    {participant.grade}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {participant.participantName && (
                                                            <span className="text-xs text-gray-600 font-medium">{participant.participantName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-gray-700">{participant.teamName}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Participation Grades */}
                    {((result.participationGrades && result.participationGrades.length > 0) || 
                      (result.participationTeamGrades && result.participationTeamGrades.length > 0)) && (
                        <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">📝 Participation Grades</h4>
                            <div className="space-y-2">
                                {result.participationGrades && result.participationGrades.map((pg, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-800">{pg.chestNumber}</span>
                                                <span className="text-xs text-gray-600 font-medium">({getParticipantName(pg.chestNumber)})</span>
                                            </div>
                                            <span className="text-xs text-gray-600">{getTeamName(pg.chestNumber)}</span>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            {pg.grade}
                                        </span>
                                    </div>
                                ))}
                                {result.participationTeamGrades && result.participationTeamGrades.map((pg, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-800">Team {pg.teamCode}</span>
                                            <span className="text-xs text-gray-600">Team {pg.teamCode}</span>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            {pg.grade}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>
            )}

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
                <div className="flex justify-end items-center pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                        {result.status === ResultStatus.PENDING && (
                            <button
                                onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.CHECKED)}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                ✓ Check
                            </button>
                        )}

                        {result.status === ResultStatus.CHECKED && (
                            <>
                                <button
                                    onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.PUBLISHED)}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    🚀 Publish
                                </button>
                                <button
                                    onClick={() => onStatusUpdate(result._id!.toString(), ResultStatus.PENDING)}
                                    className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors font-medium"
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
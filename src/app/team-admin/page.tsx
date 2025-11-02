'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Candidate, Programme, ProgrammeParticipant, Result } from '@/types';
import Link from 'next/link';

export default function TeamDashboard() {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || 'SMD';
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [teamCode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [candidatesRes, programmesRes, participantsRes, resultsRes] = await Promise.all([
        fetch(`/api/candidates?team=${teamCode}`),
        fetch('/api/programmes'),
        fetch(`/api/programme-participants?team=${teamCode}`),
        fetch('/api/results?teamView=true')
      ]);

      const [candidatesData, programmesData, participantsData, resultsData] = await Promise.all([
        candidatesRes.json(),
        programmesRes.json(),
        participantsRes.json(),
        resultsRes.json()
      ]);

      setCandidates(candidatesData);
      setProgrammes(programmesData);
      setParticipants(participantsData);
      setResults(resultsData);
      
      // Debug logging to understand data structure
      console.log('Team Dashboard Data:', {
        candidates: candidatesData?.slice(0, 2),
        programmes: programmesData?.slice(0, 2),
        participants: participantsData?.slice(0, 2),
        results: resultsData?.slice(0, 2)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics with safe fallbacks
  const totalCandidates = candidates?.length || 0;
  const totalParticipations = participants?.length || 0;
  const totalPoints = candidates?.reduce((sum, candidate) => sum + (candidate.points || 0), 0) || 0;

  // Group candidates by section with safe fallbacks
  const candidatesBySection = {
    senior: candidates?.filter(c => c.section === 'senior').length || 0,
    junior: candidates?.filter(c => c.section === 'junior').length || 0,
    'sub-junior': candidates?.filter(c => c.section === 'sub-junior').length || 0,
  };

  // Filter team results - check if team appears in any position
  const teamResults = (results || []).filter(result => {
    if (result.status !== 'published') return false;
    
    // Check if team appears in any position for general programmes
    if (result.positionType === 'general') {
      return result.firstPlaceTeams?.some(t => t.teamCode === teamCode) ||
             result.secondPlaceTeams?.some(t => t.teamCode === teamCode) ||
             result.thirdPlaceTeams?.some(t => t.teamCode === teamCode) ||
             result.participationTeamGrades?.some(t => t.teamCode === teamCode);
    }
    
    // For individual/group programmes, check if any team candidates are in results
    const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
    return result.firstPlace?.some(p => teamCandidateChests.includes(p.chestNumber)) ||
           result.secondPlace?.some(p => teamCandidateChests.includes(p.chestNumber)) ||
           result.thirdPlace?.some(p => teamCandidateChests.includes(p.chestNumber)) ||
           result.participationGrades?.some(p => teamCandidateChests.includes(p.chestNumber));
  });

  // Calculate team performance metrics
  const totalWins = teamResults.filter(result => {
    if (result.positionType === 'general') {
      return result.firstPlaceTeams?.some(t => t.teamCode === teamCode);
    }
    const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
    return result.firstPlace?.some(p => teamCandidateChests.includes(p.chestNumber));
  }).length;

  const totalPodiums = teamResults.filter(result => {
    if (result.positionType === 'general') {
      return result.firstPlaceTeams?.some(t => t.teamCode === teamCode) ||
             result.secondPlaceTeams?.some(t => t.teamCode === teamCode) ||
             result.thirdPlaceTeams?.some(t => t.teamCode === teamCode);
    }
    const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
    return result.firstPlace?.some(p => teamCandidateChests.includes(p.chestNumber)) ||
           result.secondPlace?.some(p => teamCandidateChests.includes(p.chestNumber)) ||
           result.thirdPlace?.some(p => teamCandidateChests.includes(p.chestNumber));
  }).length;

  const recentResults = teamResults
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  // Generate dynamic recent activities
  const getTeamPositionInResult = (result: Result) => {
    if (result.positionType === 'general') {
      if (result.firstPlaceTeams?.some(t => t.teamCode === teamCode)) return { position: 1, type: 'team' };
      if (result.secondPlaceTeams?.some(t => t.teamCode === teamCode)) return { position: 2, type: 'team' };
      if (result.thirdPlaceTeams?.some(t => t.teamCode === teamCode)) return { position: 3, type: 'team' };
      return { position: 4, type: 'team' };
    } else {
      const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
      if (result.firstPlace?.some(p => teamCandidateChests.includes(p.chestNumber))) return { position: 1, type: 'individual' };
      if (result.secondPlace?.some(p => teamCandidateChests.includes(p.chestNumber))) return { position: 2, type: 'individual' };
      if (result.thirdPlace?.some(p => teamCandidateChests.includes(p.chestNumber))) return { position: 3, type: 'individual' };
      return { position: 4, type: 'individual' };
    }
  };

  const recentActivities = [
    ...recentResults.map(result => {
      // Find programme by matching _id, id, or code
      const programme = (programmes || []).find(p => 
        p._id?.toString() === result.programmeId || 
        p.id === result.programmeId || 
        p.code === result.programmeId
      );
      const teamPosition = getTeamPositionInResult(result);
      const positionText = teamPosition.position === 1 ? '1st place in' : 
                          teamPosition.position === 2 ? '2nd place in' : 
                          teamPosition.position === 3 ? '3rd place in' : 
                          'participated in';
      
      // Get candidate names for individual results
      let candidateNames = '';
      if (teamPosition.type === 'individual') {
        const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
        const allPositions = [
          ...(result.firstPlace || []),
          ...(result.secondPlace || []),
          ...(result.thirdPlace || [])
        ];
        
        const teamCandidatesInResult = allPositions
          .filter(p => teamCandidateChests.includes(p.chestNumber))
          .map(p => {
            const candidate = (candidates || []).find(c => c.chestNumber === p.chestNumber);
            return candidate?.name || p.chestNumber;
          });
        
        if (teamCandidatesInResult.length > 0) {
          candidateNames = ` (${teamCandidatesInResult.join(', ')})`;
        }
      }
      
      return {
        type: 'result',
        message: `${teamPosition.position <= 3 ? 'Won' : 'Participated in'} ${positionText} ${programme?.name || 'Unknown Programme'}${candidateNames}`,
        time: new Date(result.createdAt || '').toLocaleDateString(),
        icon: teamPosition.position <= 3 ? '🏅' : '🎯'
      };
    }),
    ...(participants || []).slice(-3).map(participant => {
      // ProgrammeParticipant has programmeCode field that should match Programme.code
      const programme = (programmes || []).find(p => p.code === participant.programmeCode);
      return {
        type: 'registration',
        message: `Registered for ${programme?.name || participant.programmeName || participant.programmeCode}`,
        time: new Date(participant.createdAt || '').toLocaleDateString(),
        icon: '🎯'
      };
    })
  ].slice(0, 4);

  const quickActions = [
    {
      title: 'Manage Candidates',
      description: 'Add or edit team members',
      href: `/team-admin/candidates?team=${teamCode}`,
      icon: '👥',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Register Programmes',
      description: 'Join competitions',
      href: `/team-admin/programmes?team=${teamCode}`,
      icon: '🎯',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'View Results',
      description: 'Check performance',
      href: `/team-admin/results?team=${teamCode}`,
      icon: '🏅',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Team Rankings',
      description: 'View standings',
      href: `/team-admin/rankings?team=${teamCode}`,
      icon: '📈',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Team Details',
      description: 'Update information',
      href: `/team-admin/details?team=${teamCode}`,
      icon: '🏆',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team {teamCode} Dashboard</h1>
              <p className="text-blue-100 text-lg">Manage your team, track performance, and stay updated with activities</p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-4xl">🏆</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full"></div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalCandidates}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">Active members</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registrations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalParticipations}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">Programme entries</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wins</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalWins}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🥇</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">First places</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Podium Finishes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalPodiums}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏅</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">Top 3 positions</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalPoints}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-indigo-600 font-medium">Competition points</span>
          </div>
        </div>
      </div>

      {/* Team Performance Overview */}
      {teamResults.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Recent Results
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentResults.map((result, index) => {
                // Find programme by matching _id, id, or code
                const programme = (programmes || []).find(p => 
                  p._id?.toString() === result.programmeId || 
                  p.id === result.programmeId || 
                  p.code === result.programmeId
                );
                const teamPosition = getTeamPositionInResult(result);
                const positionColors = {
                  1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  2: 'bg-gray-100 text-gray-800 border-gray-200',
                  3: 'bg-orange-100 text-orange-800 border-orange-200'
                };
                const defaultColor = 'bg-blue-100 text-blue-800 border-blue-200';
                
                // Get participant names for this result
                const getParticipantNames = () => {
                  if (teamPosition.type === 'team') return 'Team Result';
                  
                  const teamCandidateChests = (candidates || []).map(c => c.chestNumber);
                  const allPositions = [
                    ...(result.firstPlace || []),
                    ...(result.secondPlace || []),
                    ...(result.thirdPlace || [])
                  ];
                  
                  const teamCandidatesInResult = allPositions
                    .filter(p => teamCandidateChests.includes(p.chestNumber))
                    .map(p => {
                      const candidate = (candidates || []).find(c => c.chestNumber === p.chestNumber);
                      return candidate?.name || p.chestNumber;
                    });
                  
                  return teamCandidatesInResult.length > 0 
                    ? teamCandidatesInResult.join(', ')
                    : 'Individual Result';
                };
                
                return (
                  <div key={index} className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{programme?.name || 'Unknown Programme'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        positionColors[teamPosition.position as keyof typeof positionColors] || defaultColor
                      }`}>
                        {teamPosition.position === 1 ? '🥇 1st' : 
                         teamPosition.position === 2 ? '🥈 2nd' : 
                         teamPosition.position === 3 ? '🥉 3rd' : 
                         `#${teamPosition.position}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{getParticipantNames()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(result.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Candidates by Section */}
        <div className="xl:col-span-1">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100/50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">👥</span>
                Candidates by Section
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(candidatesBySection).map(([section, count]) => {
                  const colors = {
                    senior: 'bg-blue-500',
                    junior: 'bg-green-500',
                    'sub-junior': 'bg-yellow-500'
                  };
                  return (
                    <div key={section} className="flex items-center justify-between p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 transition-all">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${colors[section as keyof typeof colors]} mr-3`}></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {section.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="xl:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100/50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📋</span>
                Recent Activities
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50/80 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 transition-all">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-4 block">📋</span>
                    <p>No recent activities yet</p>
                    <p className="text-sm mt-1">Activities will appear here as you register for programmes and receive results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100/50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-50/80 to-gray-100/80 hover:from-white/90 hover:to-gray-50/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:border-gray-300/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 ${action.bgColor}/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
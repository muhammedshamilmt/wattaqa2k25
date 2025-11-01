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
        fetch('/api/results')
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalCandidates = candidates.length;
  const totalParticipations = participants.length;
  const totalPoints = candidates.reduce((sum, candidate) => sum + candidate.points, 0);
  const avgPoints = totalCandidates > 0 ? (totalPoints / totalCandidates).toFixed(1) : '0';

  // Group candidates by section
  const candidatesBySection = {
    senior: candidates.filter(c => c.section === 'senior').length,
    junior: candidates.filter(c => c.section === 'junior').length,
    'sub-junior': candidates.filter(c => c.section === 'sub-junior').length,
    general: candidates.filter(c => c.section === 'general').length
  };

  // Recent activities (mock data for now)
  const recentActivities = [
    { type: 'registration', message: 'Registered for Football (SP001)', time: '2 hours ago', icon: '🎯' },
    { type: 'candidate', message: 'Added new candidate SMD013', time: '1 day ago', icon: '👥' },
    { type: 'result', message: 'Won 2nd place in Basketball', time: '2 days ago', icon: '🏅' },
    { type: 'registration', message: 'Registered for Classical Dance', time: '3 days ago', icon: '💃' }
  ];

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
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team Dashboard</h1>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalPoints}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-yellow-600 font-medium">Competition points</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Points</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{avgPoints}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">Per candidate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Candidates by Section */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
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
                    'sub-junior': 'bg-yellow-500',
                    general: 'bg-purple-500'
                  };
                  return (
                    <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${colors[section as keyof typeof colors]} mr-3`}></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {section.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📋</span>
                Recent Activities
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
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
                className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 hover:from-white hover:to-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-14 h-14 ${action.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
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
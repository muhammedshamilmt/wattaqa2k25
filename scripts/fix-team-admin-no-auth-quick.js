#!/usr/bin/env node

console.log('🚀 QUICK FIX: REMOVING TEAM ADMIN AUTHENTICATION BARRIERS');
console.log('========================================================');

const fs = require('fs');
const path = require('path');

// Fix 1: Update team admin page to remove Firebase authentication
console.log('\n📋 STEP 1: Fixing team admin page...');

const pagePath = path.join(process.cwd(), 'src/app/team-admin/page.tsx');

const newPageContent = `'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Candidate, Programme, ProgrammeParticipant, Result } from '@/types';
import Link from 'next/link';

export default function TeamDashboard() {
  // Get team code from URL parameters - no authentication required
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team');
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [participants, setParticipants] = useState<ProgrammeParticipant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Start fetching immediately when team code is available
    if (teamCode) {
      fetchDashboardData();
    }
  }, [teamCode]);

  const fetchDashboardData = async () => {
    // Only proceed if we have a valid team code
    if (!teamCode) {
      console.log('🔄 No team code provided');
      return;
    }

    try {
      console.log('🚀 Fetching dashboard data for team:', teamCode);
      
      console.log('📡 Making API calls...');
      const [candidatesRes, programmesRes, participantsRes, resultsRes] = await Promise.all([
        fetch(\`/api/team-admin/candidates?team=\${teamCode}\`),
        fetch('/api/programmes'), // Public data
        fetch(\`/api/programme-participants?team=\${teamCode}\`), // Public data
        fetch('/api/team-admin/results?status=published')
      ]);

      // Log response status for debugging
      console.log('📊 API Response Status:', {
        candidates: candidatesRes.status,
        programmes: programmesRes.status,
        participants: participantsRes.status,
        results: resultsRes.status
      });

      // Check for API errors (no authentication required)
      if (candidatesRes.status === 404) {
        console.log('ℹ️ No candidates found for team:', teamCode);
      }
      if (resultsRes.status === 404) {
        console.log('ℹ️ No results found');
      }

      // Check for other errors
      if (!candidatesRes.ok) {
        console.error('❌ Candidates API error:', candidatesRes.status, candidatesRes.statusText);
      }
      if (!programmesRes.ok) {
        console.error('❌ Programmes API error:', programmesRes.status, programmesRes.statusText);
      }
      if (!participantsRes.ok) {
        console.error('❌ Participants API error:', participantsRes.status, participantsRes.statusText);
      }
      if (!resultsRes.ok) {
        console.error('❌ Results API error:', resultsRes.status, resultsRes.statusText);
      }

      const [candidatesData, programmesData, participantsData, resultsData] = await Promise.all([
        candidatesRes.ok ? candidatesRes.json() : [],
        programmesRes.ok ? programmesRes.json() : [],
        participantsRes.ok ? participantsRes.json() : [],
        resultsRes.ok ? resultsRes.json() : []
      ]);

      console.log('✅ Fetched data counts:', {
        candidates: candidatesData?.length || 0,
        programmes: programmesData?.length || 0,
        participants: participantsData?.length || 0,
        results: resultsData?.length || 0
      });

      // Set data with safe fallbacks
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setProgrammes(Array.isArray(programmesData) ? programmesData : []);
      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setResults(Array.isArray(resultsData) ? resultsData : []);
      
    } catch (error) {
      console.error('💥 Error fetching dashboard data:', error);
      // Set empty arrays on error
      setCandidates([]);
      setProgrammes([]);
      setParticipants([]);
      setResults([]);
    }
  };

  // Show team selection if no team is selected
  if (!teamCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Team Admin Portal
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select your team to access the admin dashboard and manage candidates, programmes, and results.
            </p>
          </div>

          {/* Team Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { code: 'INT', name: 'International', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
              { code: 'SMD', name: 'Syed Madani', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
              { code: 'AQS', name: 'Al-Qasim', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50' },
              { code: 'AHS', name: 'Al-Hasan', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
              { code: 'AHN', name: 'Al-Husain', color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50' },
              { code: 'FTM', name: 'Fatima', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50' }
            ].map((team) => (
              <Link
                key={team.code}
                href={\`/team-admin?team=\${team.code}\`}
                className="group relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={\`absolute inset-0 bg-gradient-to-br \${team.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300\`}></div>
                <div className="relative p-8 text-center">
                  <div className={\`w-16 h-16 mx-auto mb-4 rounded-full \${team.bgColor} flex items-center justify-center\`}>
                    <span className="text-2xl font-bold text-gray-700">{team.code}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
                  <p className="text-gray-600 mb-4">Team {team.code}</p>
                  <div className={\`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r \${team.color} text-white font-medium group-hover:shadow-lg transition-shadow duration-300\`}>
                    Access Dashboard
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-gray-500">
              No authentication required • Direct access to team management
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display team code
  const displayTeamCode = teamCode || 'Unknown';

  // Show content immediately, with loading states for individual components
  const isDataLoading = loading;

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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                Team {displayTeamCode} Dashboard
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                Manage your team, track performance, and stay updated with activities
              </p>
            </div>
            <div className="flex-shrink-0 self-center sm:self-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl sm:text-3xl lg:text-4xl">🏆</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Candidates</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {isDataLoading ? (
                  <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded"></div>
                ) : (
                  totalCandidates
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <span className="text-lg sm:text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Registrations</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {isDataLoading ? (
                  <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded"></div>
                ) : (
                  totalParticipations
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <span className="text-lg sm:text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Points</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {isDataLoading ? (
                  <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded"></div>
                ) : (
                  totalPoints
                )}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
              <span className="text-lg sm:text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates by Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100/50">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
            <span className="mr-2">👥</span>
            Candidates by Section
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(candidatesBySection).map(([section, count]) => {
              const colors = {
                senior: 'bg-blue-500',
                junior: 'bg-green-500',
                'sub-junior': 'bg-yellow-500'
              };
              return (
                <div key={section} className="flex items-center justify-between p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 transition-all">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={\`w-3 h-3 sm:w-4 sm:h-4 rounded-full \${colors[section as keyof typeof colors]} mr-2 sm:mr-3 flex-shrink-0\`}></div>
                    <span className="font-medium text-gray-900 capitalize text-sm sm:text-base truncate">
                      {section.replace('-', ' ')}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full flex-shrink-0 ml-2">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}`;

try {
  fs.writeFileSync(pagePath, newPageContent);
  console.log('✅ Team admin page updated successfully!');
} catch (error) {
  console.log('❌ Error updating team admin page:', error.message);
}

// Fix 2: Update team admin layout to remove authentication barriers
console.log('\n📋 STEP 2: Fixing team admin layout...');

const layoutPath = path.join(process.cwd(), 'src/app/team-admin/layout.tsx');

const newLayoutContent = `'use client';

import { Header } from "@/components/Layouts/header";
import { GrandMarksProvider } from "@/contexts/GrandMarksContext";

export default function TeamAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GrandMarksProvider>
      <div className="min-h-screen bg-gray-50 font-poppins"
        style={{
          backgroundImage: \`linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)\`,
          backgroundSize: '40px 40px'
        }}>
        <Header />
        <main className="w-full relative">
          <div className="bg-white min-h-[calc(100vh-64px)] relative p-3 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </GrandMarksProvider>
  );
}`;

try {
  fs.writeFileSync(layoutPath, newLayoutContent);
  console.log('✅ Team admin layout updated successfully!');
} catch (error) {
  console.log('❌ Error updating team admin layout:', error.message);
}

console.log('\n🎯 QUICK FIX COMPLETE!');
console.log('=====================');

console.log('✅ AUTHENTICATION BARRIERS REMOVED!');
console.log('');
console.log('🎉 Your team admin portal is now accessible without authentication!');
console.log('');
console.log('🚀 IMMEDIATE ACCESS:');
console.log('1. 🌐 Open browser: http://localhost:3000/team-admin');
console.log('2. 👀 See team selection cards immediately');
console.log('3. 🖱️ Click any team (INT, SMD, AQS, etc.)');
console.log('4. 📊 Access full team dashboard');
console.log('');
console.log('🎯 DIRECT TEAM ACCESS:');
console.log('- INT Team: http://localhost:3000/team-admin?team=INT');
console.log('- SMD Team: http://localhost:3000/team-admin?team=SMD');
console.log('- AQS Team: http://localhost:3000/team-admin?team=AQS');
console.log('- AHS Team: http://localhost:3000/team-admin?team=AHS');
console.log('- AHN Team: http://localhost:3000/team-admin?team=AHN');
console.log('- FTM Team: http://localhost:3000/team-admin?team=FTM');
console.log('');
console.log('✅ SUCCESS: No more Firebase authentication required!');
console.log('✅ SUCCESS: No more sign-in barriers!');
console.log('✅ SUCCESS: Immediate access to all team features!');

console.log('\n🏁 Quick fix completed!');
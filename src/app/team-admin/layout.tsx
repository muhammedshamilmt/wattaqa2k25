'use client';

import { useState, useEffect } from 'react';
import { Team } from '@/types';
import { TeamSidebarModern } from '@/components/TeamAdmin/TeamSidebarModern';
import { Header } from "@/components/Layouts/header";
import { GrandMarksProvider } from "@/contexts/GrandMarksContext";
import { TeamAdminProvider } from "@/contexts/TeamAdminContext";
import { FirebaseTeamAuthProvider } from "@/contexts/FirebaseTeamAuthContext";
import { SecureTeamGuard } from "@/components/TeamAdmin/SecureTeamGuard";
import { AdminAccessIndicator } from "@/components/TeamAdmin/AdminAccessIndicator";

export default function TeamAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('Loading...');
  
  // Get team code safely on client side only
  useEffect(() => {
    const updateSelectedTeam = () => {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      try {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const urlTeamCode = urlParams.get('team');
        
        if (urlTeamCode && urlTeamCode.length >= 2) {
          if (selectedTeam !== urlTeamCode) {
            console.log('🔄 Layout: Team code changed from URL:', selectedTeam, '->', urlTeamCode);
            setSelectedTeam(urlTeamCode);
          }
          return;
        }
        
        // Fallback to localStorage for team captain access
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.userType === 'team-captain' && user.team?.code) {
            const teamCode = user.team.code;
            if (teamCode && teamCode !== 'Loading...' && teamCode.length >= 2) {
              if (selectedTeam !== teamCode) {
                console.log('🔄 Layout: Team code changed from localStorage:', selectedTeam, '->', teamCode);
                setSelectedTeam(teamCode);
              }
              return;
            }
          }
        }
      } catch (error) {
        console.error('❌ Error getting team code:', error);
      }
    };

    // Initial load
    updateSelectedTeam();

    // Listen for URL changes
    const handleLocationChange = () => {
      updateSelectedTeam();
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Check for URL changes periodically (fallback for programmatic navigation)
    const intervalId = setInterval(() => {
      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentUrlTeamCode = currentUrlParams.get('team');
      if (currentUrlTeamCode && currentUrlTeamCode !== selectedTeam) {
        updateSelectedTeam();
      }
    }, 500);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(intervalId);
    };
  }, [selectedTeam]);

  // Fetch teams data in background (non-blocking)
  useEffect(() => {
    const fetchTeamsData = async () => {
      try {
        const response = await fetch('/api/teams');
        const teamsData = await response.json();
        setTeams(teamsData);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Don't block the UI if teams fetch fails
      }
    };
    
    fetchTeamsData();
  }, []);

  const selectedTeamData = teams.find(t => t.code === selectedTeam);

  return (
    <FirebaseTeamAuthProvider>
      <SecureTeamGuard>
        <GrandMarksProvider>
          <TeamAdminProvider initialTeamCode={selectedTeam !== 'Loading...' ? selectedTeam : undefined}>
            <div className="flex min-h-screen bg-gray-50 font-poppins"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}>

              <TeamSidebarModern 
                selectedTeam={selectedTeam} 
                teamData={selectedTeamData}
                onSwitchTeam={() => {}}
              />
              <div className="w-full bg-transparent">
                <AdminAccessIndicator />
                <Header />
                <main className="w-full relative">
                  <div className="bg-white min-h-[calc(100vh-64px)] relative p-3 overflow-y-auto">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </TeamAdminProvider>
        </GrandMarksProvider>
      </SecureTeamGuard>
    </FirebaseTeamAuthProvider>
  );
}
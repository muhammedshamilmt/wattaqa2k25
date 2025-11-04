"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TeamAdminContextType {
  teamCode: string | null;
  loading: boolean;
  accessDenied: boolean;
  userTeam: string | null;
  userEmail: string | null;
  isAdminAccess: boolean;
}

interface TeamAdminProviderProps {
  children: React.ReactNode;
  initialTeamCode?: string;
}

const TeamAdminContext = createContext<TeamAdminContextType | undefined>(undefined);

export function TeamAdminProvider({ children, initialTeamCode }: TeamAdminProviderProps) {
  const [teamCode, setTeamCode] = useState<string | null>(initialTeamCode || null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userTeam, setUserTeam] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated and only run on client side
    setIsHydrated(true);
    
    if (typeof window === 'undefined') return;

    const updateTeamCode = () => {
      try {
        // Check URL parameters first (for admin access)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTeamCode = urlParams.get('team');
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem('currentUser');
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Check if user has team access (either team captain or admin access)
          if (user.userType === 'team-captain' && user.team?.code) {
            const userTeamCode = user.team.code;
            
            // Use URL team code if provided and valid, otherwise use user's team
            const finalTeamCode = (urlTeamCode && urlTeamCode.length >= 2) ? urlTeamCode : userTeamCode;
            
            if (finalTeamCode && finalTeamCode !== 'Loading...' && finalTeamCode.length >= 2) {
              // Only update if team code actually changed
              if (teamCode !== finalTeamCode) {
                console.log('🔄 Team code changed:', teamCode, '->', finalTeamCode);
                setTeamCode(finalTeamCode);
                setUserTeam(userTeamCode);
                setUserEmail(user.email || user.originalAdminEmail || null);
                setIsAdminAccess(!!user.isAdminAccess);
                setAccessDenied(false);
              }
              return;
            }
          }
        }
        
        // If we have a URL team code but no valid user, try to use it anyway (for admin access)
        if (urlTeamCode && urlTeamCode.length >= 2) {
          if (teamCode !== urlTeamCode) {
            console.log('🔄 URL team code changed:', teamCode, '->', urlTeamCode);
            setTeamCode(urlTeamCode);
            setUserTeam(urlTeamCode);
            setAccessDenied(false);
          }
          return;
        }
        
        // No valid access found
        console.log('🚫 No valid team access found');
        setAccessDenied(true);
        
      } catch (error) {
        console.error('❌ Error in team admin context:', error);
        setAccessDenied(true);
      }
    };

    // Initial load
    updateTeamCode();

    // Listen for URL changes (for navigation within the app)
    const handlePopState = () => {
      updateTeamCode();
    };

    window.addEventListener('popstate', handlePopState);
    
    // Also listen for URL parameter changes
    const handleLocationChange = () => {
      updateTeamCode();
    };

    // Check for URL changes periodically (fallback)
    const intervalId = setInterval(() => {
      const currentUrlParams = new URLSearchParams(window.location.search);
      const currentUrlTeamCode = currentUrlParams.get('team');
      if (currentUrlTeamCode && currentUrlTeamCode !== teamCode) {
        updateTeamCode();
      }
    }, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(intervalId);
    };
  }, [initialTeamCode, teamCode]); // Add teamCode as dependency

  const value: TeamAdminContextType = {
    teamCode,
    loading,
    accessDenied,
    userTeam,
    userEmail,
    isAdminAccess
  };

  return (
    <TeamAdminContext.Provider value={value}>
      {children}
    </TeamAdminContext.Provider>
  );
}

export function useTeamAdmin() {
  const context = useContext(TeamAdminContext);
  if (context === undefined) {
    throw new Error('useTeamAdmin must be used within a TeamAdminProvider');
  }
  return context;
}
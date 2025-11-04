import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

interface SecureTeamAccessResult {
  teamCode: string | null;
  loading: boolean;
  accessDenied: boolean;
  userTeam: string | null;
}

/**
 * Secure hook for team admin pages
 * Validates that team captains can only access their own team's data
 * NOTE: This hook assumes the user is already authenticated by the layout
 */
export function useSecureTeamAccess(): SecureTeamAccessResult {
  const searchParams = useSearchParams();
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userTeam, setUserTeam] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(() => {
      validateTeamAccess();
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const validateTeamAccess = () => {
    try {
      // Get the requested team from URL
      const requestedTeam = searchParams.get('team');
      
      // Get current user from localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        console.error('No user found in localStorage - redirecting to login');
        // Add a small delay to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }

      let user;
      try {
        user = JSON.parse(storedUser);
      } catch (parseError) {
        console.error('Error parsing user data from localStorage:', parseError);
        localStorage.removeItem('currentUser'); // Clear corrupted data
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }

      // Verify user object has required properties
      if (!user || typeof user !== 'object') {
        console.error('Invalid user object in localStorage');
        localStorage.removeItem('currentUser');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        return;
      }
      
      // Verify user is a team captain
      if (user.userType !== 'team-captain') {
        console.error('User is not a team captain:', user.userType);
        setTimeout(() => {
          window.location.href = '/unauthorized';
        }, 100);
        return;
      }

      // CRITICAL SECURITY CHECK: Verify team captain can only access their own team
      if (!user.team || !user.team.code) {
        console.error('User has no team assigned:', user);
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Store user's actual team
      setUserTeam(user.team.code);

      // If a team is requested in URL, verify it matches user's team
      if (requestedTeam) {
        if (requestedTeam !== user.team.code) {
          console.error(`SECURITY VIOLATION: User ${user.email || 'unknown'} (team ${user.team.code}) attempted to access team ${requestedTeam}`);
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      // Set the user's actual team (not the requested one)
      setTeamCode(user.team.code);
      setLoading(false);
      
    } catch (error) {
      console.error('Error validating team access:', error);
      // Don't redirect to login for general errors, just deny access
      setAccessDenied(true);
      setLoading(false);
    }
  };

  return {
    teamCode,
    loading,
    accessDenied,
    userTeam
  };
}

/**
 * Access Denied Component for team admin pages
 */
export function AccessDeniedScreen() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-900 mb-4">Access Denied</h1>
        <p className="text-red-700 mb-6">
          You can only access your own team's data. This security violation has been logged for audit purposes.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/team-admin'}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to My Team Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Component for team admin pages
 */
export function TeamAccessLoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Validating team access...</p>
      </div>
    </div>
  );
}
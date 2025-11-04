'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseTeamAuth } from '@/contexts/FirebaseTeamAuthContext';

interface SecureTeamGuardProps {
  children: React.ReactNode;
}

function SecureTeamGuardContent({ children }: SecureTeamGuardProps) {
  const { user, loading, signInWithGoogleAuth, checkTeamAccess, findUserTeam, authorizedTeamCode } = useFirebaseTeamAuth();
  const [teamAccessLoading, setTeamAccessLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoRedirecting, setAutoRedirecting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTeamCode = searchParams.get('team');

  // Auto-find user's team if no team code provided, or verify access if team code provided
  useEffect(() => {
    const handleTeamAccess = async () => {
      if (!user) {
        return;
      }

      // If no team code provided, find user's team automatically
      if (!requestedTeamCode) {
        console.log('🔍 No team code provided, finding user team...');
        setAutoRedirecting(true);
        setAccessDenied(false);
        setErrorMessage('');

        try {
          const userTeam = await findUserTeam();
          
          if (userTeam) {
            console.log('✅ Found user team, redirecting to:', userTeam.teamCode);
            router.push(`/team-admin?team=${userTeam.teamCode}`);
            return;
          } else {
            console.log('🚫 No team found for user');
            setAccessDenied(true);
            setErrorMessage(`No team access found for your email (${user.email}). Please contact an administrator to add your email to a team.`);
          }
        } catch (error) {
          console.error('❌ Error finding user team:', error);
          setAccessDenied(true);
          setErrorMessage('Error finding your team access. Please try again.');
        } finally {
          setAutoRedirecting(false);
        }
        return;
      }

      // If team code provided, verify access
      // If already authorized for this team, allow access
      if (authorizedTeamCode === requestedTeamCode) {
        setAccessDenied(false);
        return;
      }

      setTeamAccessLoading(true);
      setAccessDenied(false);
      setErrorMessage('');

      try {
        const hasAccess = await checkTeamAccess(requestedTeamCode);
        
        if (!hasAccess) {
          setAccessDenied(true);
          setErrorMessage(`Access denied for team ${requestedTeamCode}. Your email (${user.email}) is not authorized for this team.`);
        }
      } catch (error) {
        console.error('❌ Error verifying team access:', error);
        setAccessDenied(true);
        setErrorMessage('Error verifying team access. Please try again.');
      } finally {
        setTeamAccessLoading(false);
      }
    };

    handleTeamAccess();
  }, [user, requestedTeamCode, checkTeamAccess, findUserTeam, authorizedTeamCode, router]);

  // Show loading screen during Firebase auth initialization
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Authentication</h2>
          <p className="text-gray-600">Please wait while we set up secure access...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Admin Portal</h2>
            <p className="text-gray-600 mb-8">
              Sign in with your authorized Gmail account to access your team's admin portal.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={signInWithGoogleAuth}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Only authorized team captains and admins can access this portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show auto-redirecting loading
  if (autoRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Finding Your Team</h2>
          <p className="text-gray-600">Checking which team you have access to...</p>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              ✅ Signed in as: <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show team access verification loading
  if (teamAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Team Access</h2>
          <p className="text-gray-600">Checking your authorization for team {requestedTeamCode}...</p>
        </div>
      </div>
    );
  }

  // Show access denied screen
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                {errorMessage}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Signed in as:</h3>
              <div className="flex items-center justify-center space-x-3">
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-blue-900">{user.displayName}</p>
                  <p className="text-sm text-blue-700">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/admin/teams')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Admin Teams Page
              </button>
              
              <button
                onClick={() => {
                  setAccessDenied(false);
                  setErrorMessage('');
                  // Try to check access again
                  if (requestedTeamCode) {
                    checkTeamAccess(requestedTeamCode);
                  }
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retry Access Check
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Need access? Contact an administrator to add your email to the team.
              </p>
              <button
                onClick={() => {
                  // Sign out and allow different account
                  router.push('/login');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Sign in with different account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Note: No team code check here - we handle it automatically in useEffect

  // User is authenticated and has access to the requested team
  return <>{children}</>;
}

export function SecureTeamGuard({ children }: SecureTeamGuardProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SecureTeamGuardContent>{children}</SecureTeamGuardContent>
    </Suspense>
  );
}
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { signInWithGoogle, signOutUser, handleRedirectResult } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface TeamAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  teamCode?: string;
  teamName?: string;
  isTeamCaptain: boolean;
  isAdminAccess?: boolean;
}

interface FirebaseTeamAuthContextType {
  user: TeamAuthUser | null;
  loading: boolean;
  signInWithGoogleAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  checkTeamAccess: (teamCode: string) => Promise<boolean>;
  findUserTeam: () => Promise<{ teamCode: string; teamName: string } | null>;
  authorizedTeamCode: string | null;
}

const FirebaseTeamAuthContext = createContext<FirebaseTeamAuthContextType | undefined>(undefined);

export function FirebaseTeamAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TeamAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorizedTeamCode, setAuthorizedTeamCode] = useState<string | null>(null);
  const router = useRouter();

  // Find which team the user has access to
  const findUserTeam = async (): Promise<{ teamCode: string; teamName: string } | null> => {
    if (!user?.email) {
      console.log('🚫 No user email available for team search');
      return null;
    }

    try {
      console.log('🔍 Finding team for user:', user.email);
      
      const response = await fetch(`/api/auth/find-user-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email
        })
      });

      const result = await response.json();
      
      if (response.ok && result.hasAccess) {
        console.log('✅ Team found for user:', user.email, 'team:', result.teamCode);
        setAuthorizedTeamCode(result.teamCode);
        return {
          teamCode: result.teamCode,
          teamName: result.teamName
        };
      } else {
        console.log('🚫 No team access found for user:', user.email);
        console.log('📋 Available teams:', result.availableTeams || 'None');
        setAuthorizedTeamCode(null);
        return null;
      }
    } catch (error) {
      console.error('❌ Error finding user team:', error);
      setAuthorizedTeamCode(null);
      return null;
    }
  };

  // Check if user's email is authorized for a specific team
  const checkTeamAccess = async (teamCode: string): Promise<boolean> => {
    if (!user?.email) {
      console.log('🚫 No user email available for team access check');
      return false;
    }

    try {
      console.log('🔍 Checking team access for:', user.email, 'team:', teamCode);
      
      const response = await fetch(`/api/auth/check-team-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          teamCode: teamCode
        })
      });

      const result = await response.json();
      
      if (response.ok && result.hasAccess) {
        console.log('✅ Team access granted for:', user.email, 'team:', teamCode);
        setAuthorizedTeamCode(teamCode);
        return true;
      } else {
        console.log('🚫 Team access denied for:', user.email, 'team:', teamCode);
        console.log('📋 Reason:', result.message || 'Access denied');
        setAuthorizedTeamCode(null);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking team access:', error);
      setAuthorizedTeamCode(null);
      return false;
    }
  };

  // Sign in with Google (with automatic fallback to redirect)
  const signInWithGoogleAuth = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting Google sign-in...');
      
      try {
        // First try popup method
        const result = await signInWithGoogle(false);
        
        if (result) {
          const firebaseUser = result.user;
          
          if (firebaseUser.email) {
            console.log('✅ Google sign-in successful (popup):', firebaseUser.email);
            
            // Create team auth user object
            const teamAuthUser: TeamAuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email,
              photoURL: firebaseUser.photoURL || undefined,
              isTeamCaptain: true, // Will be verified against database
            };

            setUser(teamAuthUser);
            
            // Store user data for persistence
            localStorage.setItem('firebaseTeamUser', JSON.stringify(teamAuthUser));
            
            console.log('👤 Team auth user created:', teamAuthUser.email);
          } else {
            throw new Error('No email found in Google account');
          }
        }
      } catch (popupError: any) {
        console.log('⚠️ Popup sign-in failed, trying redirect method...', popupError.message);
        
        // If popup fails due to blocker or user cancellation, try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.message.includes('popup') ||
            popupError.message.includes('cancelled')) {
          
          console.log('🔄 Switching to redirect authentication...');
          
          // Show user-friendly message
          const useRedirect = confirm(
            'Popup sign-in was blocked or cancelled.\n\n' +
            'Would you like to try redirect sign-in instead?\n' +
            '(You will be redirected to Google and back)'
          );
          
          if (useRedirect) {
            // Use redirect method - this will redirect the page
            await signInWithGoogle(true);
            // Note: Code after this won't execute as page redirects
            return;
          } else {
            throw new Error('Sign-in cancelled by user');
          }
        } else {
          // Re-throw other errors
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to sign in with Google';
      if (error.message.includes('popup') || error.message.includes('cancelled')) {
        errorMessage = 'Sign-in was cancelled. Please try again or allow popups for this site.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('unauthorized-domain')) {
        errorMessage = 'This domain is not authorized. Please contact support.';
      }
      
      alert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      
      await signOutUser();
      setUser(null);
      setAuthorizedTeamCode(null);
      
      // Clear stored data
      localStorage.removeItem('firebaseTeamUser');
      localStorage.removeItem('currentUser'); // Clear old auth data
      localStorage.removeItem('authToken'); // Clear old auth data
      
      console.log('✅ User signed out successfully');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // Listen for Firebase auth state changes and handle redirect results
  useEffect(() => {
    console.log('🔄 Setting up Firebase auth listener...');
    
    // Check for redirect result first (in case user was redirected back from Google)
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result && result.user.email) {
          console.log('✅ Google sign-in redirect successful:', result.user.email);
          
          const teamAuthUser: TeamAuthUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || result.user.email,
            photoURL: result.user.photoURL || undefined,
            isTeamCaptain: true,
          };

          setUser(teamAuthUser);
          localStorage.setItem('firebaseTeamUser', JSON.stringify(teamAuthUser));
          
          console.log('👤 Team auth user created from redirect:', teamAuthUser.email);
        }
      } catch (error) {
        console.error('❌ Error handling redirect result:', error);
      }
    };
    
    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      console.log('🔔 Firebase auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser && firebaseUser.email) {
        // User is signed in
        const teamAuthUser: TeamAuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          photoURL: firebaseUser.photoURL || undefined,
          isTeamCaptain: true,
        };

        setUser(teamAuthUser);
        localStorage.setItem('firebaseTeamUser', JSON.stringify(teamAuthUser));
        
        console.log('✅ Firebase user authenticated:', firebaseUser.email);
      } else {
        // User is signed out
        setUser(null);
        setAuthorizedTeamCode(null);
        localStorage.removeItem('firebaseTeamUser');
        
        console.log('🚫 No Firebase user authenticated');
      }
      
      setLoading(false);
    });

    // Check for stored user data on initial load
    const storedUser = localStorage.getItem('firebaseTeamUser');
    if (storedUser && !user) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('📦 Restored user from storage:', userData.email);
        setUser(userData);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        localStorage.removeItem('firebaseTeamUser');
      }
    }

    return () => {
      console.log('🔄 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const value: FirebaseTeamAuthContextType = {
    user,
    loading,
    signInWithGoogleAuth,
    signOut,
    checkTeamAccess,
    findUserTeam,
    authorizedTeamCode
  };

  return (
    <FirebaseTeamAuthContext.Provider value={value}>
      {children}
    </FirebaseTeamAuthContext.Provider>
  );
}

export function useFirebaseTeamAuth() {
  const context = useContext(FirebaseTeamAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseTeamAuth must be used within a FirebaseTeamAuthProvider');
  }
  return context;
}
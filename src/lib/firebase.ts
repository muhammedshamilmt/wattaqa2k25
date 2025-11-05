import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAzGdDSntSR6EwvHrYv4APWB4cPgwdjnC8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "wattaqa2k25-e04a8.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wattaqa2k25-e04a8",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "wattaqa2k25-e04a8.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1055515910417",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055515910417:web:bf2cdbaadad6b75fe46cb0",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7YHF3F89KQ"
};

// Debug: Log configuration (remove in production)
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? '***' + firebaseConfig.appId.slice(-4) : 'missing',
});

// Initialize Firebase
let app;
let auth: ReturnType<typeof getAuth>;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Sign in with Google (with automatic fallback to redirect)
export const signInWithGoogle = async (useRedirect = false) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    console.log('Attempting Google sign-in...', useRedirect ? '(redirect mode)' : '(popup mode)');
    
    if (useRedirect) {
      // Use redirect method (more reliable, avoids popup blockers)
      console.log('Using redirect method to avoid popup blockers...');
      await signInWithRedirect(auth, googleProvider);
      // Note: This will redirect the page, so we won't reach the return statement
      return null;
    } else {
      // Use popup method (faster UX when it works)
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      return result;
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Auto-retry with redirect method for popup-related errors
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      console.log('Popup failed, automatically trying redirect method...');
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Redirect will handle the rest
      } catch (redirectError) {
        console.error('Redirect method also failed:', redirectError);
        throw new Error('Both popup and redirect sign-in methods failed. Please check your browser settings.');
      }
    }
    
    // Provide more specific error messages
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase configuration error. Please check your project settings.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for OAuth operations. Please check Firebase Console.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
};

// Handle redirect result (call this on page load)
export const handleRedirectResult = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('Google sign-in redirect successful:', result.user.email);
      return result;
    }
    return null;
  } catch (error: any) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { auth };
export default app;
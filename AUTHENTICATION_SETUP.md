# Authentication System Setup

## Overview
This project now includes a complete authentication system with Firebase integration and admin role checking.

## Features
- **Firebase Google Authentication**: Users can sign in with their Google accounts
- **Admin Role Checking**: Only users with the admin email can access admin routes
- **Protected Routes**: Admin routes are protected and redirect unauthorized users
- **User Session Management**: User data is stored in localStorage and managed via React Context

## Configuration

### Environment Variables
The following environment variables are configured in `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAzGdDSntSR6EwvHrYv4APWB4cPgwdjnC8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wattaqa2k25-e04a8.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wattaqa2k25-e04a8
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wattaqa2k25-e04a8.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1055515910417
NEXT_PUBLIC_FIREBASE_APP_ID=1:1055515910417:web:bf2cdbaadad6b75fe46cb0
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7YHF3F89KQ

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=dawafest@gmail.com
```

### Admin Access
- **Admin Email**: `dawafest@gmail.com`
- Only users signing in with this email will have admin privileges
- Admin users are redirected to `/admin` after login
- Regular users are redirected to `/` (landing page)

## Pages Created

### 1. Login Page (`/login`)
- Email/password login form
- Google Sign-In button
- Checks if Google email matches admin email
- Redirects based on user role

### 2. Signup Page (`/signup`)
- User registration form
- Google Sign-Up option
- Same admin checking logic as login

## Components Created

### 1. Firebase Configuration (`src/lib/firebase.ts`)
- Firebase app initialization
- Google authentication functions
- Sign out functionality

### 2. Authentication Context (`src/contexts/AuthContext.tsx`)
- User state management
- Authentication status tracking
- Login/logout functions

### 3. Protected Route Component (`src/components/ProtectedRoute.tsx`)
- Route protection logic
- Admin role verification
- Automatic redirects for unauthorized access

### 4. Sign-In UI Component (`src/components/ui/sign-in.tsx`)
- Reusable sign-in page layout
- Testimonials section
- Responsive design

### 5. Toast Hook (`src/hooks/use-toast.ts`)
- Simple toast notification system
- Success and error messages

## How It Works

1. **User visits `/login`**
2. **User clicks "Continue with Google"**
3. **Firebase handles Google authentication**
4. **System checks if user email matches `NEXT_PUBLIC_ADMIN_EMAIL`**
5. **If admin email**: User is marked as admin and redirected to `/admin`
6. **If regular email**: User is marked as regular user and redirected to `/`
7. **User data is stored in localStorage and React Context**

## Admin Route Protection

All routes under `/admin/*` are protected by the `ProtectedRoute` component:
- Checks for valid user session
- Verifies admin privileges
- Redirects unauthorized users to login page

## Navigation Updates

- Landing page navbar now shows "Login" button instead of direct admin access
- Header in admin panel shows user information and logout option
- User dropdown includes profile info and sign-out functionality

## Usage

1. **Start the development server**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Click "Login"** in the navbar
4. **Sign in with Google** using the admin email to access admin features
5. **Sign in with any other Google account** for regular user access

## Security Notes

- Admin email is configured via environment variables
- Firebase handles secure authentication
- User sessions are managed client-side (suitable for demo purposes)
- In production, consider server-side session management for enhanced security

## Dependencies Added

- `firebase`: For authentication and Google Sign-In functionality

The authentication system is now fully functional and ready for use!
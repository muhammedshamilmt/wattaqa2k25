# 🔐 Google Authentication Troubleshooting Guide

## Issue: "Try again" error when signing in with Google to Team Admin Portal

### ✅ Configuration Status
- **Firebase Environment Variables**: All present and correct
- **Project ID**: wattaqa2k25-e04a8 ✅
- **Auth Domain**: wattaqa2k25-e04a8.firebaseapp.com ✅
- **API Key**: Format correct ✅

## 🎯 Most Likely Causes (in order of probability)

### 1. 🌐 Unauthorized Domain (80% of cases)
**Problem**: Your current domain is not authorized in Firebase Console

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `wattaqa2k25-e04a8`
3. Navigate to **Authentication > Settings > Authorized domains**
4. Click **"Add domain"** and add:
   - `localhost` (for development)
   - `localhost:3000` (for development with port)
   - Your production domain (if deployed)
5. Save changes and try signing in again

### 2. 🚫 Popup Blocked (15% of cases)
**Problem**: Browser is blocking the authentication popup

**Solution**:
1. Look for popup blocker icon in your browser's address bar
2. Click it and select **"Always allow popups from this site"**
3. Or manually add your domain to allowed popups in browser settings
4. Refresh the page and try signing in again

### 3. 🔑 Google Cloud OAuth Configuration (3% of cases)
**Problem**: OAuth consent screen not properly configured

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `festival-management-476511`
3. Navigate to **APIs & Services > OAuth consent screen**
4. Ensure the consent screen is configured with:
   - App name: Wattaqa 2K25
   - User support email
   - Developer contact email
5. Go to **APIs & Services > Credentials**
6. Check OAuth 2.0 Client IDs are configured
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-domain.com`

### 4. 🔄 Browser Cache Issue (2% of cases)
**Problem**: Old authentication data cached in browser

**Solution**:
1. Open Developer Tools (F12)
2. Right-click refresh button and select **"Empty Cache and Hard Reload"**
3. Or clear browser data:
   - Cookies and site data
   - Cached images and files
4. Try signing in again

## 🚀 Quick Diagnostic Steps

### Step 1: Check Browser Console
1. Press **F12** to open Developer Tools
2. Click on **Console** tab
3. Try signing in and look for error messages
4. Common errors to look for:
   - `auth/unauthorized-domain`
   - `auth/popup-blocked`
   - `auth/configuration-not-found`

### Step 2: Test in Incognito Mode
1. Open incognito/private browsing window
2. Navigate to your team admin page
3. Try signing in with Google
4. If it works in incognito, clear your browser cache

### Step 3: Try Different Browser
1. Test in Chrome, Firefox, Safari, or Edge
2. If it works in one browser but not another, check browser settings
3. Look for popup blockers or security settings

## 🎯 Immediate Action Plan

### Action 1: Firebase Console Check (5 minutes)
1. ✅ Go to https://console.firebase.google.com/
2. ✅ Select `wattaqa2k25-e04a8` project
3. ✅ Check **Authentication > Settings > Authorized domains**
4. ✅ Add `localhost` and `localhost:3000` if missing
5. ✅ Verify **Authentication > Sign-in method > Google** is enabled

### Action 2: Test Authentication (2 minutes)
1. ✅ Clear browser cache and cookies
2. ✅ Open incognito window
3. ✅ Go to team admin page
4. ✅ Click "Sign in with Google"
5. ✅ Check browser console for errors

### Action 3: Google Cloud Console Check (5 minutes)
1. ✅ Go to https://console.cloud.google.com/
2. ✅ Select `festival-management-476511` project
3. ✅ Check **APIs & Services > OAuth consent screen**
4. ✅ Ensure app is configured and published
5. ✅ Check **Credentials** for OAuth 2.0 Client IDs

## 🔍 Common Error Messages & Solutions

| Error Message | Solution |
|---------------|----------|
| "Try again" | Generic error - usually popup blocked or domain not authorized |
| `auth/popup-blocked` | Allow popups for your domain in browser settings |
| `auth/popup-closed-by-user` | Complete the sign-in process in the popup window |
| `auth/unauthorized-domain` | Add your domain to Firebase authorized domains |
| `auth/configuration-not-found` | Check Firebase project configuration |
| `auth/network-request-failed` | Check internet connection and try again |

## 📞 If Issue Persists

Please provide these details:
1. **Exact error message** from browser console
2. **Browser and version** you are using
3. **Whether popup appears** or gets blocked
4. **Screenshot** of any error messages
5. **Whether it works** in incognito mode

## 🎯 Firebase Console Checklist

- [ ] Go to https://console.firebase.google.com/
- [ ] Select project: `wattaqa2k25-e04a8`
- [ ] **Authentication > Sign-in method > Google** enabled
- [ ] **Authentication > Settings > Authorized domains** includes:
  - [ ] `localhost`
  - [ ] `localhost:3000`
  - [ ] Your production domain
- [ ] Project settings match `.env.local` values

## 🎯 Google Cloud Console Checklist

- [ ] Go to https://console.cloud.google.com/
- [ ] Select project: `festival-management-476511`
- [ ] **APIs & Services > OAuth consent screen** configured
- [ ] **APIs & Services > Credentials > OAuth 2.0 Client IDs** exist
- [ ] **Authorized JavaScript origins** include:
  - [ ] `http://localhost:3000`
  - [ ] `https://your-domain.com`

## 🚀 Success Indicators

You'll know the issue is fixed when:
1. ✅ Google sign-in popup appears without being blocked
2. ✅ You can complete the Google authentication flow
3. ✅ You're redirected to the team admin dashboard
4. ✅ No error messages appear in browser console

---

**Most Common Fix**: Add `localhost` and `localhost:3000` to Firebase authorized domains. This resolves 80% of authentication issues.
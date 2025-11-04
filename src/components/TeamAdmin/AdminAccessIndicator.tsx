"use client";

import { useState, useEffect } from 'react';

export function AdminAccessIndicator() {
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    const checkAdminAccess = () => {
      const adminAccess = localStorage.getItem('adminTeamAccess') === 'true';
      const originalEmail = localStorage.getItem('originalAdminEmail');
      const currentUser = localStorage.getItem('currentUser');
      
      if (adminAccess && originalEmail && currentUser) {
        try {
          const user = JSON.parse(currentUser);
          setIsAdminAccess(true);
          setAdminEmail(originalEmail);
          setTeamName(user.team?.name || 'Unknown Team');
        } catch (error) {
          console.error('Error parsing admin access data:', error);
        }
      }
    };

    checkAdminAccess();
  }, []);

  const handleExitAdminMode = () => {
    if (confirm('Exit admin team access mode? You will be redirected back to the admin dashboard.')) {
      // Clear admin access data
      localStorage.removeItem('adminTeamAccess');
      localStorage.removeItem('originalAdminEmail');
      localStorage.removeItem('currentUser');
      
      // Redirect to admin dashboard
      window.location.href = '/admin';
    }
  };

  if (!isAdminAccess) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium">Admin Access Mode</span>
          </div>
          <div className="text-sm opacity-90">
            <span className="font-medium">{adminEmail}</span> accessing <span className="font-medium">{teamName}</span> portal
          </div>
        </div>
        
        <button
          onClick={handleExitAdminMode}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Exit Admin Mode</span>
        </button>
      </div>
    </div>
  );
}
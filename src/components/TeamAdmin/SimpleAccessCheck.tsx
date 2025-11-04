'use client';

import { useTeamAdmin } from '@/contexts/TeamAdminContext';

export function SimpleAccessCheck({ children }: { children: React.ReactNode }) {
  const { teamCode, accessDenied } = useTeamAdmin();

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this team portal.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact an administrator for access.</p>
        </div>
      </div>
    );
  }

  if (!teamCode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team portal...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
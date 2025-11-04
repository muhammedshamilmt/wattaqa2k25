'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface TeamBreadcrumbProps {
  pageName: string;
  teamData?: {
    code: string;
    name: string;
    color: string;
  };
}

function TeamBreadcrumbContent({ pageName, teamData }: TeamBreadcrumbProps) {
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team') || teamData?.code || '';

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link 
              className="font-medium text-gray-600 hover:text-gray-900" 
              href={`/team-admin?team=${teamCode}`}
            >
              Team Dashboard /
            </Link>
          </li>
          <li className="font-medium" style={{ color: teamData?.color || '#3B82F6' }}>
            {pageName}
          </li>
        </ol>
      </nav>
    </div>
  );
}

export default function TeamBreadcrumb(props: TeamBreadcrumbProps) {
  return (
    <Suspense fallback={
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
      </div>
    }>
      <TeamBreadcrumbContent {...props} />
    </Suspense>
  );
}
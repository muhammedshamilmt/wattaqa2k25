'use client';

import { Team } from '@/types';

interface TeamHeaderProps {
  teamData?: Team;
}

export default function TeamHeader({ teamData }: TeamHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20 lg:relative lg:shadow-none lg:border-none">
      <div className="px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
            <div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0"
              style={{ backgroundColor: teamData?.color }}
            >
              {teamData?.code}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{teamData?.name}</h1>
              <p className="text-xs md:text-sm text-gray-600 font-medium truncate hidden sm:block">{teamData?.description}</p>
            </div>
          </div>
          
          {/* Desktop Stats */}
          <div className="hidden xl:flex items-center space-x-4">
            <div className="text-center px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xl font-bold text-gray-900">{teamData?.members || 0}</div>
              <div className="text-xs text-gray-500 font-medium">Members</div>
            </div>
            <div className="text-center px-4 py-3 rounded-xl shadow-lg text-white"
                 style={{ 
                   background: `linear-gradient(135deg, ${teamData?.color} 0%, ${teamData?.color}dd 100%)` 
                 }}>
              <div className="text-xl font-bold">{teamData?.points || 0}</div>
              <div className="text-xs opacity-90 font-medium">Points</div>
            </div>
            <div className="text-center px-4 py-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
              <div className="text-lg font-bold text-green-600">●</div>
              <div className="text-xs text-green-600 font-medium">Active</div>
            </div>
          </div>

          {/* Mobile/Tablet Stats */}
          <div className="flex xl:hidden items-center space-x-2 md:space-x-3">
            <div className="text-center px-2 md:px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm md:text-lg font-bold text-gray-900">{teamData?.members || 0}</div>
              <div className="text-xs text-gray-500">👥</div>
            </div>
            <div className="text-center px-2 md:px-3 py-2 rounded-lg shadow-md text-white"
                 style={{ backgroundColor: teamData?.color }}>
              <div className="text-sm md:text-lg font-bold">{teamData?.points || 0}</div>
              <div className="text-xs opacity-90">🏆</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Team } from '@/types';

interface TeamSidebarProps {
  selectedTeam: string;
  teamData?: Team;
  onSwitchTeam: () => void;
}

const getNavigation = (teamCode: string) => [
  {
    name: 'Dashboard',
    href: `/team-admin?team=${teamCode}`,
    icon: '📊',
    description: 'Overview & Statistics',
    shortName: 'Home'
  },
  {
    name: 'Team Details',
    href: `/team-admin/details?team=${teamCode}`,
    icon: '🏆',
    description: 'Team Information',
    shortName: 'Details'
  },
  {
    name: 'Candidates',
    href: `/team-admin/candidates?team=${teamCode}`,
    icon: '👥',
    description: 'Manage Team Members',
    shortName: 'Members'
  },
  {
    name: 'Programmes',
    href: `/team-admin/programmes?team=${teamCode}`,
    icon: '🎯',
    description: 'Programme Participation',
    shortName: 'Programs'
  },
  {
    name: 'Results',
    href: `/team-admin/results?team=${teamCode}`,
    icon: '🏅',
    description: 'Competition Results',
    shortName: 'Results'
  },
  {
    name: 'Rankings',
    href: `/team-admin/rankings?team=${teamCode}`,
    icon: '📈',
    description: 'Team Rankings',
    shortName: 'Ranks'
  }
];

export default function TeamSidebar({ selectedTeam, teamData, onSwitchTeam }: TeamSidebarProps) {
  const pathname = usePathname();
  const navigation = getNavigation(selectedTeam);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsCollapsed(window.innerWidth < 1280);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl lg:hidden">
        <div className="flex justify-around items-center py-2 px-4">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={isActive ? { 
                  backgroundColor: teamData?.color,
                  boxShadow: `0 4px 12px ${teamData?.color}40`
                } : {}}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white shadow-2xl h-screen flex flex-col border-r border-gray-100 transition-all duration-300 ease-in-out hidden lg:flex`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-all duration-200"
      >
        <span className={`text-xs text-gray-600 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
          ◀
        </span>
      </button>

      {/* Team Header */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-gray-100 transition-all duration-300`} 
           style={{ 
             background: `linear-gradient(135deg, ${teamData?.color}15 0%, ${teamData?.color}05 100%)` 
           }}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
          <div 
            className={`${isCollapsed ? 'w-12 h-12' : 'w-16 h-16'} rounded-2xl flex items-center justify-center text-white font-bold shadow-xl transition-all duration-300`}
            style={{ backgroundColor: teamData?.color }}
          >
            <span className={`${isCollapsed ? 'text-sm' : 'text-lg'}`}>
              {selectedTeam}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-xl truncate">{teamData?.name}</h2>
              <p className="text-sm text-gray-500 font-medium">Team Admin Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} overflow-y-auto transition-all duration-300`}>
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-4 py-4'} text-sm font-medium rounded-2xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-white shadow-xl transform scale-105'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md hover:scale-102'
                }`}
                style={isActive ? { 
                  backgroundColor: teamData?.color,
                  boxShadow: `0 10px 30px ${teamData?.color}40`
                } : {}}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={`${isCollapsed ? 'text-2xl' : 'text-xl mr-4'} transition-all duration-200`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className={`text-xs mt-1 truncate ${isActive ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full opacity-80"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Team Stats */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="rounded-2xl p-5 border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-50 shadow-sm"
               style={{ 
                 background: `linear-gradient(135deg, ${teamData?.color}08 0%, ${teamData?.color}03 50%, transparent 100%)` 
               }}>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2 text-lg">📊</span>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Members:</span>
                <span className="font-bold text-gray-900 px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  {teamData?.members || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Points:</span>
                <span className="font-bold text-white px-3 py-2 rounded-xl shadow-lg"
                      style={{ backgroundColor: teamData?.color }}>
                  {teamData?.points || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Captain:</span>
                <span className="font-medium text-xs bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-200 max-w-24 truncate">
                  {teamData?.captain || 'TBA'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Stats */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-100">
          <div className="space-y-3">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-xl">
              <span className="text-lg font-bold text-gray-900">{teamData?.members || 0}</span>
              <span className="text-xs text-gray-500">👥</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl text-white shadow-md"
                 style={{ backgroundColor: teamData?.color }}>
              <span className="text-lg font-bold">{teamData?.points || 0}</span>
              <span className="text-xs opacity-90">🏆</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
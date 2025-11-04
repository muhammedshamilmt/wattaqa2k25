'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  url: string;
  icon: string;
  description: string;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

interface HydrationSafeNavigationProps {
  teamCode: string;
  pathname: string;
  isCollapsed: boolean;
  isHoverExpanded: boolean;
}

export function HydrationSafeNavigation({ 
  teamCode, 
  pathname, 
  isCollapsed, 
  isHoverExpanded 
}: HydrationSafeNavigationProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTeamCode, setCurrentTeamCode] = useState('');

  useEffect(() => {
    setIsHydrated(true);
    
    // Get team code from URL after hydration
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTeamCode = urlParams.get('team');
      setCurrentTeamCode(urlTeamCode || teamCode || '');
    }
  }, [teamCode]);

  // Don't render navigation links until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div className="space-y-6">
        {/* Placeholder navigation structure */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            Overview
          </div>
          <div className="space-y-1">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            Team Management
          </div>
          <div className="space-y-1">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            Performance
          </div>
          <div className="space-y-1">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const safeTeamCode = currentTeamCode && currentTeamCode !== 'Loading...' ? currentTeamCode : '';

  const navigationSections: NavigationSection[] = [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: `/team-admin${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "📊",
          description: "Team overview & stats"
        },
        {
          title: "Team Details",
          url: `/team-admin/details${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "🏆",
          description: "Team information"
        },
      ],
    },
    {
      label: "Team Management",
      items: [
        {
          title: "Candidates",
          url: `/team-admin/candidates${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "👥",
          description: "Manage team members"
        },
        {
          title: "Programmes",
          url: `/team-admin/programmes${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "🎯",
          description: "Programme participation"
        },
      ],
    },
    {
      label: "Performance",
      items: [
        {
          title: "Results",
          url: `/team-admin/results${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "🏅",
          description: "Competition results"
        },
        {
          title: "Rankings",
          url: `/team-admin/rankings${safeTeamCode ? `?team=${safeTeamCode}` : ''}`,
          icon: "📈",
          description: "Team rankings"
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {navigationSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">
            {section.label}
          </div>
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => {
              const isActive = pathname === item.url.split('?')[0];
              
              return (
                <Link
                  key={itemIndex}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  
                  {(!isCollapsed || isHoverExpanded) && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.description}
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </>
                  )}
                  
                  {isCollapsed && !isHoverExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
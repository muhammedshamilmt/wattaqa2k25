"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Team } from '@/types';
import { HydrationSafeNavigation } from './HydrationSafeNavigation';

interface TeamSidebarProps {
  selectedTeam: string;
  teamData?: Team;
  onSwitchTeam: () => void;
}

// Team Admin Navigation Data with modern icons
const getTeamNavData = (teamCode: string) => {
  // Use the passed teamCode directly to avoid hydration issues
  // Don't access window during SSR to prevent hydration mismatch
  const safeTeamCode = teamCode && teamCode !== 'Loading...' ? teamCode : '';
  
  return [
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
};

export function TeamSidebarModern({ selectedTeam, teamData, onSwitchTeam }: TeamSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentTeamCode, setCurrentTeamCode] = useState(selectedTeam);

  // Handle hydration and team code updates
  useEffect(() => {
    setIsHydrated(true);
    
    // Update team code from URL parameters after hydration
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTeamCode = urlParams.get('team');
      if (urlTeamCode && urlTeamCode !== currentTeamCode) {
        setCurrentTeamCode(urlTeamCode);
      } else if (selectedTeam && selectedTeam !== 'Loading...' && selectedTeam !== currentTeamCode) {
        setCurrentTeamCode(selectedTeam);
      }
    }
  }, [selectedTeam, currentTeamCode]);

  // Use current team code for navigation, but only after hydration
  const teamNavData = getTeamNavData(isHydrated ? currentTeamCode : selectedTeam);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Handle hover events for collapsed sidebar
  const handleMouseEnter = () => {
    if (!isMobile && isCollapsed) {
      setIsHoverExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && isCollapsed) {
      setIsHoverExpanded(false);
    }
  };

  // Get contrast color for team color
  const getContrastColor = (hexColor: string) => {
    if (!hexColor) return '#FFFFFF';
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  // Get team color with opacity
  const getTeamColorWithOpacity = (opacity: number) => {
    if (!teamData?.color) return `rgba(99, 102, 241, ${opacity})`;
    const hex = teamData.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-2xl lg:hidden"
           style={{ 
             borderTopColor: getTeamColorWithOpacity(0.2),
             background: `linear-gradient(to top, ${getTeamColorWithOpacity(0.05)}, white)`
           }}>
        <div className="flex justify-around items-center py-3 px-2">
          {teamNavData.flatMap(section => section.items).slice(0, 5).map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-0 flex-1 mx-1",
                  isActive
                    ? "text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900"
                )}
                style={isActive ? { 
                  backgroundColor: teamData?.color || '#6366f1',
                  color: getContrastColor(teamData?.color || '#6366f1'),
                  boxShadow: `0 8px 25px ${getTeamColorWithOpacity(0.4)}`
                } : {
                  backgroundColor: isActive ? undefined : getTeamColorWithOpacity(0.05)
                }}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.title.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "bg-white font-poppins transition-all duration-300 ease-in-out shadow-xl border-r hidden lg:flex flex-col",
        "sticky top-0 h-screen",
        isCollapsed && !isHoverExpanded ? "w-20" : "w-80"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: `linear-gradient(135deg, ${getTeamColorWithOpacity(0.08)} 0%, ${getTeamColorWithOpacity(0.02)} 50%, white 100%)`,
        borderRightColor: getTeamColorWithOpacity(0.15),
        borderRightWidth: '2px'
      }}
    >
      {/* Header Section */}
      <div className="relative p-6 border-b"
           style={{ 
             borderBottomColor: getTeamColorWithOpacity(0.1),
             background: `linear-gradient(135deg, ${getTeamColorWithOpacity(0.12)} 0%, ${getTeamColorWithOpacity(0.04)} 100%)`
           }}>
        
        {/* Collapse Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-4 top-8 z-20 w-8 h-8 bg-white border-2 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          style={{ borderColor: getTeamColorWithOpacity(0.2) }}
        >
          <svg 
            className={cn(
              "w-4 h-4 transition-all duration-300 group-hover:scale-110",
              isCollapsed ? "rotate-180" : "rotate-0"
            )}
            style={{ color: teamData?.color || '#6366f1' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Team Header */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed && !isHoverExpanded ? "justify-center" : "space-x-4"
        )}>
          <div 
            className={cn(
              "rounded-2xl flex items-center justify-center text-white font-bold shadow-xl transition-all duration-300",
              isCollapsed && !isHoverExpanded ? "w-12 h-12" : "w-16 h-16"
            )}
            style={{ 
              backgroundColor: teamData?.color || '#6366f1',
              color: getContrastColor(teamData?.color || '#6366f1'),
              boxShadow: `0 10px 30px ${getTeamColorWithOpacity(0.3)}`
            }}
          >
            <span className={cn(
              "font-black transition-all duration-300",
              isCollapsed && !isHoverExpanded ? "text-lg" : "text-xl"
            )}>
              {selectedTeam}
            </span>
          </div>
          
          {(!isCollapsed || isHoverExpanded) && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-xl truncate mb-1">{teamData?.name}</h2>
              <p className="text-sm font-medium" style={{ color: teamData?.color || '#6366f1' }}>
                Team Admin Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-4">
        <HydrationSafeNavigation 
          teamCode={currentTeamCode}
          pathname={pathname}
          isCollapsed={isCollapsed}
          isHoverExpanded={isHoverExpanded}
        />
      </div>
      
      {/* Original navigation (commented out to prevent hydration issues) */}
      <div className="hidden">
        {teamNavData.map((section) => (
          <div key={section.label} className="mb-6">
            {/* Section Label */}
            {(!isCollapsed || isHoverExpanded) && (
              <div className="mb-3 px-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.label}
                </h3>
              </div>
            )}

            {/* Navigation Items */}
            <div className="space-y-2">
              {section.items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={cn(
                      "group flex items-center transition-all duration-300 rounded-2xl relative overflow-hidden",
                      isCollapsed && !isHoverExpanded ? "justify-center p-4" : "px-4 py-4",
                      isActive
                        ? "text-white shadow-xl transform scale-105"
                        : "text-gray-700 hover:text-gray-900 hover:shadow-lg hover:scale-102"
                    )}
                    style={isActive ? {
                      backgroundColor: teamData?.color || '#6366f1',
                      color: getContrastColor(teamData?.color || '#6366f1'),
                      boxShadow: `0 15px 35px ${getTeamColorWithOpacity(0.4)}`
                    } : {
                      backgroundColor: getTeamColorWithOpacity(0.03)
                    }}
                    title={isCollapsed && !isHoverExpanded ? item.title : undefined}
                  >
                    {/* Background Gradient for Active State */}
                    {isActive && (
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `linear-gradient(135deg, ${getTeamColorWithOpacity(0.3)} 0%, transparent 100%)`
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center transition-all duration-300 relative z-10",
                      isCollapsed && !isHoverExpanded ? "text-3xl" : "text-2xl mr-4"
                    )}>
                      {item.icon}
                    </div>

                    {/* Text Content */}
                    {(!isCollapsed || isHoverExpanded) && (
                      <div className="flex-1 min-w-0 relative z-10">
                        <div className="font-bold text-base truncate mb-1">
                          {item.title}
                        </div>
                        <div className={cn(
                          "text-xs truncate transition-colors duration-300",
                          isActive ? "text-white opacity-90" : "text-gray-500"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                      <div 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-12 rounded-full opacity-80"
                        style={{ backgroundColor: getContrastColor(teamData?.color || '#6366f1') }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Team Stats Footer */}
      <div className="border-t p-4"
           style={{ borderTopColor: getTeamColorWithOpacity(0.1) }}>
        {(!isCollapsed || isHoverExpanded) ? (
          <div className="rounded-2xl p-5 shadow-lg"
               style={{ 
                 background: `linear-gradient(135deg, ${getTeamColorWithOpacity(0.1)} 0%, ${getTeamColorWithOpacity(0.05)} 100%)`,
                 border: `1px solid ${getTeamColorWithOpacity(0.15)}`
               }}>
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2 text-lg">📊</span>
              Team Statistics
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Members:</span>
                <span className="font-bold text-gray-900 px-3 py-2 bg-white rounded-xl shadow-sm border text-sm"
                      style={{ borderColor: getTeamColorWithOpacity(0.2) }}>
                  {teamData?.members || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Grand Marks:</span>
                <span className="font-bold px-3 py-2 rounded-xl shadow-lg text-sm text-white"
                      style={{ backgroundColor: teamData?.color || '#6366f1' }}>
                  {teamData?.points || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Captain:</span>
                <span className="font-medium text-xs bg-white px-3 py-2 rounded-xl shadow-sm border max-w-24 truncate"
                      style={{ borderColor: getTeamColorWithOpacity(0.2) }}>
                  {teamData?.captain || 'TBA'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-md border"
                 style={{ borderColor: getTeamColorWithOpacity(0.2) }}>
              <span className="text-lg font-bold text-gray-900">{teamData?.members || 0}</span>
              <span className="text-xs text-gray-500">👥</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl shadow-lg text-white"
                 style={{ backgroundColor: teamData?.color || '#6366f1' }}>
              <span className="text-lg font-bold">{teamData?.points || 0}</span>
              <span className="text-xs opacity-90">🏆</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
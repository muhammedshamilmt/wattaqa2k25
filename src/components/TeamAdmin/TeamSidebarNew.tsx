"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Team } from '@/types';

interface TeamSidebarProps {
  selectedTeam: string;
  teamData?: Team;
  onSwitchTeam: () => void;
}

// Team Admin Navigation Data
const getTeamNavData = (teamCode: string) => [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: `/team-admin?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
          </svg>
        ),
      },
      {
        title: "Team Details",
        url: `/team-admin/details?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Team Management",
    items: [
      {
        title: "Candidates",
        url: `/team-admin/candidates?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
      },
      {
        title: "Programmes",
        url: `/team-admin/programmes?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Performance",
    items: [
      {
        title: "Results",
        url: `/team-admin/results?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
      },
      {
        title: "Rankings",
        url: `/team-admin/rankings?team=${teamCode}`,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
      },
    ],
  },
];

export function TeamSidebarNew({ selectedTeam, teamData, onSwitchTeam }: TeamSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);

  const teamNavData = getTeamNavData(selectedTeam);

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

  const toggleSidebar = () => setIsOpen(!isOpen);
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

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "overflow-hidden border-r border-gray-200 bg-white font-poppins transition-[width] duration-300 ease-in-out shadow-sm",
          isMobile ? "fixed bottom-0 top-0 z-50 max-w-[290px]" : "sticky top-0 h-screen",
          isMobile 
            ? (isOpen ? "w-full" : "w-0")
            : (isCollapsed && !isHoverExpanded ? "w-16" : "w-64"),
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundColor: teamData?.color ? `${teamData.color}05` : '#f9fafb'
        }}
        aria-label="Team navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-4 px-3">
          {/* Header with Team Logo and Collapse Button */}
          <div className="relative mb-4 flex items-center justify-between">
            {/* Team Logo/Info */}
            <div
              className={cn(
                "flex items-center transition-opacity duration-300",
                isCollapsed && !isHoverExpanded && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg mr-3"
                style={{ 
                  backgroundColor: teamData?.color || '#6366f1',
                  color: getContrastColor(teamData?.color || '#6366f1')
                }}
              >
                {selectedTeam}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-lg truncate">{teamData?.name}</h2>
                <p className="text-xs text-gray-500 font-medium">Team Portal</p>
              </div>
            </div>

            {/* Collapse/Expand Button for Desktop */}
            {!isMobile && (
              <button
                onClick={toggleCollapse}
                className={cn(
                  "p-2 rounded-lg transition-colors group relative",
                  isCollapsed ? "hover:bg-blue-50" : "hover:bg-gray-100"
                )}
                title={
                  isCollapsed 
                    ? "Expand Sidebar (Currently: Hover to expand)" 
                    : "Collapse Sidebar (Will enable hover to expand)"
                }
              >
                <svg 
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isCollapsed 
                      ? "text-blue-600 rotate-180" 
                      : "text-gray-600 rotate-0"
                  )}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                
                {/* Hover indicator dot */}
                {isCollapsed && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </button>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Close Menu</span>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-hidden">
            {teamNavData.map((section) => (
              <div key={section.label} className="mb-4">
                {/* Section Label */}
                <div className="mb-2 px-3 h-5 flex items-center">
                  <h2 
                    className={cn(
                      "text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300",
                      isCollapsed && !isHoverExpanded ? "opacity-0" : "opacity-100"
                    )}
                  >
                    {section.label}
                  </h2>
                </div>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.url;
                      return (
                        <li key={item.title}>
                          <Link
                            href={item.url}
                            className={cn(
                              "flex items-center py-2 px-3 transition-all duration-300 rounded-lg",
                              isActive
                                ? "text-white shadow-lg"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            )}
                            style={isActive ? {
                              backgroundColor: teamData?.color || '#6366f1',
                              color: getContrastColor(teamData?.color || '#6366f1')
                            } : {}}
                            title={isCollapsed && !isHoverExpanded ? item.title : undefined}
                          >
                            {/* Icon Container */}
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <item.icon className="size-5" aria-hidden="true" />
                            </div>

                            {/* Text Container */}
                            <div 
                              className={cn(
                                "ml-3 transition-all duration-300 overflow-hidden",
                                isCollapsed && !isHoverExpanded 
                                  ? "opacity-0 w-0 ml-0" 
                                  : "opacity-100 w-auto"
                              )}
                            >
                              <span className="whitespace-nowrap font-medium">
                                {item.title}
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
            ))}
          </div>

          {/* Team Stats - Bottom Section */}
          <div className={cn(
            "border-t border-gray-200 pt-4 transition-all duration-300",
            isCollapsed && !isHoverExpanded ? "px-1" : "px-0"
          )}>
            {(!isCollapsed || isHoverExpanded) && !isMobile ? (
              <div className="rounded-lg p-4 border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 shadow-sm"
                   style={{ 
                     background: `linear-gradient(135deg, ${teamData?.color}08 0%, ${teamData?.color}03 50%, transparent 100%)` 
                   }}>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Members:</span>
                    <span className="font-bold text-gray-900 px-2 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm">
                      {teamData?.members || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Grand Marks:</span>
                    <span className="font-bold px-2 py-1 rounded-lg shadow-lg text-sm"
                          style={{ 
                            backgroundColor: teamData?.color || '#6366f1',
                            color: getContrastColor(teamData?.color || '#6366f1')
                          }}>
                      {teamData?.points || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Captain:</span>
                    <span className="font-medium text-xs bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200 max-w-20 truncate">
                      {teamData?.captain || 'TBA'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-bold text-gray-900">{teamData?.members || 0}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg shadow-md"
                     style={{ 
                       backgroundColor: teamData?.color || '#6366f1',
                       color: getContrastColor(teamData?.color || '#6366f1')
                     }}>
                  <span className="text-sm font-bold">{teamData?.points || 0}</span>
                  <svg className="w-4 h-4 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl lg:hidden">
          <div className="flex justify-around items-center py-2 px-4">
            {teamNavData.flatMap(section => section.items).slice(0, 5).map((item) => {
              const isActive = pathname === item.url;
              return (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  style={isActive ? { 
                    backgroundColor: teamData?.color || '#6366f1',
                    color: getContrastColor(teamData?.color || '#6366f1'),
                    boxShadow: `0 4px 12px ${teamData?.color}40`
                  } : {}}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate w-full text-center">
                    {item.title.split(' ')[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
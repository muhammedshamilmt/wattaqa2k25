"use client";

import { SearchIcon } from "@/assets/icons";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { useGrandMarks } from "@/contexts/GrandMarksContext";

import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();
  const { grandMarks, isCalculationActive } = useGrandMarks();
  
  // Check if we're on a result management page
  const isResultPage = pathname?.startsWith('/admin/results');
  
  // Check if we're specifically on the checklist page
  const isChecklistPage = pathname === '/admin/results/checklist';
  
  // Get contextual navigation based on current page
  const getContextualNav = (isMobile = false) => {
    if (!isResultPage) return null;
    
    const containerClass = isMobile 
      ? "flex flex-col space-y-2 w-full" 
      : "flex items-center justify-center space-x-2";
    
    const buttonClass = isMobile
      ? "inline-flex items-center justify-center px-4 py-2.5 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm w-full"
      : "inline-flex items-center justify-center px-4 py-2 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm whitespace-nowrap";
    
    if (pathname === '/admin/results') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results/checklist"
            className={`${buttonClass} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border border-blue-500/20 hover:border-purple-500/30`}
          >
            <span className="mr-2">📋</span>
            <span>Review Checklist</span>
          </Link>
        </div>
      );
    }
    
    if (pathname === '/admin/results/checklist') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results"
            className={`${buttonClass} bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border border-gray-500/20 hover:border-gray-600/30`}
          >
            <span className="mr-2">←</span>
            <span>Back to Results</span>
          </Link>
        </div>
      );
    }
    
    if (pathname === '/admin/results/publish') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results"
            className={`${buttonClass} bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border border-gray-500/20 hover:border-gray-600/30`}
          >
            <span className="mr-2">←</span>
            <span>Back to Results</span>
          </Link>
          <Link
            href="/admin/results/checklist"
            className={`${buttonClass} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border border-blue-500/20 hover:border-purple-500/30`}
          >
            <span className="mr-2">📋</span>
            <span>Review Checklist</span>
          </Link>
        </div>
      );
    }
    
    return null;
  };

  return (
    <header
      className="sticky top-0 z-30 bg-white border-b border-gray-200 font-poppins shadow-sm"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Mobile Menu & Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transition-all duration-200"
          >
            <MenuIcon />
            <span className="sr-only">Toggle Sidebar</span>
          </button>

          {/* Festival Logo & Title */}
          <div className="flex items-center space-x-3">
            <Image
              src="/images/festival-logo.png"
              alt="Festival 2K25"
              width={40}
              height={40}
              className="rounded-full shadow-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">
                WATTAQA 2K25
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 ml-2">
                </span>
              </h1>
              <p className="text-sm text-gray-600">Arts & Sports Management</p>
            </div>
          </div>
        </div>

        {/* Center Section - Search or Grand Marks Preview */}
        <div className="hidden md:flex flex-1 mx-4 justify-center items-center">
          {isChecklistPage && isCalculationActive && grandMarks.length > 0 ? (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4">
                  {grandMarks.slice(0, 3).map((team, index) => (
                    <div key={team.teamCode} className="flex items-center space-x-2 bg-white bg-opacity-50 rounded-lg px-2 py-1">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: team.color || '#6366f1' }}
                      >
                        {index + 1}
                      </div>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs p-1"
                        style={{ backgroundColor: team.color || '#6366f1' }}
                      >
                        {team.teamCode}
                      </div>
                      <span 
                        className="text-xs text-white px-2 py-1 rounded-full font-bold"
                        style={{ backgroundColor: team.color || '#6366f1' }}
                      >
                        {Math.round(team.points)}
                      </span>
                    </div>
                  ))}
                  {grandMarks.length > 3 && (
                    <span className="text-xs text-gray-600">+{grandMarks.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
          ) : !isResultPage ? (
            <div className="relative w-full max-w-md">
              <input
                type="search"
                placeholder="Search teams, candidates, results..."
                className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          ) : null}
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Team Status Indicators */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full border-2 border-white shadow-sm"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-rose-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">3 Teams Active</span>
          </div>

          {/* Contextual Navigation Buttons */}
          {isResultPage && (
            <div className="hidden md:flex items-center">
              {getContextualNav(false)}
            </div>
          )}

          <Notification />
          <UserInfo />
        </div>
      </div>

      {/* Mobile Navigation/Search Bar */}
      <div className="md:hidden px-6 pb-4">
        {isResultPage ? (
          getContextualNav(true)
        ) : (
          <div className="relative">
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  );
}

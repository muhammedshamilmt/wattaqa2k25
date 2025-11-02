"use client";

import { SearchIcon } from "@/assets/icons";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();
  
  // Check if we're on a result management page
  const isResultPage = pathname?.startsWith('/admin/results');
  
  // Get contextual navigation based on current page
  const getContextualNav = (isMobile = false) => {
    if (!isResultPage) return null;
    
    const containerClass = isMobile ? "flex flex-col space-y-2" : "flex items-center space-x-3";
    const buttonClass = "inline-flex items-center justify-center px-4 py-2 text-white rounded-lg transition-all duration-200 shadow-sm font-medium text-sm";
    
    if (pathname === '/admin/results') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results/checklist"
            className={`${buttonClass} bg-orange-600 hover:bg-orange-700`}
          >
            <span className="mr-2">📋</span>
            Review Checklist
          </Link>
          <Link
            href="/admin/results/publish"
            className={`${buttonClass} bg-blue-600 hover:bg-blue-700`}
          >
            <span className="mr-2">🚀</span>
            Publish Results
          </Link>
        </div>
      );
    }
    
    if (pathname === '/admin/results/checklist') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results"
            className={`${buttonClass} bg-gray-600 hover:bg-gray-700`}
          >
            <span className="mr-2">←</span>
            Back to Results
          </Link>
          <Link
            href="/admin/results/publish"
            className={`${buttonClass} bg-blue-600 hover:bg-blue-700`}
          >
            <span className="mr-2">🚀</span>
            Publish Results
          </Link>
        </div>
      );
    }
    
    if (pathname === '/admin/results/publish') {
      return (
        <div className={containerClass}>
          <Link
            href="/admin/results"
            className={`${buttonClass} bg-gray-600 hover:bg-gray-700`}
          >
            <span className="mr-2">←</span>
            Back to Results
          </Link>
          <Link
            href="/admin/results/checklist"
            className={`${buttonClass} bg-orange-600 hover:bg-orange-700`}
          >
            <span className="mr-2">📋</span>
            Review Checklist
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

        {/* Center Section - Contextual Navigation or Search */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8 justify-center">
          {isResultPage ? (
            getContextualNav(false)
          ) : (
            <div className="relative w-full max-w-md">
              <input
                type="search"
                placeholder="Search teams, candidates, results..."
                className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Team Status Indicators */}
          <div className="hidden lg:flex items-center space-x-2 mr-4">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full border-2 border-white shadow-sm"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-rose-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <span className="text-sm text-gray-600 font-medium">3 Teams Active</span>
          </div>



          <ThemeToggleSwitch />
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

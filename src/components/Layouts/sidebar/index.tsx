"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar, isCollapsed, toggleCollapse, isHoverExpanded, setIsHoverExpanded } = useSidebarContext();

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
          backgroundSize: '40px 40px'
        }}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-4 px-3">
          {/* Header with Logo and Collapse Button */}
          <div className="relative mb-4 flex items-center justify-between">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn(
                "block transition-opacity duration-300",
                isCollapsed && !isHoverExpanded && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              <Logo />
            </Link>

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

            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="size-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-hidden">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-4">
                {/* Section Label - Consistent spacing, hidden when collapsed */}
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
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <MenuItem
                          className="flex items-center py-2 px-3 transition-all duration-300"
                          as="link"
                          href={item.url}
                          isActive={pathname === item.url}
                          title={isCollapsed && !isHoverExpanded ? item.title : undefined}
                        >
                          {/* Icon Container - Fixed width to maintain consistent positioning */}
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <item.icon
                              className="size-5"
                              aria-hidden="true"
                            />
                          </div>

                          {/* Text Container - Fixed positioning */}
                          <div 
                            className={cn(
                              "ml-3 transition-all duration-300 overflow-hidden",
                              isCollapsed && !isHoverExpanded 
                                ? "opacity-0 w-0 ml-0" 
                                : "opacity-100 w-auto"
                            )}
                          >
                            <span className="whitespace-nowrap">
                              {item.title}
                            </span>
                          </div>
                        </MenuItem>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

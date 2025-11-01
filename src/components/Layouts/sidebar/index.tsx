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
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();

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
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white font-poppins transition-[width] duration-200 ease-linear shadow-sm",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-4 pl-6 pr-4">
          <div className="relative pr-4 mb-4">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="block px-0 py-2"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black transition-colors"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="size-5 text-white" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-hidden pr-2">
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-4">
                <h2 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <MenuItem
                          className="flex items-center gap-3 py-2"
                          as="link"
                          href={item.url}
                          isActive={pathname === item.url}
                        >
                          <item.icon
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />

                          <span>{item.title}</span>
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

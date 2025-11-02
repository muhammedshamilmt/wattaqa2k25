"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isHoverExpanded: boolean;
  setIsHoverExpanded: (expanded: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
      setIsCollapsed(false); // Reset collapse state on mobile
      setIsHoverExpanded(false); // Reset hover state on mobile
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  function toggleSidebar() {
    setIsOpen((prev) => !prev);
  }

  function toggleCollapse() {
    if (!isMobile) {
      setIsCollapsed((prev) => !prev);
      setIsHoverExpanded(false); // Reset hover state when toggling
    }
  }

  return (
    <SidebarContext.Provider
      value={{
        state: isOpen ? (isCollapsed && !isHoverExpanded ? "collapsed" : "expanded") : "collapsed",
        isOpen,
        setIsOpen,
        isMobile,
        toggleSidebar,
        isCollapsed,
        toggleCollapse,
        isHoverExpanded,
        setIsHoverExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

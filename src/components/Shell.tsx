"use client";

import { useState, useEffect } from "react";
import { ShoppingListSidebar } from "./ShoppingListSidebar";
import { Navigation } from "./Navigation";
import { usePathname } from "next/navigation";

interface ShellProps {
  children: React.ReactNode;
}

// Pages where sidebar and navigation should be hidden
const MINIMAL_PAGES = ['/', '/login', '/welcome', '/superadmin', '/superadmin/login'];

export function Shell({ children }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if current page should have minimal UI (no sidebar/nav)
  const isMinimalPage = MINIMAL_PAGES.includes(pathname);

  // Check mobile and set initial state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showSidebarPadding = isSidebarOpen && !isMobile && !isMinimalPage;

  // Render minimal layout for landing/login pages
  if (isMinimalPage) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Render full layout with sidebar and navigation
  return (
    <div className="min-h-screen bg-background">
      <ShoppingListSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <main 
        className={`transition-all duration-300 min-h-screen pt-0 ${
          showSidebarPadding ? "ml-80 sm:ml-96" : ""
        }`}
      >
        {children}
      </main>
      
      <Navigation sidebarOpen={showSidebarPadding} />
    </div>
  );
}

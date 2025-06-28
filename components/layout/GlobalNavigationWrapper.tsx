'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Scan, BeakerIcon, PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function GlobalNavigationWrapper() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Persist minimize state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-minimized');
    if (savedState === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // Add/remove body class when mobile menu opens/closes
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('sheet-open');
    } else {
      document.body.classList.remove('sheet-open');
    }
    
    return () => {
      document.body.classList.remove('sheet-open');
    };
  }, [mobileOpen]);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('sidebar-minimized', newState.toString());
  };

  // Define paths where the main navigation should be hidden
  const noNavPaths = ['/login', '/signup', '/forgot-password'];

  // Don't render the main application sidebar on /circuitds or /handbook routes
  if (pathname?.startsWith('/circuitds') || pathname?.startsWith('/handbook') || noNavPaths.includes(pathname)) {
    return null;
  }

  // On mobile, render navigation in a Sheet
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button - hide when menu is open */}
        {!mobileOpen && (
          <button
            className="mobile-menu-button"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}

        {/* Mobile navigation sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="sheet-nav-content" onClose={() => setMobileOpen(false)}>
            <Navigation 
              mobileOpen={true} 
              isMinimized={false}
            />
          </SheetContent>
        </Sheet>
        
        {/* Close button - appears when menu is open */}
        {mobileOpen && (
          <button
            className="mobile-nav-close-button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} />
          </button>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      {/* Floating minimize toggle - appears to be part of top toolbar */}
      <button
        className="sidebar-floating-toggle"
        onClick={toggleMinimize}
        aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
        title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
      >
        {isMinimized ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <Navigation 
        mobileOpen={false} 
        isMinimized={isMinimized}
      />
    </>
  );
} 
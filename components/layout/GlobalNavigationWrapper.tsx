'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Scan, BeakerIcon, PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface GlobalNavigationWrapperProps {
  isMinimized?: boolean;
}

export default function GlobalNavigationWrapper({ isMinimized = true }: GlobalNavigationWrapperProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

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
    <Navigation 
      mobileOpen={false} 
      isMinimized={isMinimized}
    />
  );
} 
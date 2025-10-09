'use client';

import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/browser';
import Link from 'next/link';
import clsx from 'clsx';
import { Home, ScanLine, Layers, Beaker, BookOpen } from 'lucide-react';

const navigationConfig: NavigationConfigItem[] = [
  // This first set of links appears under the main title.
  { type: 'link', label: 'Collection', href: '/', icon: <Home size={20} /> },
  {
    type: 'group',
    heading: 'My Scans',
    children: [
      { type: 'link', label: 'Processing Scans', href: '/scans', icon: <Layers size={20} /> },
      { type: 'link', label: 'Scan History', href: '/scans/completed', icon: <Layers size={20} /> },
    ],
    defaultOpen: true,
  },


  // This creates a new group with a heading, providing visual separation.
  {
    type: 'group',
    heading: 'Ops',
    children: [
      { type: 'link', label: 'CircuitDS', href: '/circuitds', icon: <Beaker size={20} /> },
      { type: 'link', label: 'Handbook', href: '/handbook', icon: <BookOpen size={20} /> },
    ],
  },
];

export default function Navigation({ 
  mobileOpen = false, 
  isMinimized = false
}: { 
  mobileOpen?: boolean; 
  isMinimized?: boolean;
} = {}) {
  const router = useRouter();

  const handleLogout = async () => {
    const error = await signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className={clsx('circuit-sidebar', mobileOpen && 'sidebar--open', isMinimized && 'sidebar--minimized')}>
      <AppNavigation
        navTitle={<h2 className="sidebar-nav-title"><Link href="/">{isMinimized ? 'PA' : 'Project Arceus'}</Link></h2>}
        items={navigationConfig}
        isMinimized={isMinimized}
      />
      
      {/* Footer navigation - sticks to bottom with proper structure */}
      <div className="sidebar-nav-footer">
        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            <li className="sidebar-nav-item">
              <button
                className="sidebar-nav-link"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                {isMinimized ? '↗' : 'Logout'}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
} 
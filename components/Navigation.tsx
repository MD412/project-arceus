'use client';

import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/browser';
import Link from 'next/link';
import clsx from 'clsx';
import { Home, ScanLine, Layers, Beaker, BookOpen } from 'lucide-react';

// Original NavItem structure (can be removed or kept for reference if needed)
// interface NavItem {
//   label: string;
//   href: string;
// }

const navigationConfig: NavigationConfigItem[] = [
  // This first set of links appears under the main title.
  { type: 'link', label: 'Collection', href: '/', icon: <Home size={20} /> },
  { type: 'link', label: 'My Scans', href: '/scans', icon: <ScanLine size={20} /> },
  { type: 'link', label: 'Playground: Cards', href: '/playground-card-component', icon: <Layers size={20} /> },

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

// Transform to NavigationConfigItem[] if your AppNavigation expects the union type directly
// For this simple case, an array of NavLinkItem will also work if AppNavigation's items prop is typed as (NavLinkItem | NavGroupItem)[]
// const navigationConfig: NavigationConfigItem[] = appNavItems.map(item => ({ ...item, type: 'link' }));

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
        // Use default sidebar-nav classes for internal elements
      />
      
      {/* Logout button */}
      <button
        className="sidebar-nav-link sidebar-logout-button"
        onClick={handleLogout}
        aria-label="Logout"
        title="Logout"
        style={{ margin: '16px' }}
      >
        {isMinimized ? '↗' : 'Logout'}
      </button>
    </div>
  );
} 
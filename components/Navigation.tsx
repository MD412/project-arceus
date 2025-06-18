'use client';

import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/browser';
import Link from 'next/link';

// Original NavItem structure (can be removed or kept for reference if needed)
// interface NavItem {
//   label: string;
//   href: string;
// }

const navigationConfig: NavigationConfigItem[] = [
  // This first set of links appears under the main title.
  { type: 'link', label: 'Collection', href: '/' },
  { type: 'link', label: 'My Scans', href: '/scans' },

  // This creates a new group with a heading, providing visual separation.
  {
    type: 'group',
    heading: 'Ops',
    children: [
      { type: 'link', label: 'CircuitDS', href: '/circuitds' },
      { type: 'link', label: 'Handbook', href: '/handbook' },
    ],
  },
];

// Transform to NavigationConfigItem[] if your AppNavigation expects the union type directly
// For this simple case, an array of NavLinkItem will also work if AppNavigation's items prop is typed as (NavLinkItem | NavGroupItem)[]
// const navigationConfig: NavigationConfigItem[] = appNavItems.map(item => ({ ...item, type: 'link' }));

export default function Navigation() {
  const router = useRouter();

  const handleLogout = async () => {
    const error = await signOut();
    if (!error) {
      router.push('/login');
    }
  };

  return (
    <div className="circuit-sidebar">
      <AppNavigation
        navTitle={<h2 className="sidebar-nav-title"><Link href="/">Project Arceus</Link></h2>}
        items={navigationConfig}
        // Use default sidebar-nav classes for internal elements
      />
      <button
        className="sidebar-logout-button"
        onClick={handleLogout}
        aria-label="Logout"
      >
        Logout
      </button>
    </div>
  );
} 
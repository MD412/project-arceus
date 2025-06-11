'use client';

import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

// Original NavItem structure (can be removed or kept for reference if needed)
// interface NavItem {
//   label: string;
//   href: string;
// }

const navigationConfig: NavigationConfigItem[] = [
  // This first set of links appears under the main title.
  { type: 'link', label: 'Collection', href: '/' },
  { type: 'link', label: 'My Binders', href: '/binders' },

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
  return (
    <AppNavigation
      navTitle="Project Arceus"
      items={navigationConfig}
      baseNavClass="circuit-sidebar"
      // Rely on AppNavigation.css defaults for these:
      // headerClass="circuit-sidebar-header"
      // titleClass="subtitle"
      // navListClass="circuit-nav-list"
      // navItemClass="circuit-nav-item"
      // navLinkClass="circuit-nav-link"
      // navLinkActiveClass="circuit-nav-link-active"
    />
  );
} 
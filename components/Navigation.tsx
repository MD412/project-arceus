'use client';

import AppNavigation, { type NavigationConfigItem, type NavLinkItem } from '@/components/ui/AppNavigation';

// Original NavItem structure (can be removed or kept for reference if needed)
// interface NavItem {
//   label: string;
//   href: string;
// }

const appNavItems: NavLinkItem[] = [
  { type: 'link', label: 'Collection', href: '/' },
  { type: 'link', label: 'Add Card', href: '#' }, // Assuming this is a placeholder or future feature
  { type: 'link', label: 'CircuitDS', href: '/circuitds' }, // Added link to CircuitDS
];

// Transform to NavigationConfigItem[] if your AppNavigation expects the union type directly
// For this simple case, an array of NavLinkItem will also work if AppNavigation's items prop is typed as (NavLinkItem | NavGroupItem)[]
const navigationConfig: NavigationConfigItem[] = appNavItems.map(item => ({ ...item, type: 'link' }));

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
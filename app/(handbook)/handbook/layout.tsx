import React from 'react';
import AppNavigation, { NavigationConfigItem } from '@/components/ui/AppNavigation';
import Link from 'next/link';

const handbookNavItems: NavigationConfigItem[] = [
  {
    type: 'link',
    label: 'Back to Product',
    href: '/',
  },
  {
    type: 'link',
    label: 'Handbook Home',
    href: '/handbook',
  },
  {
    type: 'link',
    label: 'Changelog',
    href: '/handbook/changelog',
  },
  {
    type: 'link',
    label: 'Vision Pipeline PRD',
    href: '/handbook/vision-pipeline-prd',
  },
  {
    type: 'group',
    heading: 'Architectural Patterns',
    collapsible: true,
    defaultOpen: true,
    children: [
      { type: 'link', label: 'Optimistic CRUD Pipeline', href: '/handbook/patterns/optimistic-crud-pipeline' },
      { type: 'link', label: 'Worker Pipeline', href: '/handbook/worker-pipeline' },
      { type: 'link', label: 'Windows Terminal Patterns', href: '/handbook/patterns/windows-terminal' },
      // { type: 'link', label: 'Frontend Architecture', href: '/handbook/patterns/frontend-architecture' },
    ],
  },
];

export default function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="circuitds-layout-container">
      <div className="circuit-sidebar">
        <AppNavigation
          navTitle={<h2 className="sidebar-nav-title"><Link href="/handbook">Handbook</Link></h2>}
          items={handbookNavItems}
        />
      </div>
      <main className="circuitds-main-content">
        {children}
      </main>
    </div>
  );
} 
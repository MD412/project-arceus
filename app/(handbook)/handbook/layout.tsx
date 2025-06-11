import React from 'react';
import AppNavigation, { NavigationConfigItem } from '@/components/ui/AppNavigation';

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
    type: 'group',
    heading: 'Architecture',
    children: [
      { type: 'link', label: 'Frontend Architecture', href: '/handbook/frontend-architecture' },
    ],
  },
  {
    type: 'group',
    heading: 'AI Vision Pipeline',
    children: [
        { type: 'link', label: '3×3 Slice Strategy', href: '/handbook/vision-pipeline-3x3-slice' },
        { type: 'link', label: '🔥 Case Study', href: '/handbook/vision-pipeline-case-study' },
        { type: 'link', label: '🔧 Technical Snapshot', href: '/handbook/vision-pipeline-technical-snapshot' },
    ]
  },
  // Add more handbook sections here in the future
];

export default function HandbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="circuitds-layout-container">
      <AppNavigation
        navTitle="Handbook"
        items={handbookNavItems}
        baseNavClass="circuitds-sidebar" // Reusing the same class for consistent styling
        titleClass="circuitds-sidebar-title"
      />
      <main className="circuitds-main-content">
        {children}
      </main>
    </div>
  );
} 
import React from 'react';
// Removed Link import as AppNavigation handles it
// import Link from 'next/link'; 
import AppNavigation, { NavigationConfigItem } from '@/components/ui/AppNavigation';

// You might want to import global styles for the DS if they are not already in the root layout
// import '@/app/globals.css'; // Assuming circuit.css is imported here or in root layout
// import '@/app/styles/circuit.css';

// This is the layout for the /circuitds section of the site.
// It provides the secondary navigation specific to the CircuitDS pages.
// The main site navigation (if any) and overall page structure (html, body)
// are handled by the root layout.tsx.

// Define the navigation structure for CircuitDS using the new types
const circuitDSNavItems: NavigationConfigItem[] = [
  {
    type: 'link',
    label: 'Back to Product',
    href: '/',
  },
  {
    type: 'link',
    label: 'Overview',
    href: '/circuitds',
  },
  {
    type: 'link',
    label: 'AI Agent Onboarding',
    href: '/circuitds/agent-onboarding',
  },
  {
    type: 'group',
    heading: 'Foundations',
    children: [
      { type: 'link', label: 'Product Summary', href: '/circuitds/product-summary' },
      { type: 'link', label: 'Developer Guide', href: '/circuitds/developer-guide' },
      { type: 'link', label: 'Spacing', href: '/circuitds/spacing' },
      { type: 'link', label: 'Typography', href: '/circuitds/typography' },
      { type: 'link', label: 'Colors', href: '/circuitds/colors' },
      { type: 'link', label: 'Nesting Containers', href: '/circuitds/nesting-containers' },
      // Add Spacing, Colors etc. here as NavLinkItem
    ],
  },
  {
    type: 'group',
    heading: 'Components',
    children: [
      { type: 'link', label: 'Buttons', href: '/circuitds/buttons' },
      { type: 'link', label: 'Input', href: '/circuitds/forms/input' }, 
      { type: 'link', label: 'MenuSidebar', href: '/circuitds/menusidebar' },
      // Add Button, Card etc. here as NavLinkItem
    ],
  },
  {
    type: 'group',
    heading: 'AI Operations',
    children: [
      { type: 'link', label: 'Change Propagation', href: '/circuitds/ai-ops' },
      { type: 'link', label: '3x3 Slice Strategy', href: '/circuitds/vision-pipeline-3x3-slice' },
      { type: 'link', label: '🔥 Vision Pipeline Case Study', href: '/circuitds/vision-pipeline-case-study' },
      { type: 'link', label: '🔧 Technical Snapshot', href: '/circuitds/vision-pipeline-technical-snapshot' },
    ],
  },
  {
    type: 'group',
    heading: 'Development',
    children: [
      { type: 'link', label: 'Component Preview', href: '/circuitds/component-preview' },
      { type: 'link', label: 'Container Test', href: '/circuitds/container-test' },
    ],
  },
];

export default function CircuitDSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="circuitds-layout-container">
      <AppNavigation
        navTitle="CircuitDS"
        items={circuitDSNavItems}
        baseNavClass="circuitds-sidebar"
        titleClass="circuitds-sidebar-title"
      />
      <main className="circuitds-main-content">
        {children}
      </main>
    </div>
  );
} 
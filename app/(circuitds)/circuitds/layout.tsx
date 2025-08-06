"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';
import clsx from 'clsx';
import Link from 'next/link';

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
    collapsible: true,
    defaultOpen: true,
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
    collapsible: true,
    defaultOpen: true,
    children: [
      { type: 'link', label: 'Buttons', href: '/circuitds/buttons' },
      { type: 'link', label: 'Icon Button', href: '/circuitds/components/icon-button' },
      { type: 'link', label: 'Tag', href: '/circuitds/components/tag' },
      { type: 'link', label: 'Dropdown', href: '/circuitds/components/dropdown' },
      { type: 'link', label: 'Accordion', href: '/circuitds/components/accordion' },
      { type: 'link', label: 'Input', href: '/circuitds/forms/input' }, 
      { type: 'link', label: 'Dropzone', href: '/circuitds/components/dropzone' },
      { type: 'link', label: 'Card Search Input', href: '/circuitds/components/card-search-input' },
      { type: 'link', label: 'Review UI', href: '/circuitds/review-ui' },
      { type: 'link', label: 'Processing Queue Card', href: '/circuitds/components/processing-queue-card' },
      { type: 'link', label: 'Scan History Table', href: '/circuitds/components/scan-history-table' },
      { type: 'link', label: 'Card Detail Layout', href: '/circuitds/components/card-detail-layout' },
      { type: 'link', label: 'Approve Scan Button', href: '/circuitds/components/approve-scan-button' },
      { type: 'link', label: 'Scan Review Layout', href: '/circuitds/components/scan-review-layout' },
      // Add Button, Card etc. here as NavLinkItem
    ],
  },
  {
    type: 'group',
    heading: 'Interactions',
    collapsible: true,
    defaultOpen: false,
    children: [
      { type: 'link', label: 'Drag & Drop', href: '/circuitds/drag-and-drop' },
    ],
  },
  {
    type: 'group',
    heading: 'Navigation Patterns',
    collapsible: true,
    defaultOpen: false,
    children: [
      { type: 'link', label: 'Sidebar Navigation', href: '/circuitds/menusidebar' },
      { type: 'link', label: 'Horizontal Navigation', href: '/circuitds/navigation-menu' },
      { type: 'link', label: 'Action Toolbar', href: '/circuitds/action-toolbar' },
    ],
  },
  {
    type: 'group',
    heading: 'AI Operations',
    collapsible: true,
    defaultOpen: false,
    children: [
      { type: 'link', label: 'Change Propagation', href: '/circuitds/ai-ops' },
    ],
  },
  {
    type: 'group',
    heading: 'Experience',
    collapsible: true,
    defaultOpen: false,
    children: [
      { type: 'link', label: 'Mobile Experience', href: '/circuitds/mobile-experience' },
    ],
  },
  {
    type: 'group',
    heading: 'Development',
    collapsible: true,
    defaultOpen: false,
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="circuitds-layout-container">
      <div className="circuit-sidebar">
        <AppNavigation 
          navTitle={<h2 className="sidebar-nav-title"><Link href="/circuitds">CircuitDS</Link></h2>}
          items={circuitDSNavItems}
        />
      </div>
      <main className="circuitds-main-content">
        {children}
      </main>
    </div>
  );
} 
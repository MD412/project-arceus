'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

// Example navigation items for the MenuSidebar
const basicNavItems: NavigationConfigItem[] = [
  { type: 'link', label: 'Overview', href: '#overview' },
  { type: 'link', label: 'Analytics', href: '#analytics' },
  { type: 'link', label: 'Settings', href: '#settings' },
];

const groupedNavItems: NavigationConfigItem[] = [
  { type: 'link', label: 'Dashboard', href: '#dashboard' },
  {
    type: 'group',
    heading: 'Management',
    children: [
      { type: 'link', label: 'Users', href: '#users' },
      { type: 'link', label: 'Products', href: '#products' },
      { type: 'link', label: 'Orders', href: '#orders' },
    ],
  },
  { type: 'link', label: 'Profile', href: '#profile' },
];

export default function MenuSidebarPage() {
  return (
    <PageLayout
      title="MenuSidebar / Navigation"
      description="The MenuSidebar provides consistent and accessible ways to move through the application. It's typically used as the primary means of navigation, offering a clean, vertical layout with clear visual hierarchy and interactive states. It is implemented using the AppNavigation component."
    >
      <ContentSection title="Overview & Default Appearance">
        <p>The main sidebar navigation provides the primary means of navigation through the application. It uses a clean, vertical layout with clear visual hierarchy and interactive states. The <code>AppNavigation</code> component is used to create these sidebars.</p>
        <ExampleShowcase
          title="Basic Sidebar Structure"
          headingLevel={3}
          description="A simple sidebar with a title and a list of links. This is achieved by providing a 'navTitle' and a flat array of 'link' items to the AppNavigation component."
          preview={
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--sds-size-radius-200)', overflow: 'hidden' }}>
              <AppNavigation 
                navTitle="Main Menu"
                items={basicNavItems} 
                baseNavClass="circuitds-example-sidebar" // Custom class for styling example
              />
            </div>
          }
          code={`import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

const basicNavItems: NavigationConfigItem[] = [
  { type: 'link', label: 'Overview', href: '#overview' },
  { type: 'link', label: 'Analytics', href: '#analytics' },
  { type: 'link', label: 'Settings', href: '#settings' },
];

<AppNavigation 
  navTitle="Main Menu"
  items={basicNavItems} 
/>`}
        />
        <ExampleShowcase
          title="Sidebar with Grouped Items"
          headingLevel={3}
          description="A sidebar with section headings and grouped navigation links. This uses 'group' items within the configuration."
          preview={
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--sds-size-radius-200)', overflow: 'hidden' }}>
              <AppNavigation 
                navTitle="Product Sections"
                items={groupedNavItems} 
                baseNavClass="circuitds-example-sidebar" 
              />
            </div>
          }
          code={`import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

const groupedNavItems: NavigationConfigItem[] = [
  { type: 'link', label: 'Dashboard', href: '#dashboard' },
  {
    type: 'group',
    heading: 'Management',
    children: [
      { type: 'link', label: 'Users', href: '#users' },
      { type: 'link', label: 'Products', href: '#products' },
      { type: 'link', label: 'Orders', href: '#orders' },
    ],
  },
  { type: 'link', label: 'Profile', href: '#profile' },
];

<AppNavigation 
  navTitle="Product Sections"
  items={groupedNavItems}
/>`}
        />
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <p>To use the <code>AppNavigation</code> component as a MenuSidebar:</p>
        <ul>
          <li>Import <code>AppNavigation</code> and the <code>NavigationConfigItem</code> type from <code>'@/components/ui/AppNavigation'</code>.</li>
          <li>Define an array of <code>NavigationConfigItem</code> objects for your menu structure.</li>
          <li>Pass the items and an optional <code>navTitle</code> to the <code>AppNavigation</code> component.</li>
          <li>You can customize the appearance using the various <code>*Class</code> props (e.g., <code>baseNavClass</code>, <code>navLinkClass</code>, <code>navLinkActiveClass</code>) to apply specific styles for your sidebar. The default classes provide a standard sidebar look.</li>
        </ul>
        <p>The component handles ARIA attributes for accessibility, including <code>aria-current="page"</code> for active links based on the current route.</p>
      </ContentSection>

      <ContentSection title="Customization">
        <p>The <code>AppNavigation</code> component accepts several props for CSS class customization, allowing you to tailor its appearance. For example, <code>baseNavClass</code> can be used to apply a wrapper class to the entire navigation structure for targeted styling, as seen in the examples above (<code>circuitds-example-sidebar</code>).</p>
        <p>Refer to the <code>AppNavigationProps</code> in <code>components/ui/AppNavigation.tsx</code> for a full list of customizable class props.</p>
      </ContentSection>
      
      <ContentSection title="Accessibility">
        <p>The <code>AppNavigation</code> component is designed with accessibility in mind:</p>
        <ul>
          <li>Renders within a semantic <code>&lt;nav&gt;</code> element.</li>
          <li>Links are keyboard navigable and show focus states (browser default or via custom styling).</li>
          <li>Active link is indicated with <code>aria-current="page"</code>.</li>
          <li>Ensure your custom styling and color choices maintain WCAG AA contrast ratios.</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 
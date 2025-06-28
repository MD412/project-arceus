'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

// Example navbar with dropdowns
const NavbarWithDropdowns = () => {
  const productsItems: DropdownItem[] = [
    { label: 'Analytics', href: '/products/analytics' },
    { label: 'Dashboard', href: '/products/dashboard' },
    { label: 'Reports', href: '/products/reports' },
    { label: 'API', href: '/products/api' },
  ];

  const resourcesItems: DropdownItem[] = [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api-docs' },
    { label: 'Tutorials', href: '/tutorials' },
    { label: 'Community', href: '/community' },
  ];

  const userItems: DropdownItem[] = [
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
    { label: 'Billing', href: '/billing' },
    { label: 'Logout', href: '/logout' },
  ];

  const handleItemClick = (item: DropdownItem) => {
    console.log('Navigate to:', item.href);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--sds-size-space-600)',
      padding: 'var(--sds-size-space-400)',
      background: 'var(--surface-background)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--sds-size-radius-200)'
    }}>
      {/* Logo/Brand */}
      <div style={{ 
        fontWeight: 600, 
        color: 'var(--text-brand)',
        marginRight: 'var(--sds-size-space-400)' 
      }}>
        Brand
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-400)' }}>
        <a href="/home" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          Home
        </a>
        
        <Dropdown
          trigger={
            <span style={{ 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Products ↓
            </span>
          }
          items={productsItems}
          onItemClick={handleItemClick}
        />

        <Dropdown
          trigger={
            <span style={{ 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Resources ↓
            </span>
          }
          items={resourcesItems}
          onItemClick={handleItemClick}
        />

        <a href="/pricing" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
          Pricing
        </a>
      </div>

      {/* User Menu */}
      <div style={{ marginLeft: 'auto' }}>
        <Dropdown
          trigger={
            <span style={{ 
              color: 'var(--text-primary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              👤 User ↓
            </span>
          }
          items={userItems}
          align="right"
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
};

// Enhanced sidebar navigation with nested menus (concept)
const sidebarWithNestedMenus: NavigationConfigItem[] = [
  { type: 'link', label: 'Dashboard', href: '/dashboard' },
  { type: 'link', label: 'Analytics', href: '/analytics' },
  {
    type: 'group',
    heading: 'Products',
    children: [
      { type: 'link', label: 'All Products', href: '/products' },
      { type: 'link', label: 'Categories', href: '/products/categories' },
      { type: 'link', label: 'Inventory', href: '/products/inventory' },
      { type: 'link', label: 'Pricing', href: '/products/pricing' },
    ],
  },
  {
    type: 'group',
    heading: 'Customer Management',
    children: [
      { type: 'link', label: 'Customer List', href: '/customers' },
      { type: 'link', label: 'Segments', href: '/customers/segments' },
      { type: 'link', label: 'Support Tickets', href: '/customers/support' },
    ],
  },
  { type: 'link', label: 'Settings', href: '/settings' },
];

export default function NavigationMenuPage() {
  return (
    <PageLayout
      title="Navigation Menu"
      description="Navigation menus help users move through your application. They can include dropdowns for complex hierarchies and contextual actions."
    >
      <ContentSection title="Overview">
        <p>
          Navigation menus are critical for user experience, providing clear pathways through your application.
          They can be implemented as horizontal navbars, vertical sidebars, or contextual menus with dropdown functionality.
        </p>
      </ContentSection>

      <ContentSection title="Horizontal Navigation with Dropdowns">
        <p>
          Horizontal navigation bars are common for main application navigation. Dropdowns allow for hierarchical organization without cluttering the main navigation.
        </p>
        
        <ExampleShowcase
          title="Navbar with Dropdown Menus"
          description="A horizontal navigation bar that uses dropdowns to organize related navigation items."
          preview={<NavbarWithDropdowns />}
          code={`import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';

const NavbarWithDropdowns = () => {
  const productsItems: DropdownItem[] = [
    { label: 'Analytics', href: '/products/analytics' },
    { label: 'Dashboard', href: '/products/dashboard' },
    { label: 'Reports', href: '/products/reports' },
    { label: 'API', href: '/products/api' },
  ];

  const handleItemClick = (item: DropdownItem) => {
    console.log('Navigate to:', item.href);
  };

  return (
    <div className="navbar">
      <div className="brand">Brand</div>
      
      <div className="nav-links">
        <a href="/home">Home</a>
        
        <Dropdown
          trigger={<span>Products ↓</span>}
          items={productsItems}
          onItemClick={handleItemClick}
        />
        
        <a href="/pricing">Pricing</a>
      </div>
      
      <Dropdown
        trigger={<span>👤 User ↓</span>}
        items={userItems}
        align="right"
        onItemClick={handleItemClick}
      />
    </div>
  );
};`}
        />
      </ContentSection>

      <ContentSection title="Sidebar Navigation">
        <p>
          For complex applications, sidebar navigation provides more space and can handle deeper hierarchies.
          The AppNavigation component handles this pattern well with grouped items.
        </p>
        
        <ExampleShowcase
          title="Sidebar with Grouped Navigation"
          description="A vertical sidebar navigation using the AppNavigation component with logical groupings."
          preview={
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--sds-size-radius-200)', overflow: 'hidden', maxWidth: '300px' }}>
              <AppNavigation 
                navTitle="Application Name"
                items={sidebarWithNestedMenus}
                baseNavClass="circuitds-example-sidebar"
              />
            </div>
          }
          code={`import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';

const sidebarNavigation: NavigationConfigItem[] = [
  { type: 'link', label: 'Dashboard', href: '/dashboard' },
  { type: 'link', label: 'Analytics', href: '/analytics' },
  {
    type: 'group',
    heading: 'Products',
    children: [
      { type: 'link', label: 'All Products', href: '/products' },
      { type: 'link', label: 'Categories', href: '/products/categories' },
      { type: 'link', label: 'Inventory', href: '/products/inventory' },
      { type: 'link', label: 'Pricing', href: '/products/pricing' },
    ],
  },
  // ... more groups
];

<AppNavigation 
  navTitle="Application Name"
  items={sidebarNavigation}
/>`}
        />
      </ContentSection>

      <ContentSection title="Navigation Patterns">
        <h3>When to Use Dropdowns vs. Sidebar Groups</h3>
        <ul>
          <li><strong>Horizontal Dropdowns:</strong> Best for 3-7 related items that don't need to be visible all the time</li>
          <li><strong>Sidebar Groups:</strong> Better for navigation that users need frequent access to</li>
          <li><strong>Contextual Menus:</strong> Use dropdowns for actions related to specific content or user account functions</li>
        </ul>

        <h3>Best Practices</h3>
        <ul>
          <li><strong>Consistent Placement:</strong> Keep navigation elements in predictable locations</li>
          <li><strong>Clear Hierarchy:</strong> Use visual cues to show relationships between items</li>
          <li><strong>Progressive Disclosure:</strong> Show only what users need, when they need it</li>
          <li><strong>Responsive Design:</strong> Consider how navigation adapts on smaller screens</li>
          <li><strong>Active States:</strong> Clearly indicate the current page or section</li>
        </ul>
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <p>
          Navigation menus should be built with accessibility and performance in mind:
        </p>
        <ul>
          <li><strong>Semantic HTML:</strong> Use proper nav, ul, and li elements</li>
          <li><strong>Keyboard Navigation:</strong> Ensure all menu items are keyboard accessible</li>
          <li><strong>Focus Management:</strong> Provide clear focus indicators and logical tab order</li>
          <li><strong>Screen Reader Support:</strong> Use ARIA attributes for complex menu structures</li>
          <li><strong>Performance:</strong> Consider lazy loading for large menu structures</li>
        </ul>
      </ContentSection>

      <ContentSection title="Related Components">
        <p>Navigation menus often work together with other components:</p>
        <ul>
          <li><strong>Dropdown:</strong> For hierarchical menu structures</li>
          <li><strong>Button:</strong> For action triggers within navigation</li>
          <li><strong>AppNavigation:</strong> For sidebar navigation patterns</li>
          <li><strong>Breadcrumbs:</strong> For showing navigation hierarchy</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 
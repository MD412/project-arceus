'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import AppNavigation, { type NavigationConfigItem } from '@/components/ui/AppNavigation';
import Link from 'next/link';

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
      description="The MenuSidebar provides consistent and accessible ways to move through the application. It's the primary navigation component with unified styling across desktop expanded, desktop minimized, and mobile states. All navigation elements use consistent 12px typography, 32px heights, and 8px spacing for a cohesive experience."
    >
      <ContentSection title="Overview & Design Principles">
        <p>The main sidebar navigation provides the primary means of navigation through the application. It uses a clean, vertical layout with clear visual hierarchy and interactive states. The <code>AppNavigation</code> component creates these sidebars with <strong>identical styling across all device types and sidebar states</strong>.</p>
        
        <h4>Unified Design System</h4>
        <p>Our sidebar navigation maintains consistent appearance whether displayed as:</p>
        <ul>
          <li><strong>Desktop Expanded</strong> - Full sidebar with text and icons</li>
          <li><strong>Desktop Minimized</strong> - Compact sidebar with icons only</li>
          <li><strong>Mobile Sheet</strong> - Full-screen navigation overlay</li>
        </ul>
        
        <h4>Typography & Spacing Standards</h4>
        <ul>
          <li><strong>Font Size:</strong> 12px (var(--font-size-75)) for all navigation elements</li>
          <li><strong>Button Height:</strong> 32px minimum for compact, modern appearance</li>
          <li><strong>Button Padding:</strong> 6px vertical, 12px horizontal</li>
          <li><strong>Item Gap:</strong> 8px between navigation buttons for breathing room</li>
          <li><strong>Icon Size:</strong> 20px for optimal visual balance</li>
        </ul>

        <ExampleShowcase
          title="Basic Sidebar Structure"
          headingLevel={3}
          description="A simple sidebar with a title and a list of links. Note the consistent 12px typography and 8px spacing between items."
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
          description="A sidebar with section headings and grouped navigation links. All text maintains the unified 12px font size."
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

      <ContentSection title="Responsive Behavior">
        <p>The sidebar navigation maintains consistent styling across all device types and states:</p>
        
        <h4>Desktop States</h4>
        <ul>
          <li><strong>Expanded:</strong> Full sidebar with 4px left-right padding for content breathing room</li>
          <li><strong>Minimized:</strong> Icons-only sidebar with centered content and no left-right padding</li>
          <li><strong>Both states:</strong> Identical 12px fonts, 32px heights, 8px gaps, 20px icons</li>
        </ul>
        
        <h4>Mobile Behavior</h4>
        <ul>
          <li><strong>Sheet Overlay:</strong> Full-screen navigation with same desktop styling</li>
          <li><strong>No Mobile-Specific Overrides:</strong> Mobile inherits exact desktop styles for consistency</li>
          <li><strong>Touch Targets:</strong> 32px height provides adequate touch target while maintaining compactness</li>
        </ul>
        
        <h4>Design Philosophy</h4>
        <p>We eliminated mobile-specific styling overrides to ensure <strong>pixel-perfect consistency</strong> across all devices. This reduces complexity and provides users with a familiar experience regardless of how they access the application.</p>
      </ContentSection>

      <ContentSection title="Implementation Notes">
        <p>To use the <code>AppNavigation</code> component as a MenuSidebar:</p>
        <ul>
          <li>Import <code>AppNavigation</code> and the <code>NavigationConfigItem</code> type from <code>'@/components/ui/AppNavigation'</code>.</li>
          <li>Define an array of <code>NavigationConfigItem</code> objects for your menu structure.</li>
          <li>Pass the items and an optional <code>navTitle</code> to the <code>AppNavigation</code> component.</li>
          <li>You can customize the appearance using the various <code>*Class</code> props (e.g., <code>baseNavClass</code>, <code>navLinkClass</code>, <code>navLinkActiveClass</code>) to apply specific styles for your sidebar. The default classes provide a standard sidebar look.</li>
          <li><strong>Styling Inheritance:</strong> All navigation elements automatically use the unified design system values - no manual font size or spacing adjustments needed.</li>
        </ul>
        <p>The component handles ARIA attributes for accessibility, including <code>aria-current="page"</code> for active links based on the current route.</p>
      </ContentSection>

      <ContentSection title="Layout Integration">
        <p>For consistent sidebar navigation across your application, follow these layout patterns:</p>
        
        <h4>Grid Layout Structure</h4>
        <p>Use CSS Grid for the parent container to create a two-column layout with the sidebar and main content:</p>
        <pre className="code-block">{`<div className="your-layout-container">
  <div className="circuit-sidebar">
    <AppNavigation 
      navTitle={<h2 className="sidebar-nav-title">
        <Link href="/your-section">Your Section</Link>
      </h2>}
      items={navItems}
    />
  </div>
  <main className="your-main-content">
    {children}
  </main>
</div>`}</pre>

        <h4>Required CSS</h4>
        <p>Your layout container should use this CSS pattern:</p>
        <pre className="code-block">{`.your-layout-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  height: 100vh;
}

.your-main-content {
  overflow-y: auto;
  padding: var(--sds-size-space-800);
}`}</pre>

        <h4>Sidebar State Management</h4>
        <p>The sidebar automatically handles expanded/minimized states:</p>
        <ul>
          <li><strong>Expanded:</strong> Grid column width remains 240px, content gets 4px left-right padding</li>
          <li><strong>Minimized:</strong> Grid column shrinks to ~60px, content centered with no padding</li>
          <li><strong>Smooth Transitions:</strong> CSS transitions handle the padding and layout changes</li>
        </ul>

        <h4>Important Notes</h4>
        <ul>
          <li>Always wrap <code>AppNavigation</code> in a <code>&lt;div className="circuit-sidebar"&gt;</code> to inherit the proper sidebar styling</li>
          <li>Use a consistent grid layout structure across all pages with sidebars</li>
          <li>The <code>circuit-sidebar</code> class provides scrollbar styling, responsive behavior, and proper spacing</li>
          <li>For clickable titles, pass a React element with the title wrapped in a link component</li>
          <li><strong>No Device-Specific CSS Required:</strong> The unified styling system handles all responsive behavior</li>
        </ul>
      </ContentSection>

      <ContentSection title="Customization">
        <p>The <code>AppNavigation</code> component accepts several props for CSS class customization, allowing you to tailor its appearance. For example, <code>baseNavClass</code> can be used to apply a wrapper class to the entire navigation structure for targeted styling, as seen in the examples above (<code>circuitds-example-sidebar</code>).</p>
        
        <h4>Design System Integration</h4>
        <p>The navigation automatically uses CircuitDS design tokens:</p>
        <ul>
          <li><code>var(--font-size-75)</code> - 12px typography</li>
          <li><code>var(--sds-size-space-200)</code> - 8px gap between items</li>
          <li><code>var(--sds-size-space-150)</code> - 6px vertical padding</li>
          <li><code>var(--sds-size-space-300)</code> - 12px horizontal padding</li>
        </ul>
        
        <p>Refer to the <code>AppNavigationProps</code> in <code>components/ui/AppNavigation.tsx</code> for a full list of customizable class props.</p>
      </ContentSection>
      
      <ContentSection title="Documentation Variants">
        <p>For documentation and design system contexts, the navigation can be adapted with different styling and content structure while maintaining the same unified design principles.</p>
        
        <ExampleShowcase
          title="Documentation Navigation"
          headingLevel={3}
          description="A navigation structure optimized for documentation with deeper hierarchy. Note how all text maintains the consistent 12px size across different nesting levels."
          preview={
            <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--sds-size-radius-200)', overflow: 'hidden' }}>
              <AppNavigation 
                navTitle="Design System"
                items={[
                  { type: 'link', label: 'Getting Started', href: '#getting-started' },
                  { type: 'link', label: 'Installation', href: '#installation' },
                  {
                    type: 'group',
                    heading: 'Foundations',
                    children: [
                      { type: 'link', label: 'Design Tokens', href: '#tokens' },
                      { type: 'link', label: 'Typography', href: '#typography' },
                      { type: 'link', label: 'Color System', href: '#colors' },
                      { type: 'link', label: 'Spacing Scale', href: '#spacing' },
                    ],
                  },
                  {
                    type: 'group',
                    heading: 'Components',
                    children: [
                      { type: 'link', label: 'Button', href: '#button' },
                      { type: 'link', label: 'Input Field', href: '#input' },
                      { type: 'link', label: 'Navigation', href: '#navigation' },
                      { type: 'link', label: 'Modal Dialog', href: '#modal' },
                    ],
                  },
                  {
                    type: 'group',
                    heading: 'Patterns',
                    children: [
                      { type: 'link', label: 'Form Layouts', href: '#forms' },
                      { type: 'link', label: 'Data Display', href: '#data' },
                      { type: 'link', label: 'Feedback', href: '#feedback' },
                    ],
                  },
                ]} 
                baseNavClass="circuitds-example-sidebar"
              />
            </div>
          }
          code={`// Documentation-focused navigation structure
const docsNavItems: NavigationConfigItem[] = [
  { type: 'link', label: 'Getting Started', href: '#getting-started' },
  { type: 'link', label: 'Installation', href: '#installation' },
  {
    type: 'group',
    heading: 'Foundations',
    children: [
      { type: 'link', label: 'Design Tokens', href: '#tokens' },
      { type: 'link', label: 'Typography', href: '#typography' },
      { type: 'link', label: 'Color System', href: '#colors' },
      { type: 'link', label: 'Spacing Scale', href: '#spacing' },
    ],
  },
  // ... more groups
];

<AppNavigation 
  navTitle="Design System"
  items={docsNavItems}
/>`}
        />
      </ContentSection>

      <ContentSection title="Accessibility">
        <p>The <code>AppNavigation</code> component is designed with accessibility in mind:</p>
        <ul>
          <li>Renders within a semantic <code>&lt;nav&gt;</code> element.</li>
          <li>Links are keyboard navigable and show focus states (browser default or via custom styling).</li>
          <li>Active link is indicated with <code>aria-current="page"</code>.</li>
          <li><strong>Consistent Touch Targets:</strong> 32px minimum height provides adequate touch area while maintaining modern compactness.</li>
          <li><strong>Unified Focus States:</strong> Same focus indicators across all device types for consistent user experience.</li>
          <li>Ensure your custom styling and color choices maintain WCAG AA contrast ratios.</li>
        </ul>
        
        <h4>Cross-Device Accessibility</h4>
        <p>By maintaining identical styling across devices, users with accessibility needs experience consistent:</p>
        <ul>
          <li>Touch target sizes (32px height)</li>
          <li>Font sizes (12px for readability)</li>
          <li>Spacing patterns (8px gaps, 12px padding)</li>
          <li>Focus indicator behavior</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 
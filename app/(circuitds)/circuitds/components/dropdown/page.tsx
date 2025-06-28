'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';

// Example dropdown items
const basicItems: DropdownItem[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help', href: '/help' },
  { label: 'Logout', href: '/logout' },
];

const iconItems: DropdownItem[] = [
  { label: 'Edit', href: '/edit', icon: '✏️' },
  { label: 'Copy', href: '/copy', icon: '📋' },
  { label: 'Share', href: '/share', icon: '🔗' },
  { label: 'Delete', href: '/delete', icon: '🗑️', disabled: true },
];

const contextMenuItems: DropdownItem[] = [
  { label: 'Open in New Tab', href: '/new-tab' },
  { label: 'Copy Link', href: '/copy' },
  { label: 'Save As...', href: '/save' },
  { label: 'Print', href: '/print' },
];

export default function DropdownPage() {
  const handleItemClick = (item: DropdownItem) => {
    console.log('Clicked:', item.label);
    // Handle navigation or action here
  };

  return (
    <PageLayout
      title="Dropdown"
      description="Dropdowns display a list of choices that can be selected by the user. They're commonly used for menus, action lists, and navigation."
    >
      <ContentSection title="Overview">
        <p>
          The Dropdown component provides a flexible way to display contextual actions or navigation options.
          It supports icons, disabled states, and proper keyboard navigation for accessibility.
        </p>
        
        <ExampleShowcase
          title="Basic Dropdown"
          description="A simple dropdown triggered by a button with basic menu items."
          preview={
            <Dropdown
              trigger={<Button variant="secondary">User Menu ↓</Button>}
              items={basicItems}
              onItemClick={handleItemClick}
            />
          }
          code={`import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';

const basicItems: DropdownItem[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help', href: '/help' },
  { label: 'Logout', href: '/logout' },
];

<Dropdown
  trigger={<Button variant="secondary">User Menu ↓</Button>}
  items={basicItems}
  onItemClick={handleItemClick}
/>`}
        />
      </ContentSection>

      <ContentSection title="Variants">
        <ExampleShowcase
          title="Dropdown with Icons"
          description="Dropdowns can include icons next to menu items for better visual recognition."
          preview={
            <Dropdown
              trigger={<Button variant="ghost">Actions ⚙️</Button>}
              items={iconItems}
              onItemClick={handleItemClick}
            />
          }
          code={`const iconItems: DropdownItem[] = [
  { label: 'Edit', href: '/edit', icon: '✏️' },
  { label: 'Copy', href: '/copy', icon: '📋' },
  { label: 'Share', href: '/share', icon: '🔗' },
  { label: 'Delete', href: '/delete', icon: '🗑️', disabled: true },
];

<Dropdown
  trigger={<Button variant="ghost">Actions ⚙️</Button>}
  items={iconItems}
  onItemClick={handleItemClick}
/>`}
        />

        <ExampleShowcase
          title="Right-Aligned Dropdown"
          description="Dropdowns can be aligned to the right edge of the trigger element."
          preview={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Dropdown
                trigger={<Button variant="primary">Context Menu</Button>}
                items={contextMenuItems}
                align="right"
                onItemClick={handleItemClick}
              />
            </div>
          }
          code={`<Dropdown
  trigger={<Button variant="primary">Context Menu</Button>}
  items={contextMenuItems}
  align="right"
  onItemClick={handleItemClick}
/>`}
        />

        <ExampleShowcase
          title="Text Trigger"
          description="Dropdowns can be triggered by any element, not just buttons."
          preview={
            <Dropdown
              trigger={
                <span style={{ 
                  color: 'var(--text-brand)', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                  More options ▼
                </span>
              }
              items={basicItems}
              onItemClick={handleItemClick}
            />
          }
          code={`<Dropdown
  trigger={
    <span style={{ 
      color: 'var(--text-brand)', 
      cursor: 'pointer',
      textDecoration: 'underline'
    }}>
      More options ▼
    </span>
  }
  items={basicItems}
  onItemClick={handleItemClick}
/>`}
        />
      </ContentSection>

      <ContentSection title="Props & API">
        <ExampleShowcase
          title="Component Props"
          description="Available props for customizing the Dropdown component."
          code={`interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;        // Element that triggers the dropdown
  items: DropdownItem[];           // Array of dropdown menu items
  className?: string;              // Additional CSS classes
  align?: 'left' | 'right';        // Alignment of dropdown menu
  onItemClick?: (item: DropdownItem) => void; // Callback for item clicks
}`}
        />
        
        <h3>Props Description</h3>
        <ul>
          <li><code>trigger</code>: The element that opens the dropdown when clicked</li>
          <li><code>items</code>: Array of objects defining each menu item</li>
          <li><code>align</code>: Controls which edge of the trigger the menu aligns to</li>
          <li><code>onItemClick</code>: Function called when a menu item is selected</li>
          <li><code>className</code>: Additional CSS classes for styling</li>
        </ul>
      </ContentSection>

      <ContentSection title="Accessibility">
        <p>
          The Dropdown component includes comprehensive accessibility features:
        </p>
        <ul>
          <li><strong>Keyboard Navigation:</strong> Arrow keys, Enter, and Escape work as expected</li>
          <li><strong>Focus Management:</strong> Proper focus indicators and tab order</li>
          <li><strong>Screen Reader Support:</strong> ARIA attributes for menu structure</li>
          <li><strong>Click Outside:</strong> Automatically closes when clicking outside</li>
          <li><strong>Disabled States:</strong> Properly marks disabled items for assistive technology</li>
        </ul>
      </ContentSection>

      <ContentSection title="Best Practices">
        <ul>
          <li><strong>Keep it short:</strong> Limit menu items to 7-10 options for usability</li>
          <li><strong>Logical grouping:</strong> Use separators or grouping for complex menus</li>
          <li><strong>Clear labels:</strong> Use descriptive, action-oriented labels</li>
          <li><strong>Consistent placement:</strong> Keep dropdown alignment consistent across your interface</li>
          <li><strong>Visual indicators:</strong> Include icons or arrows to indicate dropdown functionality</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 
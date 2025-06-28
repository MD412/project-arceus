'use client';

import React from 'react';
import ExampleShowcase from '../../../../../components/layout/ExampleShowcase';
import CodeBlock from '../CodeBlock';
import { Accordion, AccordionItem } from '../../../../../components/ui/Accordion';

export default function AccordionPage() {
  // Example data for basic accordion
  const basicItems: AccordionItem[] = [
    {
      id: 'section-1',
      title: 'Getting Started',
      content: (
        <div>
          <p>Learn the basics of setting up your development environment and creating your first component.</p>
          <ul style={{ marginTop: '8px', marginLeft: '16px' }}>
            <li>Installation requirements</li>
            <li>Project setup</li>
            <li>Basic component structure</li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-2',
      title: 'Advanced Features',
      content: (
        <div>
          <p>Explore advanced patterns and optimization techniques for better performance.</p>
          <ul style={{ marginTop: '8px', marginLeft: '16px' }}>
            <li>State management</li>
            <li>Performance optimization</li>
            <li>Advanced hooks</li>
          </ul>
        </div>
      )
    },
    {
      id: 'section-3',
      title: 'Deployment',
      content: (
        <div>
          <p>Deploy your application to production with confidence.</p>
          <ul style={{ marginTop: '8px', marginLeft: '16px' }}>
            <li>Build optimization</li>
            <li>Environment configuration</li>
            <li>Monitoring and analytics</li>
          </ul>
        </div>
      )
    }
  ];

  // FAQ accordion with single open section
  const faqItems: AccordionItem[] = [
    {
      id: 'faq-1',
      title: 'What is CircuitDS?',
      content: <p>CircuitDS is a comprehensive design system built for modern web applications, focusing on accessibility and developer experience.</p>
    },
    {
      id: 'faq-2', 
      title: 'How do I contribute?',
      content: (
        <div>
          <p>We welcome contributions! Here's how you can get involved:</p>
          <ol style={{ marginTop: '8px', marginLeft: '16px' }}>
            <li>Fork the repository</li>
            <li>Create a feature branch</li>
            <li>Make your changes</li>
            <li>Submit a pull request</li>
          </ol>
        </div>
      )
    },
    {
      id: 'faq-3',
      title: 'What about browser support?',
      content: <p>CircuitDS supports all modern browsers including Chrome, Firefox, Safari, and Edge. IE11 support is deprecated.</p>
    }
  ];

  // Settings accordion with multiple sections open
  const settingsItems: AccordionItem[] = [
    {
      id: 'general',
      title: 'General Settings',
      defaultOpen: true,
      content: (
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" style={{ marginRight: '8px' }} />
            Enable notifications
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" style={{ marginRight: '8px' }} defaultChecked />
            Auto-save changes
          </label>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      defaultOpen: true,
      content: (
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" style={{ marginRight: '8px' }} defaultChecked />
            Share analytics data
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <input type="checkbox" style={{ marginRight: '8px' }} />
            Public profile
          </label>
        </div>
      )
    },
    {
      id: 'advanced',
      title: 'Advanced Settings',
      content: (
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Developer mode
            <input type="checkbox" style={{ marginLeft: '8px' }} />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Debug logging
            <input type="checkbox" style={{ marginLeft: '8px' }} />
          </label>
        </div>
      )
    }
  ];

  // Disabled accordion example
  const disabledItems: AccordionItem[] = [
    {
      id: 'available',
      title: 'Available Section',
      content: <p>This section is available and can be expanded.</p>
    },
    {
      id: 'disabled',
      title: 'Disabled Section',
      disabled: true,
      content: <p>This content cannot be accessed.</p>
    },
    {
      id: 'premium',
      title: 'Premium Feature (Disabled)',
      disabled: true,
      content: <p>Upgrade to premium to access this feature.</p>
    }
  ];

  return (
    <div className="page-container">
      <div className="content-section">
        <h1>Accordion</h1>
        <p className="section-description">
          Collapsible content sections that help organize information into digestible chunks. 
          Perfect for FAQs, settings panels, and navigation groups.
        </p>
      </div>

      {/* Basic Example */}
      <ExampleShowcase
        title="Basic Accordion"
        description="Single-open accordion where only one section can be expanded at a time."
      >
        <Accordion items={basicItems} />
        
        <CodeBlock code={`import { Accordion, AccordionItem } from '@/components/ui/Accordion';

const items: AccordionItem[] = [
  {
    id: 'section-1',
    title: 'Getting Started',
    content: <div>Your content here...</div>
  },
  {
    id: 'section-2', 
    title: 'Advanced Features',
    content: <div>More content...</div>
  }
];

<Accordion items={items} />`} language="tsx" />
      </ExampleShowcase>

      {/* Multiple Open */}
      <ExampleShowcase
        title="Multiple Sections Open"
        description="Allow multiple sections to be expanded simultaneously."
      >
        <Accordion items={settingsItems} allowMultiple />
        
        <CodeBlock code={`<Accordion 
  items={settingsItems} 
  allowMultiple={true}
/>`} language="tsx" />
      </ExampleShowcase>

      {/* FAQ Style */}
      <ExampleShowcase
        title="FAQ Style"
        description="Clean, minimal styling perfect for frequently asked questions."
      >
        <Accordion items={faqItems} variant="minimal" />
        
        <CodeBlock code={`<Accordion 
  items={faqItems} 
  variant="minimal" 
/>`} language="tsx" />
      </ExampleShowcase>

      {/* Bordered Variant */}
      <ExampleShowcase
        title="Bordered Variant"
        description="Each section has a bottom border for visual separation."
      >
        <Accordion items={basicItems} variant="bordered" />
        
        <CodeBlock code={`<Accordion 
  items={basicItems} 
  variant="bordered" 
/>`} language="tsx" />
      </ExampleShowcase>

      {/* Disabled States */}
      <ExampleShowcase
        title="Disabled States"
        description="Some sections can be disabled to prevent interaction."
      >
        <Accordion items={disabledItems} />
        
        <CodeBlock code={`const items: AccordionItem[] = [
  {
    id: 'available',
    title: 'Available Section',
    content: <p>This section is available.</p>
  },
  {
    id: 'disabled',
    title: 'Disabled Section',
    disabled: true,
    content: <p>This content cannot be accessed.</p>
  }
];`} language="tsx" />
      </ExampleShowcase>

      {/* Props Documentation */}
      <div className="content-section">
        <h2>Props</h2>
        
        <h3>Accordion Props</h3>
        <div className="props-table">
          <table>
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>items</code></td>
                <td><code>AccordionItem[]</code></td>
                <td>-</td>
                <td>Array of accordion sections</td>
              </tr>
              <tr>
                <td><code>allowMultiple</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td>Allow multiple sections open at once</td>
              </tr>
              <tr>
                <td><code>variant</code></td>
                <td><code>'default' | 'bordered' | 'minimal'</code></td>
                <td><code>'default'</code></td>
                <td>Visual style variant</td>
              </tr>
              <tr>
                <td><code>className</code></td>
                <td><code>string</code></td>
                <td>-</td>
                <td>Additional CSS classes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>AccordionItem Interface</h3>
        <div className="props-table">
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>id</code></td>
                <td><code>string</code></td>
                <td>Yes</td>
                <td>Unique identifier for the section</td>
              </tr>
              <tr>
                <td><code>title</code></td>
                <td><code>string</code></td>
                <td>Yes</td>
                <td>Section header text</td>
              </tr>
              <tr>
                <td><code>content</code></td>
                <td><code>React.ReactNode</code></td>
                <td>Yes</td>
                <td>Section content</td>
              </tr>
              <tr>
                <td><code>defaultOpen</code></td>
                <td><code>boolean</code></td>
                <td>No</td>
                <td>Whether section starts expanded</td>
              </tr>
              <tr>
                <td><code>disabled</code></td>
                <td><code>boolean</code></td>
                <td>No</td>
                <td>Whether section is disabled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices */}
      <div className="content-section">
        <h2>Best Practices</h2>
        
        <h3>When to Use</h3>
        <ul>
          <li><strong>Content Organization:</strong> Break long content into digestible sections</li>  
          <li><strong>FAQs:</strong> Present frequently asked questions in an organized manner</li>
          <li><strong>Settings Panels:</strong> Group related configuration options</li>
          <li><strong>Navigation:</strong> Create collapsible navigation sections</li>
        </ul>

        <h3>Accessibility</h3>
        <ul>
          <li>Keyboard navigation with arrow keys and Enter/Space</li>
          <li>Proper ARIA attributes for screen readers</li>
          <li>Focus management and visual focus indicators</li>
          <li>Semantic HTML structure with buttons and regions</li>
        </ul>

        <h3>Design Guidelines</h3>
        <ul>
          <li>Use clear, descriptive section titles</li>
          <li>Keep content sections focused and not too long</li>
          <li>Consider using icons to provide additional context</li>
          <li>Use the minimal variant for content-heavy sections</li>
          <li>Prefer single-open behavior unless users need to compare content</li>
        </ul>
      </div>
    </div>
  );
} 
"use client";

import PageLayout from '@/components/layout/PageLayout';
import { useState } from 'react';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function MobileExperiencePage() {
  const [mobileDemo, setMobileDemo] = useState(false);

  const mobileFeatures = [
    {
      title: 'Touch-Optimized Navigation',
      description: 'Collapsible sidebar with 48px+ touch targets, smooth animations, and gesture support.',
      code: `// Mobile navigation with proper touch targets
.nav-toggle-btn {
  width: 48px;
  height: 48px;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}`
    },
    {
      title: 'Responsive Typography',
      description: 'Fluid typography that scales appropriately across all screen sizes with proper line heights.',
      code: `// Responsive font scaling
@media (max-width: 768px) {
  .page-title {
    font-size: var(--font-size-500);
    line-height: var(--line-height-normal);
  }
}`
    },
    {
      title: 'Enhanced Touch Targets',
      description: 'All interactive elements meet the 44px minimum touch target size for accessibility.',
      code: `// Proper touch target sizing
.btn {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 768px) {
  .btn {
    min-height: 48px;
    min-width: 48px;
  }
}`
    },
    {
      title: 'Mobile-First Forms',
      description: 'Form inputs with 16px font size to prevent zoom, enhanced focus states, and improved spacing.',
      code: `// Mobile-optimized form inputs
.form-input {
  font-size: var(--font-size-100); /* 16px prevents zoom */
  min-height: 48px;
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
}`
    }
  ];

  return (
    <PageLayout
      title="Mobile Experience"
      description="Comprehensive mobile optimizations for touch devices, responsive design, and accessibility."
    >
      <div className="page-content">
        
        {/* Mobile Demo Toggle */}
        <ExampleShowcase
          title="Mobile Preview Mode"
          description="Toggle to see how components adapt to mobile constraints"
          code={`// Responsive design approach
@media (max-width: 768px) {
  .component {
    padding: var(--sds-size-space-400);
    font-size: var(--sds-size-space-100);
    min-height: 48px;
  }
}`}
        >
          <div className="mobile-demo-container">
            <button
              className={`mobile-demo-toggle ${mobileDemo ? 'active' : ''}`}
              onClick={() => setMobileDemo(!mobileDemo)}
            >
              {mobileDemo ? '📱 Mobile Mode' : '🖥️ Desktop Mode'}
            </button>
            
            <div className={`demo-viewport ${mobileDemo ? 'mobile-viewport' : 'desktop-viewport'}`}>
              <div className="demo-content">
                <h3>Sample Content</h3>
                <p>This content adapts to different screen sizes with proper spacing and typography.</p>
                <div className="demo-buttons">
                  <button className="btn btn-sm">Small</button>
                  <button className="btn">Default</button>
                  <button className="btn btn-lg">Large</button>
                </div>
              </div>
            </div>
          </div>
        </ExampleShowcase>

        {/* Mobile Features */}
        <section className="mobile-features">
          <h2>Mobile Optimizations</h2>
          <div className="features-grid">
            {mobileFeatures.map((feature, index) => (
              <div key={index} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <pre className="code-block">
                  <code>{feature.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="technical-details">
          <h2>Technical Implementation</h2>
          <div className="implementation-grid">
            <div className="implementation-card">
              <h4>Viewport Configuration</h4>
              <pre className="code-block">
                <code>{`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#1A4A47" />
<meta name="apple-mobile-web-app-capable" content="yes" />`}</code>
              </pre>
              <p>Added proper viewport meta tags, theme color for mobile browsers, and PWA-ready configuration.</p>
            </div>
            
            <div className="implementation-card">
              <h4>Safe Area Support</h4>
              <pre className="code-block">
                <code>{`@supports (padding-top: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
  }
}`}</code>
              </pre>
              <p>Handles device notches and safe areas on modern smartphones.</p>
            </div>
            
            <div className="implementation-card">
              <h4>Dynamic Viewport Height</h4>
              <pre className="code-block">
                <code>{`.circuit-sidebar {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}`}</code>
              </pre>
              <p>Uses dynamic viewport height to handle mobile browser UI changes.</p>
            </div>
            
            <div className="implementation-card">
              <h4>Touch Interaction Improvements</h4>
              <pre className="code-block">
                <code>{`* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

.btn:active {
  transform: scale(0.98);
}`}</code>
              </pre>
              <p>Enhanced touch feedback with scale transforms and disabled tap highlights.</p>
            </div>
          </div>
        </section>

        {/* Mobile Testing Checklist */}
        <ExampleShowcase
          title="Mobile Testing Checklist"
          description="Key areas to test when implementing mobile features"
          code={`// Mobile testing approach
1. Test on real devices
2. Verify touch target sizes (44px+ minimum)
3. Check viewport scaling
4. Test orientation changes
5. Verify accessibility features`}
        >
          <div className="checklist">
            <div className="checklist-category">
              <h4>📱 Device Testing</h4>
              <ul>
                <li>✅ iPhone SE (320px width)</li>
                <li>✅ Standard phones (375px-414px)</li>
                <li>✅ Large phones (414px+)</li>
                <li>✅ Tablets (768px-1024px)</li>
              </ul>
            </div>
            
            <div className="checklist-category">
              <h4>🎯 Touch Interaction</h4>
              <ul>
                <li>✅ Minimum 44px touch targets</li>
                <li>✅ Proper tap highlight removal</li>
                <li>✅ Active state feedback</li>
                <li>✅ Scroll momentum</li>
              </ul>
            </div>
            
            <div className="checklist-category">
              <h4>🎨 Visual Design</h4>
              <ul>
                <li>✅ Readable typography (16px+ body text)</li>
                <li>✅ Sufficient color contrast</li>
                <li>✅ Proper spacing and padding</li>
                <li>✅ Safe area handling</li>
              </ul>
            </div>
            
            <div className="checklist-category">
              <h4>♿ Accessibility</h4>
              <ul>
                <li>✅ Screen reader compatibility</li>
                <li>✅ Keyboard navigation</li>
                <li>✅ Focus management</li>
                <li>✅ Reduced motion support</li>
              </ul>
            </div>
          </div>
        </ExampleShowcase>

        {/* Performance Notes */}
        <section className="performance-notes">
          <h2>Performance Considerations</h2>
          <div className="note-cards">
            <div className="note-card">
              <h4>🚀 Smooth Animations</h4>
              <p>Uses CSS transforms and opacity for 60fps animations. Hardware acceleration enabled for mobile.</p>
            </div>
            <div className="note-card">
              <h4>📊 Bundle Size</h4>
              <p>Mobile-first CSS approach reduces unused styles. Critical CSS inlined for faster loading.</p>
            </div>
            <div className="note-card">
              <h4>⚡ Touch Responsiveness</h4>
              <p>Optimized event handling with passive listeners and debounced interactions.</p>
            </div>
          </div>
        </section>

      </div>

      <style jsx>{`
        .mobile-demo-container {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-400);
          align-items: center;
        }

        .mobile-demo-toggle {
          padding: var(--sds-size-space-300) var(--sds-size-space-500);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-150);
          background: var(--surface-background);
          color: var(--text-primary);
          cursor: pointer;
          font-family: var(--font-family-display);
          font-size: var(--font-size-100);
          min-height: 48px;
          transition: all 0.15s ease;
        }

        .mobile-demo-toggle:hover {
          background: var(--surface-background-hover);
        }

        .mobile-demo-toggle.active {
          background: var(--interactive-primary);
          color: var(--text-inverse);
        }

        .demo-viewport {
          border: 2px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .desktop-viewport {
          width: 100%;
          max-width: 600px;
        }

        .mobile-viewport {
          width: 375px;
          max-width: 100%;
        }

        .demo-content {
          padding: var(--sds-size-space-600);
          background: var(--surface-background);
        }

        .demo-buttons {
          display: flex;
          gap: var(--sds-size-space-300);
          margin-top: var(--sds-size-space-400);
          flex-wrap: wrap;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--sds-size-space-500);
          margin-top: var(--sds-size-space-400);
        }

        .feature-card {
          padding: var(--sds-size-space-500);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          background: var(--surface-background);
        }

        .feature-card h3 {
          margin-bottom: var(--sds-size-space-200);
          color: var(--text-primary);
        }

        .feature-card p {
          margin-bottom: var(--sds-size-space-300);
          color: var(--text-secondary);
        }

        .implementation-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--sds-size-space-500);
          margin-top: var(--sds-size-space-400);
        }

        .implementation-card {
          padding: var(--sds-size-space-500);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          background: var(--surface-background);
        }

        .implementation-card h4 {
          margin-bottom: var(--sds-size-space-300);
          color: var(--text-primary);
        }

        .implementation-card p {
          margin-top: var(--sds-size-space-300);
          color: var(--text-secondary);
        }

        .code-block {
          background: var(--surface-background-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--sds-size-radius-150);
          padding: var(--sds-size-space-300);
          font-size: var(--font-size-75);
          overflow-x: auto;
        }

        .checklist {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--sds-size-space-400);
        }

        .checklist-category h4 {
          margin-bottom: var(--sds-size-space-200);
          color: var(--text-primary);
        }

        .checklist-category ul {
          list-style: none;
          padding: 0;
        }

        .checklist-category li {
          padding: var(--sds-size-space-100) 0;
          color: var(--text-secondary);
        }

        .note-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--sds-size-space-400);
          margin-top: var(--sds-size-space-400);
        }

        .note-card {
          padding: var(--sds-size-space-400);
          border-left: 4px solid var(--interactive-primary);
          background: var(--surface-background-subtle);
          border-radius: var(--sds-size-radius-150);
        }

        .note-card h4 {
          margin-bottom: var(--sds-size-space-200);
          color: var(--text-primary);
        }

        .note-card p {
          color: var(--text-secondary);
          margin: 0;
        }

        @media (max-width: 768px) {
          .mobile-viewport {
            width: 100%;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .implementation-grid {
            grid-template-columns: 1fr;
          }

          .checklist {
            grid-template-columns: 1fr;
          }

          .note-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageLayout>
  );
} 
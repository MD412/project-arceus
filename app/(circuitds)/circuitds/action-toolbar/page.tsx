'use client';

import React, { useState } from 'react';
import ExampleShowcase from '../../../../components/layout/ExampleShowcase';
import CodeBlock from '../components/CodeBlock';
import { Modal } from '../../../../components/ui/Modal';

export default function ActionToolbarPage() {
  // State for demo modals
  const [showModal1, setShowModal1] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [showModal3, setShowModal3] = useState(false);

  // Basic action toolbar example
  const BasicActionToolbar = () => (
    <div style={{
      display: 'flex',
      gap: 'var(--sds-size-space-300)',
      padding: 'var(--sds-size-space-400)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-background)'
    }}>
      <button
        className="toolbar-action-button with-text"
        onClick={() => setShowModal1(true)}
      >
        + Add Item
      </button>
      <button
        className="toolbar-action-button with-text"
        onClick={() => setShowModal2(true)}
      >
        + Import Data
      </button>
    </div>
  );

  // Content-specific toolbar
  const ContentActionToolbar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--sds-size-space-400)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-background)'
    }}>
      <div style={{ display: 'flex', gap: 'var(--sds-size-space-300)' }}>
        <button className="toolbar-action-button with-text">
          + New Document
        </button>
        <button className="toolbar-action-button with-text">
          📁 Upload Files
        </button>
      </div>
      <div style={{ display: 'flex', gap: 'var(--sds-size-space-200)' }}>
        <button className="toolbar-action-button">
          🔍
        </button>
        <button className="toolbar-action-button">
          ⚙️
        </button>
      </div>
    </div>
  );

  // Contextual toolbar with status
  const ContextualToolbar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--sds-size-space-400)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-background)'
    }}>
      <div style={{ display: 'flex', gap: 'var(--sds-size-space-300)' }}>
        <button className="toolbar-action-button with-text">
          + Add Card
        </button>
        <button className="toolbar-action-button with-text">
          + Process Scan
        </button>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sds-size-space-300)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-75)'
      }}>
        <span>Last sync: 2 minutes ago</span>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--status-success)'
        }}></div>
      </div>
    </div>
  );

  // Toolbar with groups
  const GroupedToolbar = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sds-size-space-400)',
      padding: 'var(--sds-size-space-400)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-background)'
    }}>
      {/* Primary Actions */}
      <div style={{ display: 'flex', gap: 'var(--sds-size-space-200)' }}>
        <button className="toolbar-action-button with-text">
          + Create
        </button>
        <button className="toolbar-action-button with-text">
          📤 Export
        </button>
      </div>

      {/* Separator */}
      <div style={{
        width: '1px',
        height: '24px',
        background: 'var(--border-default)'
      }}></div>

      {/* Secondary Actions */}
      <div style={{ display: 'flex', gap: 'var(--sds-size-space-200)' }}>
        <button className="toolbar-action-button">
          ↻
        </button>
        <button className="toolbar-action-button">
          ⚡
        </button>
        <button className="toolbar-action-button">
          📊
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="content-section">
        <h1>Action Toolbar</h1>
        <p className="section-description">
          Action toolbars provide quick access to primary actions and contextual operations. 
          They sit above the main content area and offer immediate access to key functionality without cluttering the interface.
        </p>
      </div>

      {/* Basic Example */}
      <ExampleShowcase
        title="Basic Action Toolbar"
        description="Simple toolbar with primary action buttons positioned above content."
      >
        <BasicActionToolbar />
        
        <CodeBlock code={`const ActionToolbar = () => (
  <div className="action-toolbar">
    <button className="toolbar-action-button with-text">
      + Add Item
    </button>
    <button className="toolbar-action-button with-text">
      + Import Data
    </button>
  </div>
);

// CSS
.action-toolbar {
  display: flex;
  gap: var(--sds-size-space-300);
  padding: var(--sds-size-space-400);
  border-bottom: 1px solid var(--border-default);
  background: var(--surface-background);
}`} language="tsx" />
      </ExampleShowcase>

      {/* Content-Specific Toolbar */}
      <ExampleShowcase
        title="Content-Specific Toolbar"
        description="Toolbar with actions relevant to the current content area, including secondary actions on the right."
      >
        <ContentActionToolbar />
        
        <CodeBlock code={`const ContentActionToolbar = () => (
  <div className="action-toolbar content-toolbar">
    <div className="primary-actions">
      <button className="toolbar-action-button with-text">
        + New Document
      </button>
      <button className="toolbar-action-button with-text">
        📁 Upload Files
      </button>
    </div>
    <div className="secondary-actions">
      <button className="toolbar-action-button">🔍</button>
      <button className="toolbar-action-button">⚙️</button>
    </div>
  </div>
);

// CSS
.content-toolbar {
  justify-content: space-between;
}

.primary-actions, .secondary-actions {
  display: flex;
  gap: var(--sds-size-space-200);
}`} language="tsx" />
      </ExampleShowcase>

      {/* Contextual with Status */}
      <ExampleShowcase
        title="Contextual Toolbar with Status"
        description="Toolbar that includes status information and contextual actions. This matches the pattern used in the main application."
      >
        <ContextualToolbar />
        
        <CodeBlock code={`const ContextualToolbar = () => (
  <div className="action-toolbar contextual-toolbar">
    <div className="toolbar-actions">
      <button className="toolbar-action-button with-text">
        + Add Card
      </button>
      <button className="toolbar-action-button with-text">
        + Process Scan
      </button>
    </div>
    <div className="toolbar-status">
      <span>Last sync: 2 minutes ago</span>
      <div className="status-indicator success"></div>
    </div>
  </div>
);

// CSS
.contextual-toolbar {
  justify-content: space-between;
}

.toolbar-status {
  display: flex;
  align-items: center;
  gap: var(--sds-size-space-300);
  color: var(--text-secondary);
  font-size: var(--font-size-75);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.success {
  background: var(--status-success);
}`} language="tsx" />
      </ExampleShowcase>

      {/* Grouped Actions */}
      <ExampleShowcase
        title="Grouped Action Toolbar"
        description="Toolbar with logically grouped actions separated by visual dividers."
      >
        <GroupedToolbar />
        
        <CodeBlock code={`const GroupedToolbar = () => (
  <div className="action-toolbar grouped-toolbar">
    {/* Primary Actions */}
    <div className="action-group">
      <button className="toolbar-action-button with-text">
        + Create
      </button>
      <button className="toolbar-action-button with-text">
        📤 Export
      </button>
    </div>

    {/* Separator */}
    <div className="toolbar-separator"></div>

    {/* Secondary Actions */}
    <div className="action-group">
      <button className="toolbar-action-button">↻</button>
      <button className="toolbar-action-button">⚡</button>
      <button className="toolbar-action-button">📊</button>
    </div>
  </div>
);

// CSS
.grouped-toolbar {
  gap: var(--sds-size-space-400);
}

.action-group {
  display: flex;
  gap: var(--sds-size-space-200);
}

.toolbar-separator {
  width: 1px;
  height: 24px;
  background: var(--border-default);
}`} language="tsx" />
      </ExampleShowcase>

      {/* Implementation Details */}
      <div className="content-section">
        <h2>Implementation</h2>
        
        <h3>CSS Classes</h3>
        <p>The action toolbar uses these key CSS classes:</p>
        
        <CodeBlock code={`/* Base toolbar container */
.action-toolbar {
  display: flex;
  align-items: center;
  padding: var(--sds-size-space-400);
  border-bottom: 1px solid var(--border-default);
  background: var(--surface-background);
}

/* Action button styles */
.toolbar-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--sds-size-space-200) var(--sds-size-space-300);
  border: 1px solid var(--border-default);
  border-radius: var(--sds-size-radius-100);
  background: var(--surface-background);
  color: var(--text-primary);
  font-family: var(--font-family-display);
  font-size: var(--font-size-75);
  cursor: pointer;
  transition: all 0.15s ease-out;
}

.toolbar-action-button:hover {
  background: var(--surface-background-hover);
  border-color: var(--border-hover);
}

.toolbar-action-button.with-text {
  gap: var(--sds-size-space-100);
  padding: var(--sds-size-space-200) var(--sds-size-space-400);
}

/* Focus states */
.toolbar-action-button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}`} language="css" />

        <h3>Layout Integration</h3>
        <p>Action toolbars are typically integrated into the layout structure:</p>
        
        <CodeBlock code={`// Layout structure
<div className="app-layout">
  <div className="sidebar">
    {/* Navigation */}
  </div>
  <div className="main-content-area">
    <div className="top-toolbar">
      <ActionToolbar />
    </div>
    <main className="app-content">
      {/* Page content */}
    </main>
  </div>
</div>

// CSS
.top-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface-background);
  border-bottom: 1px solid var(--border-default);
}

.main-content-area {
  display: flex;
  flex-direction: column;
  flex: 1;
}`} language="tsx" />
      </div>

      {/* Best Practices */}
      <div className="content-section">
        <h2>Best Practices</h2>
        
        <h3>When to Use</h3>
        <ul>
          <li><strong>Primary Actions:</strong> Place the most important actions users need to perform</li>
          <li><strong>Content Creation:</strong> Actions like "Add", "Create", "Upload" work well in toolbars</li>
          <li><strong>Bulk Operations:</strong> Actions that apply to multiple items or the entire view</li>
          <li><strong>Contextual Tools:</strong> Actions that change based on the current page or selection</li>
        </ul>

        <h3>Design Guidelines</h3>
        <ul>
          <li>Keep the most important actions on the left</li>
          <li>Use clear, action-oriented labels ("+ Add Card" not just "Add")</li>
          <li>Group related actions together with visual separators</li>
          <li>Limit to 3-5 primary actions to avoid overwhelming users</li>
          <li>Consider mobile responsiveness - actions may need to collapse or stack</li>
        </ul>

        <h3>Accessibility</h3>
        <ul>
          <li>Use semantic button elements with clear aria-labels</li>
          <li>Ensure keyboard navigation works properly</li>
          <li>Provide focus indicators that meet WCAG standards</li>
          <li>Use tooltips for icon-only buttons</li>
          <li>Consider screen reader announcements for dynamic actions</li>
        </ul>
      </div>

      {/* Demo Modals */}
      {showModal1 && (
        <Modal open={true} onClose={() => setShowModal1(false)} title="Add Item">
          <p>This would be your add item form...</p>
          <button onClick={() => setShowModal1(false)}>Close</button>
        </Modal>
      )}

      {showModal2 && (
        <Modal open={true} onClose={() => setShowModal2(false)} title="Import Data">
          <p>This would be your import data form...</p>
          <button onClick={() => setShowModal2(false)}>Close</button>
        </Modal>
      )}

      {showModal3 && (
        <Modal open={true} onClose={() => setShowModal3(false)} title="Settings">
          <p>This would be your settings panel...</p>
          <button onClick={() => setShowModal3(false)}>Close</button>
        </Modal>
      )}
    </div>
  );
} 
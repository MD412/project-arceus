'use client';

import React from 'react';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import CodeBlock from '../components/CodeBlock';

export default function DragAndDropPage() {
  return (
    <div className="page-content">
      <header className="page-header">
        <h1>Drag & Drop with @dnd-kit</h1>
        <p className="page-description">
          Exploring the full capabilities of @dnd-kit beyond simple sortable lists
        </p>
      </header>

      <ContentSection title="The Auto-Sort Problem">
        <p>
          You discovered that the <code>SortableContext</code> preset automatically reflows 
          items as you drag - great for Trello, not for card games where positions should 
          remain static until drop. Here's what else @dnd-kit can do:
        </p>
      </ContentSection>

      <ContentSection title="Core Concepts">
        <div className="concept-grid">
          <div className="concept-card">
            <h3>1. Draggable & Droppable</h3>
            <p>The building blocks - make any element draggable or a drop target</p>
            <CodeBlock code={`const { attributes, listeners, setNodeRef } = useDraggable({
  id: 'unique-id',
});

const { isOver, setNodeRef } = useDroppable({
  id: 'drop-zone',
});`} language="tsx" />
          </div>

          <div className="concept-card">
            <h3>2. Multiple Container DnD</h3>
            <p>Drag items between different containers (Kanban boards)</p>
            <CodeBlock code={`// Move cards between columns
const handleDragEnd = (event) => {
  const {active, over} = event;
  
  if (active.data.current?.sortable.containerId !== 
      over.data.current?.sortable.containerId) {
    // Item moved to different container
  }
};`} language="tsx" />
          </div>

          <div className="concept-card">
            <h3>3. Custom Drag Overlay</h3>
            <p>Create any visual representation while dragging</p>
            <CodeBlock code={`<DragOverlay>
  {activeId ? (
    <div className="custom-ghost">
      <span>🎮 Moving: {activeItem.name}</span>
    </div>
  ) : null}
</DragOverlay>`} language="tsx" />
          </div>

          <div className="concept-card">
            <h3>4. Collision Detection</h3>
            <p>Choose how drag collisions are detected</p>
            <CodeBlock code={`// Different strategies
import {
  closestCenter,     // Closest to center
  closestCorners,    // Closest corner
  rectIntersection,  // Rectangle overlap
  pointerWithin,     // Pointer inside
} from '@dnd-kit/core';`} language="tsx" />
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Advanced Use Cases">
        <ExampleShowcase
          title="1. Free-form Canvas Dragging"
          description="Drag elements anywhere on a canvas (like Figma)"
        >
          <CodeBlock code={`function CanvasDraggable({ item, position }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
  });

  const style = {
    position: 'absolute',
    left: position.x + (transform?.x || 0),
    top: position.y + (transform?.y || 0),
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {item.content}
    </div>
  );
}`} language="tsx" />
        </ExampleShowcase>

        <ExampleShowcase
          title="2. Snap to Grid"
          description="Make items snap to a grid while dragging"
        >
          <CodeBlock code={`const snapToGrid = (transform) => {
  const gridSize = 20;
  return {
    x: Math.round(transform.x / gridSize) * gridSize,
    y: Math.round(transform.y / gridSize) * gridSize,
  };
};

// Use with modifiers
<DndContext modifiers={[snapToGrid]}>`} language="tsx" />
        </ExampleShowcase>

        <ExampleShowcase
          title="3. Restrict to Bounds"
          description="Keep draggable items within container bounds"
        >
          <CodeBlock code={`const restrictToParentElement = (args) => {
  const {transform, draggingNodeRect, containerNodeRect} = args;
  
  if (!draggingNodeRect || !containerNodeRect) {
    return transform;
  }

  return {
    ...transform,
    x: Math.max(
      Math.min(
        transform.x,
        containerNodeRect.width - draggingNodeRect.width
      ),
      0
    ),
  };
};`} language="tsx" />
        </ExampleShowcase>

        <ExampleShowcase
          title="4. Custom Sensors"
          description="Create custom activation conditions"
        >
          <CodeBlock code={`// Long press to drag on mobile
const longPressSensor = useSensor(PointerSensor, {
  activationConstraint: {
    delay: 250,        // 250ms hold
    tolerance: 5,      // 5px movement allowed
  },
});

// Keyboard navigation
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
});`} language="tsx" />
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Static Placement Solution">
        <p>
          For true static placement behavior (cards stay in position until drop), we bypass the sortable preset entirely:
        </p>
        
        <div className="solution-steps">
          <div className="step">
            <span className="step-number">1</span>
            <div>
              <h4>Use Core API Directly</h4>
              <p>Skip SortableContext, use draggable + droppable</p>
            </div>
          </div>
          
          <div className="step">
            <span className="step-number">2</span>
            <div>
              <h4>Manual Position Management</h4>
              <p>Cards stay in place until drop completes</p>
            </div>
          </div>
          
          <div className="step">
            <span className="step-number">3</span>
            <div>
              <h4>Swap on Drop</h4>
              <p>Only swap positions when user releases</p>
            </div>
          </div>
        </div>

        <CodeBlock code={`// The key difference:
// DON'T use transform during drag
const style = {
  transform: isDragging ? undefined : transform,
};

// This prevents the auto-reflow behavior`} language="tsx" />
      </ContentSection>

      <ContentSection title="Other Cool Things You Can Build">
        <div className="use-case-grid">
          <div className="use-case">
            <h4>🎨 Color Picker</h4>
            <p>Drag to select colors on a spectrum</p>
          </div>
          <div className="use-case">
            <h4>📏 Resizable Panels</h4>
            <p>Drag dividers to resize layout sections</p>
          </div>
          <div className="use-case">
            <h4>🗂️ File Manager</h4>
            <p>Drag files between folders</p>
          </div>
          <div className="use-case">
            <h4>🎯 Target Practice</h4>
            <p>Drag and drop with scoring zones</p>
          </div>
          <div className="use-case">
            <h4>📐 Form Builder</h4>
            <p>Drag fields to build dynamic forms</p>
          </div>
          <div className="use-case">
            <h4>🧩 Puzzle Games</h4>
            <p>Drag pieces with rotation and snap</p>
          </div>
        </div>
      </ContentSection>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--sds-size-space-600);
        }

        .page-header {
          margin-bottom: var(--sds-size-space-800);
        }

        .page-header h1 {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--font-size-400);
          font-weight: 700;
        }

        .page-description {
          color: var(--text-secondary);
          font-size: var(--font-size-200);
          margin: 0;
        }

        .concept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--sds-size-space-400);
          margin-top: var(--sds-size-space-400);
        }

        .concept-card {
          padding: var(--sds-size-space-400);
          background: var(--surface-subtle);
          border-radius: var(--sds-size-radius-200);
          border: 1px solid var(--border-subtle);
        }

        .concept-card h3 {
          margin: 0 0 var(--sds-size-space-200) 0;
          color: var(--interactive-primary);
          font-size: var(--font-size-150);
        }

        .concept-card p {
          margin: 0 0 var(--sds-size-space-300) 0;
          color: var(--text-secondary);
          font-size: var(--font-size-100);
        }

        .solution-steps {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-300);
          margin: var(--sds-size-space-400) 0;
        }

        .step {
          display: flex;
          gap: var(--sds-size-space-300);
          align-items: flex-start;
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--interactive-primary);
          color: var(--text-on-primary);
          border-radius: 50%;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step h4 {
          margin: 0 0 var(--sds-size-space-100) 0;
          font-size: var(--font-size-125);
        }

        .step p {
          margin: 0;
          color: var(--text-secondary);
          font-size: var(--font-size-100);
        }

        .use-case-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--sds-size-space-300);
          margin-top: var(--sds-size-space-400);
        }

        .use-case {
          padding: var(--sds-size-space-300);
          background: var(--surface-background);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-150);
          text-align: center;
        }

        .use-case h4 {
          margin: 0 0 var(--sds-size-space-100) 0;
          font-size: var(--font-size-100);
        }

        .use-case p {
          margin: 0;
          color: var(--text-secondary);
          font-size: var(--font-size-75);
        }
      `}</style>
    </div>
  );
} 
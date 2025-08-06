'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import IconButton from '@/components/ui/IconButton';
import { Trash, X, PencilSimple, Plus, Gear } from '@phosphor-icons/react';

export default function IconButtonPage() {
  return (
    <PageLayout
      title="Icon Button"
      description="Icon buttons are compact utility buttons used for actions that don't require text labels. They're perfect for remove, close, edit, and other utility actions."
    >
      <ContentSection title="Overview">
        <p className="body-medium">
          Icon buttons are specialized components for utility actions that don't need text labels.
          They're compact, efficient, and perfect for actions like remove, close, edit, or settings.
          Unlike regular buttons, icon buttons are designed to be small and unobtrusive.
        </p>
      </ContentSection>

      <ContentSection title="Variants">
        <p className="body-medium">
          Icon buttons come in different variants to match the context and importance of the action.
          The primary variant uses Circuit Bright Yellow for high-visibility utility actions.
        </p>
        
        <ExampleShowcase
          title="Primary Icon Button"
          headingLevel={3}
          description="Use primary icon buttons for important utility actions. Features Circuit Bright Yellow background with dark teal icon."
          preview={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sds-size-space-400)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-600)' }}>
                <IconButton variant="primary" size="sm">
                  <Trash size={14} weight="light" />
                </IconButton>
                <IconButton variant="primary" size="md">
                  <X size={16} weight="light" />
                </IconButton>
                <IconButton variant="primary" size="lg">
                  <PencilSimple size={18} weight="light" />
                </IconButton>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-600)' }}>
                <IconButton variant="primary" size="sm" disabled>
                  <Trash size={14} weight="light" />
                </IconButton>
                <IconButton variant="primary" size="md" disabled>
                  <X size={16} weight="light" />
                </IconButton>
                <IconButton variant="primary" size="lg" disabled>
                  <PencilSimple size={18} weight="light" />
                </IconButton>
              </div>
            </div>
          }
          code={`<IconButton variant="primary" size="sm">
  <Trash size={14} weight="light" />
</IconButton>

<IconButton variant="primary" size="md">
  <X size={16} weight="light" />
</IconButton>

<IconButton variant="primary" size="lg">
  <PencilSimple size={18} weight="light" />
</IconButton>`}
        />

        <ExampleShowcase
          title="Secondary Icon Button"
          headingLevel={3}
          description="Use secondary icon buttons for less prominent utility actions. Transparent background with border."
          preview={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-600)' }}>
              <IconButton variant="secondary" size="sm">
                <Gear size={14} weight="light" />
              </IconButton>
              <IconButton variant="secondary" size="md">
                <Plus size={16} weight="light" />
              </IconButton>
              <IconButton variant="secondary" size="lg">
                <PencilSimple size={18} weight="light" />
              </IconButton>
            </div>
          }
          code={`<IconButton variant="secondary" size="sm">
  <Gear size={14} weight="light" />
</IconButton>

<IconButton variant="secondary" size="md">
  <Plus size={16} weight="light" />
</IconButton>

<IconButton variant="secondary" size="lg">
  <PencilSimple size={18} weight="light" />
</IconButton>`}
        />

        <ExampleShowcase
          title="Destructive Icon Button"
          headingLevel={3}
          description="Use destructive icon buttons for remove/delete actions. Red text with subtle hover effects."
          preview={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-600)' }}>
              <IconButton variant="destructive" size="sm">
                <Trash size={14} weight="light" />
              </IconButton>
              <IconButton variant="destructive" size="md">
                <X size={16} weight="light" />
              </IconButton>
              <IconButton variant="destructive" size="lg">
                <Trash size={18} weight="light" />
              </IconButton>
            </div>
          }
          code={`<IconButton variant="destructive" size="sm">
  <Trash size={14} weight="light" />
</IconButton>

<IconButton variant="destructive" size="md">
  <X size={16} weight="light" />
</IconButton>

<IconButton variant="destructive" size="lg">
  <Trash size={18} weight="light" />
</IconButton>`}
        />

        <ExampleShowcase
          title="Ghost Icon Button"
          headingLevel={3}
          description="Use ghost icon buttons for subtle utility actions. Minimal styling with brand color."
          preview={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-600)' }}>
              <IconButton variant="ghost" size="sm">
                <Gear size={14} weight="light" />
              </IconButton>
              <IconButton variant="ghost" size="md">
                <Plus size={16} weight="light" />
              </IconButton>
              <IconButton variant="ghost" size="lg">
                <PencilSimple size={18} weight="light" />
              </IconButton>
            </div>
          }
          code={`<IconButton variant="ghost" size="sm">
  <Gear size={14} weight="light" />
</IconButton>

<IconButton variant="ghost" size="md">
  <Plus size={16} weight="light" />
</IconButton>

<IconButton variant="ghost" size="lg">
  <PencilSimple size={18} weight="light" />
</IconButton>`}
        />
      </ContentSection>

      <ContentSection title="Sizes">
        <p className="body-medium">
          Icon buttons come in three sizes to accommodate different contexts and touch target needs.
          Small is perfect for tight spaces, medium for most use cases, and large for prominent actions.
        </p>
        
        <ExampleShowcase
          title="Size variants"
          description="Choose the appropriate size based on the context and importance of the action."
          preview={
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--text-secondary)] w-16">Small:</span>
                <IconButton variant="primary" size="sm">
                  <Trash size={14} weight="light" />
                </IconButton>
                <span className="text-xs text-[var(--text-tertiary)]">24×24px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--text-secondary)] w-16">Medium:</span>
                <IconButton variant="primary" size="md">
                  <Trash size={16} weight="light" />
                </IconButton>
                <span className="text-xs text-[var(--text-tertiary)]">32×32px</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--text-secondary)] w-16">Large:</span>
                <IconButton variant="primary" size="lg">
                  <Trash size={18} weight="light" />
                </IconButton>
                <span className="text-xs text-[var(--text-tertiary)]">40×40px</span>
              </div>
            </div>
          }
          code={`// Small - 24×24px
<IconButton variant="primary" size="sm">
  <Trash size={14} weight="light" />
</IconButton>

// Medium - 32×32px (default)
<IconButton variant="primary" size="md">
  <Trash size={16} weight="light" />
</IconButton>

// Large - 40×40px
<IconButton variant="primary" size="lg">
  <Trash size={18} weight="light" />
</IconButton>`}
        />
      </ContentSection>

      <ContentSection title="Usage Guidelines">
        <ul className="list-disc body-medium">
          <li>Use icon buttons for utility actions that don't need text labels</li>
          <li>Primary variant is perfect for important actions like remove/delete</li>
          <li>Keep icons simple and universally understood</li>
          <li>Use consistent icon sizes within your interface</li>
          <li>Provide clear aria-labels for accessibility</li>
          <li>Choose size based on context - small for tight spaces, large for touch targets</li>
          <li>Use destructive variant sparingly for actual destructive actions</li>
        </ul>
      </ContentSection>

      <ContentSection title="When to Use">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">✅ Good Use Cases</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Remove/delete items from lists</li>
              <li>• Close modals or panels</li>
              <li>• Edit inline content</li>
              <li>• Settings or configuration</li>
              <li>• Add items to collections</li>
              <li>• Toggle visibility states</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">❌ Avoid</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Primary calls to action</li>
              <li>• Actions that need explanation</li>
              <li>• Complex multi-step actions</li>
              <li>• Actions that aren't immediately clear</li>
              <li>• Replacing text buttons in forms</li>
              <li>• Navigation between major sections</li>
            </ul>
          </div>
        </div>
      </ContentSection>
    </PageLayout>
  );
} 
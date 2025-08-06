'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { Button } from '@/components/ui/Button';

// Helper component to display button colors
const ButtonColorInfo = ({ 
  variantName, 
  backgroundVar, 
  backgroundHex, 
  textVar, 
  textHex, 
  borderVar, 
  borderHex,
  description 
}: { 
  variantName: string;
  backgroundVar: string;
  backgroundHex: string;
  textVar: string;
  textHex: string;
  borderVar?: string;
  borderHex?: string;
  description: string;
}) => (
  <div className="space-y-4 border border-[var(--border-default)] rounded-lg p-4">
    <div>
      <h4 className="font-semibold text-[var(--text-primary)] mb-2">{variantName}</h4>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Background Color */}
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded border border-[var(--border-default)]" 
          style={{ backgroundColor: backgroundHex }}
        />
        <div>
          <div className="text-sm font-medium">Background</div>
          <div className="text-xs text-[var(--text-secondary)]">{backgroundVar}</div>
          <div className="text-xs font-mono text-[var(--text-tertiary)]">{backgroundHex}</div>
        </div>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded border border-[var(--border-default)] flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: backgroundHex, color: textHex }}
        >
          Aa
        </div>
        <div>
          <div className="text-sm font-medium">Text</div>
          <div className="text-xs text-[var(--text-secondary)]">{textVar}</div>
          <div className="text-xs font-mono text-[var(--text-tertiary)]">{textHex}</div>
        </div>
      </div>

      {/* Border Color (if provided) */}
      {borderVar && borderHex && (
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded border-2" 
            style={{ borderColor: borderHex, backgroundColor: 'transparent' }}
          />
          <div>
            <div className="text-sm font-medium">Border</div>
            <div className="text-xs text-[var(--text-secondary)]">{borderVar}</div>
            <div className="text-xs font-mono text-[var(--text-tertiary)]">{borderHex}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default function ButtonsPage() {
  return (
    <PageLayout
      title="Buttons"
      description="Buttons allow users to trigger actions with a single tap. They communicate calls to action to your users and allow them to interact with your interface."
    >
      <ContentSection title="Overview">
        <p className="body-medium">
          Our button system provides a consistent way to trigger actions across the interface.
          Each variant serves a specific purpose and follows our design principles for interactive elements.
        </p>
      </ContentSection>

      <ContentSection title="Variants">
        <p className="body-medium">
          Our button system provides a consistent way to trigger actions across the interface.
          Each variant serves a specific purpose and follows our design principles for interactive elements.
        </p>
        
        <ExampleShowcase
          title="Primary button"
          headingLevel={3}
          description="Use primary buttons for main calls to action. Limit primary buttons to one per view to maintain clear visual hierarchy."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="primary">Primary button</Button>
              <Button variant="primary" disabled>Primary disabled</Button>
            </div>
          }
          code={`<Button variant="primary">Primary button</Button>
<Button variant="primary" disabled>Primary disabled</Button>`}
        />

        <ExampleShowcase
          title="Secondary button"
          headingLevel={3}
          description="Use secondary buttons for supporting actions that need more emphasis than ghost buttons. These are commonly used for secondary actions alongside a primary button."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="secondary">Secondary button</Button>
              <Button variant="secondary" disabled>Secondary disabled</Button>
            </div>
          }
          code={`<Button variant="secondary">Secondary button</Button>
<Button variant="secondary" disabled>Secondary disabled</Button>`}
        />

        <ExampleShowcase
          title="Ghost button"
          headingLevel={3}
          description="Use ghost buttons for secondary actions or in places where a button needs to be less visually prominent. Perfect for actions within content areas or as tertiary actions."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="ghost">Ghost button</Button>
              <Button variant="ghost" disabled>Ghost disabled</Button>
            </div>
          }
          code={`<Button variant="ghost">Ghost button</Button>
<Button variant="ghost" disabled>Ghost disabled</Button>`}
        />
        
        <ExampleShowcase
          title="Destructive button"
          headingLevel={3}
          description="Use destructive buttons for actions that permanently delete data or have significant, irreversible consequences. They should be used sparingly and typically require confirmation."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="destructive">Destructive button</Button>
              <Button variant="destructive" disabled>Destructive disabled</Button>
            </div>
          }
          code={`<Button variant="destructive">Destructive button</Button>
<Button variant="destructive" disabled>Destructive disabled</Button>`}
        />

        <ExampleShowcase
          title="Ghost Destructive button"
          headingLevel={3}
          description="Use ghost destructive buttons for subtle remove/delete actions within content areas. Perfect for file lists, item removal, or secondary destructive actions."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="ghost-destructive">Ghost Destructive button</Button>
              <Button variant="ghost-destructive" disabled>Ghost Destructive disabled</Button>
            </div>
          }
          code={`<Button variant="ghost-destructive">Ghost Destructive button</Button>
<Button variant="ghost-destructive" disabled>Ghost Destructive disabled</Button>`}
        />

        <ExampleShowcase
          title="Info button"
          headingLevel={3}
          description="Use info buttons for informational actions or to provide additional context. Perfect for help actions, documentation links, or neutral informational dialogs."
          preview={
            <div className="flex flex-col gap-4">
              <Button variant="info">Info button</Button>
              <Button variant="info" disabled>Info disabled</Button>
            </div>
          }
          code={`<Button variant="info">Info button</Button>
<Button variant="info" disabled>Info disabled</Button>`}
        />
      </ContentSection>

      <ContentSection title="Colors & Theming">
        <p className="body-medium">
          Each button variant uses specific colors from our design system. Here are the exact colors and CSS variables used for each button type, including their hex values for reference.
        </p>

        <div className="space-y-6">
          <ButtonColorInfo
            variantName="Primary Button"
            description="High-emphasis buttons for primary actions. Uses circuit bright yellow background with dark teal text for optimal contrast."
            backgroundVar="--interactive-primary"
            backgroundHex="#ffcf60"
            textVar="--text-inverse"
            textHex="#1a4a47"
            borderVar="--interactive-primary"
            borderHex="#ffcf60"
          />

          <ButtonColorInfo
            variantName="Secondary Button"
            description="Medium-emphasis buttons for secondary actions. Transparent background with border and primary text color."
            backgroundVar="transparent"
            backgroundHex="transparent"
            textVar="--text-primary"
            textHex="#fff2d1"
            borderVar="--border-default"
            borderHex="#4a9b94"
          />

          <ButtonColorInfo
            variantName="Ghost Button"
            description="Low-emphasis buttons for tertiary actions. Minimal styling with brand color text on transparent background."
            backgroundVar="transparent"
            backgroundHex="transparent"
            textVar="--interactive-primary"
            textHex="#ffcf60"
          />

          <ButtonColorInfo
            variantName="Destructive Button"
            description="High-emphasis buttons for destructive actions. Uses error color background with inverse text for strong contrast."
            backgroundVar="--status-error"
            backgroundHex="#e74c3c"
            textVar="--text-inverse"
            textHex="#1a4a47"
            borderVar="--status-error"
            borderHex="#e74c3c"
          />

          <ButtonColorInfo
            variantName="Ghost Destructive Button"
            description="Subtle destructive buttons for remove/delete actions. Transparent background with red text for low-emphasis destructive actions."
            backgroundVar="transparent"
            backgroundHex="transparent"
            textVar="--status-error"
            textHex="#dc2626"
          />

          <ButtonColorInfo
            variantName="Info Button"
            description="Medium-emphasis buttons for informational actions. Uses blue color background with inverse text for good contrast."
            backgroundVar="--color-blue-500"
            backgroundHex="#3286f5"
            textVar="--text-inverse"
            textHex="#1a4a47"
            borderVar="--color-blue-500"
            borderHex="#3286f5"
          />
        </div>

        <div className="mt-8 p-4 bg-[var(--status-info-subtle)] border border-[var(--color-blue-300)] rounded-lg">
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">Hover & Focus States</h4>
          <p className="text-sm text-[var(--text-secondary)]">
            All buttons have hover, active, and focus states with slightly modified colors:
          </p>
          <ul className="text-sm text-[var(--text-secondary)] mt-2 space-y-1">
            <li>• <strong>Hover:</strong> Backgrounds become lighter or more saturated</li>
            <li>• <strong>Active/Pressed:</strong> Backgrounds become darker or less saturated</li>
            <li>• <strong>Focus:</strong> Bright yellow focus ring ({`var(--focus-ring)`}: #ffcf60)</li>
            <li>• <strong>Disabled:</strong> 60% opacity with pointer-events disabled</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Sizes">
        <p className="body-medium">
          Buttons come in three sizes to accommodate different use cases and layout needs.
          Use the appropriate size based on the context and importance of the action.
        </p>
        
        <ExampleShowcase
          title="Size variants"
          description="Small buttons are ideal for tight spaces, medium (default) for most use cases, and large for prominent actions or touch targets."
          preview={
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button variant="primary" size="sm">Small button</Button>
                <Button variant="primary" size="md">Default (medium)</Button>
                <Button variant="primary" size="lg">Large button</Button>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="secondary" size="sm">Small button</Button>
                <Button variant="secondary" size="md">Default (medium)</Button>
                <Button variant="secondary" size="lg">Large button</Button>
              </div>
            </div>
          }
          code={`// Small
<Button variant="primary" size="sm">Small button</Button>

// Medium (default)
<Button variant="primary" size="md">Default (medium)</Button>

// Large
<Button variant="primary" size="lg">Large button</Button>`}
        />
      </ContentSection>

      <ContentSection title="States">
        <p className="body-medium">
          Buttons have different states to provide visual feedback and indicate interactivity.
          All buttons support hover, active (pressed), focus, and disabled states.
        </p>

        <ExampleShowcase
          title="Interactive states"
          description="Buttons change appearance on hover and when pressed to provide clear feedback to users. Focus states are visible when navigating with keyboard."
          preview={
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Hover me</Button>
              <Button variant="secondary">Click and hold</Button>
              <Button variant="ghost">Tab to focus</Button>
            </div>
          }
          code={`<Button variant="primary">Hover me</Button>
<Button variant="secondary">Click and hold</Button>
<Button variant="ghost">Tab to focus</Button>`}
        />
      </ContentSection>

      <ContentSection title="Usage Guidelines">
        <ul className="list-disc body-medium">
          <li>Use only one primary button per view to maintain a clear hierarchy</li>
          <li>Ensure button text clearly describes the action it performs</li>
          <li>Use sentence case for button labels</li>
          <li>Keep button text concise - ideally 1-3 words</li>
          <li>For destructive actions, consider using a confirmation dialog</li>
          <li>Maintain consistent spacing between grouped buttons</li>
          <li>Use appropriate size based on context and touch target needs</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 
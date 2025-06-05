'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { Button } from '@/components/ui/Button';

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
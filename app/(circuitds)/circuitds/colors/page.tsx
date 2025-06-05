'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

// Helper component to display a color swatch
const ColorSwatch = ({ colorVar, name }: { colorVar: string; name: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
    <div
      style={{
        width: '100px',
        height: '50px',
        backgroundColor: `var(${colorVar})`,
        border: '1px solid var(--border-default)',
        marginRight: '1rem',
      }}
    />
    <div>
      <div>{name}</div>
      <code style={{ fontSize: '0.875rem' }}>{colorVar}</code>
    </div>
  </div>
);

const PrimitiveColorRow = ({ scaleName, colorVarPrefix }: { scaleName: string; colorVarPrefix: string }) => {
  const shades = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  return (
    <>
      {shades.map(shade => (
        <ExampleShowcase
          key={`${colorVarPrefix}-${shade}`}
          title={`${scaleName} ${shade}`}
          headingLevel={4} // Use h4 for individual swatches within a scale for better hierarchy
          preview={<ColorSwatch colorVar={`${colorVarPrefix}-${shade}`} name={`${scaleName} ${shade}`} />}
          code={`<div style={{ backgroundColor: 'var(${colorVarPrefix}-${shade})' }} />`}
        />
      ))}
    </>
  );
};

export default function ColorsPage() {
  return (
    <PageLayout
      title="Colors"
      description="Our color system provides a comprehensive palette for building consistent and accessible interfaces. Each color is available as a CSS custom property that you can reference in your styles."
    >
      <ContentSection title="Current Theme Colors">
        <p>These are the semantic colors currently active in the selected theme. They provide consistent color usage across the interface regardless of the theme.</p>
        <ExampleShowcase
          title="Background"
          headingLevel={3}
          description="Main background color."
          preview={<ColorSwatch colorVar="--background" name="Background" />}
          code={`<div style={{ backgroundColor: 'var(--background)' }} />`}
        />
        <ExampleShowcase
          title="Foreground"
          headingLevel={3}
          description="Main foreground color, typically used for text."
          preview={<ColorSwatch colorVar="--foreground" name="Foreground" />}
          code={`<div style={{ color: 'var(--foreground)' }} />`}
        />
      </ContentSection>

      <ContentSection title="Surface Colors">
         <p>Colors used for different surface states and backgrounds.</p>
        <ExampleShowcase
          title="Surface Background"
          headingLevel={3}
          description="Default surface background color."
          preview={<ColorSwatch colorVar="--surface-background" name="Surface Background" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Hover"
          headingLevel={3}
          description="Surface background color on hover."
          preview={<ColorSwatch colorVar="--surface-background-hover" name="Surface Background Hover" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-hover)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Pressed"
          headingLevel={3}
          description="Surface background color when pressed."
          preview={<ColorSwatch colorVar="--surface-background-pressed" name="Surface Background Pressed" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-pressed)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Subtle"
          headingLevel={3}
          description="Subtle surface background variation."
          preview={<ColorSwatch colorVar="--surface-background-subtle" name="Surface Background Subtle" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-subtle)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Muted"
          headingLevel={3}
          description="Muted surface background color."
          preview={<ColorSwatch colorVar="--surface-background-muted" name="Surface Background Muted" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-muted)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Emphasis"
          headingLevel={3}
          description="Emphasized surface background color."
          preview={<ColorSwatch colorVar="--surface-background-emphasis" name="Surface Background Emphasis" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-emphasis)' }} />`}
        />
        <ExampleShowcase
          title="Surface Background Disabled"
          headingLevel={3}
          description="Surface background color for disabled states."
          preview={<ColorSwatch colorVar="--surface-background-disabled" name="Surface Background Disabled" />}
          code={`<div style={{ backgroundColor: 'var(--surface-background-disabled)' }} />`}
        />
      </ContentSection>
      
      <ContentSection title="Text Colors">
        <p>Colors used for different types of text and content.</p>
        <ExampleShowcase
          title="Text Primary"
          headingLevel={3}
          description="Primary text color."
          preview={<ColorSwatch colorVar="--text-primary" name="Text Primary" />}
          code={`<p style={{ color: 'var(--text-primary)' }}>Text Primary</p>`}
        />
         <ExampleShowcase
          title="Text Secondary"
          headingLevel={3}
          description="Secondary text color."
          preview={<ColorSwatch colorVar="--text-secondary" name="Text Secondary" />}
          code={`<p style={{ color: 'var(--text-secondary)' }}>Text Secondary</p>`}
        />
        <ExampleShowcase
          title="Text Tertiary"
          headingLevel={3}
          description="Tertiary text color."
          preview={<ColorSwatch colorVar="--text-tertiary" name="Text Tertiary" />}
          code={`<p style={{ color: 'var(--text-tertiary)' }}>Text Tertiary</p>`}
        />
        <ExampleShowcase
          title="Text Disabled"
          headingLevel={3}
          description="Text color for disabled states."
          preview={<ColorSwatch colorVar="--text-disabled" name="Text Disabled" />}
          code={`<p style={{ color: 'var(--text-disabled)' }}>Text Disabled</p>`}
        />
        <ExampleShowcase
          title="Text Inverse"
          headingLevel={3}
          description="Inverse text color, for use on dark backgrounds."
          preview={<ColorSwatch colorVar="--text-inverse" name="Text Inverse" />}
          code={`<p style={{ color: 'var(--text-inverse)', backgroundColor: 'var(--color-slate-800)', padding: '0.5rem' }}>Text Inverse</p>`}
        />
        <ExampleShowcase
          title="Text Brand"
          headingLevel={3}
          description="Brand-aligned text color."
          preview={<ColorSwatch colorVar="--text-brand" name="Text Brand" />}
          code={`<p style={{ color: 'var(--text-brand)' }}>Text Brand</p>`}
        />
        <ExampleShowcase
          title="Text Error"
          headingLevel={3}
          description="Text color for error messages."
          preview={<ColorSwatch colorVar="--text-error" name="Text Error" />}
          code={`<p style={{ color: 'var(--text-error)' }}>Text Error</p>`}
        />
        <ExampleShowcase
          title="Text Success"
          headingLevel={3}
          description="Text color for success messages."
          preview={<ColorSwatch colorVar="--text-success" name="Text Success" />}
          code={`<p style={{ color: 'var(--text-success)' }}>Text Success</p>`}
        />
        <ExampleShowcase
          title="Text Warning"
          headingLevel={3}
          description="Text color for warning messages."
          preview={<ColorSwatch colorVar="--text-warning" name="Text Warning" />}
          code={`<p style={{ color: 'var(--text-warning)' }}>Text Warning</p>`}
        />
      </ContentSection>

      <ContentSection title="Border Colors">
        <p>Colors used for borders and dividers.</p>
        <ExampleShowcase
          title="Border Default"
          headingLevel={3}
          description="Default border color."
          preview={<ColorSwatch colorVar="--border-default" name="Border Default" />}
          code={`<div style={{ border: '1px solid var(--border-default)', padding: '1rem' }} />`}
        />
        <ExampleShowcase
          title="Border Hover"
          headingLevel={3}
          description="Border color on hover."
          preview={<ColorSwatch colorVar="--border-hover" name="Border Hover" />}
          code={`<div style={{ border: '1px solid var(--border-hover)', padding: '1rem' }} />`}
        />
        <ExampleShowcase
          title="Border Focus"
          headingLevel={3}
          description="Border color for focused states."
          preview={<ColorSwatch colorVar="--border-focus" name="Border Focus" />}
          code={`<div style={{ border: '1px solid var(--border-focus)', padding: '1rem' }} />`}
        />
        <ExampleShowcase
          title="Border Error"
          headingLevel={3}
          description="Border color for error states."
          preview={<ColorSwatch colorVar="--border-error" name="Border Error" />}
          code={`<div style={{ border: '1px solid var(--border-error)', padding: '1rem' }} />`}
        />
        <ExampleShowcase
          title="Border Success"
          headingLevel={3}
          description="Border color for success states."
          preview={<ColorSwatch colorVar="--border-success" name="Border Success" />}
          code={`<div style={{ border: '1px solid var(--border-success)', padding: '1rem' }} />`}
        />
        <ExampleShowcase
          title="Border Disabled"
          headingLevel={3}
          description="Border color for disabled states."
          preview={<ColorSwatch colorVar="--border-disabled" name="Border Disabled" />}
          code={`<div style={{ border: '1px solid var(--border-disabled)', padding: '1rem' }} />`}
        />
      </ContentSection>

      <ContentSection title="Interactive Colors">
        <p>Colors used for interactive elements like buttons.</p>
        <ExampleShowcase
          title="Interactive Primary"
          headingLevel={3}
          description="Primary interactive element color."
          preview={<ColorSwatch colorVar="--interactive-primary" name="Interactive Primary" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-primary)', color: 'var(--text-inverse)', border: 'none', padding: '0.5rem 1rem' }}>Primary Action</button>`}
        />
        <ExampleShowcase
          title="Interactive Primary Hover"
          headingLevel={3}
          description="Primary interactive element color on hover."
          preview={<ColorSwatch colorVar="--interactive-primary-hover" name="Interactive Primary Hover" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-primary-hover)', color: 'var(--text-inverse)', border: 'none', padding: '0.5rem 1rem' }}>Primary Hover</button>`}
        />
        <ExampleShowcase
          title="Interactive Primary Pressed"
          headingLevel={3}
          description="Primary interactive element color when pressed."
          preview={<ColorSwatch colorVar="--interactive-primary-pressed" name="Interactive Primary Pressed" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-primary-pressed)', color: 'var(--text-inverse)', border: 'none', padding: '0.5rem 1rem' }}>Primary Pressed</button>`}
        />
        <ExampleShowcase
          title="Interactive Primary Disabled"
          headingLevel={3}
          description="Primary interactive element color for disabled states."
          preview={<ColorSwatch colorVar="--interactive-primary-disabled" name="Interactive Primary Disabled" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-primary-disabled)', color: 'var(--text-disabled)', border: 'none', padding: '0.5rem 1rem' }}>Primary Disabled</button>`}
        />
        <ExampleShowcase
          title="Interactive Secondary"
          headingLevel={3}
          description="Secondary interactive element color."
          preview={<ColorSwatch colorVar="--interactive-secondary" name="Interactive Secondary" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '0.5rem 1rem' }}>Secondary Action</button>`}
        />
        <ExampleShowcase
          title="Interactive Secondary Hover"
          headingLevel={3}
          description="Secondary interactive element color on hover."
          preview={<ColorSwatch colorVar="--interactive-secondary-hover" name="Interactive Secondary Hover" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-secondary-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-hover)', padding: '0.5rem 1rem' }}>Secondary Hover</button>`}
        />
        <ExampleShowcase
          title="Interactive Secondary Pressed"
          headingLevel={3}
          description="Secondary interactive element color when pressed."
          preview={<ColorSwatch colorVar="--interactive-secondary-pressed" name="Interactive Secondary Pressed" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-secondary-pressed)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '0.5rem 1rem' }}>Secondary Pressed</button>`}
        />
        <ExampleShowcase
          title="Interactive Secondary Disabled"
          headingLevel={3}
          description="Secondary interactive element color for disabled states."
          preview={<ColorSwatch colorVar="--interactive-secondary-disabled" name="Interactive Secondary Disabled" />}
          code={`<button style={{ backgroundColor: 'var(--interactive-secondary-disabled)', color: 'var(--text-disabled)', border: '1px solid var(--border-disabled)', padding: '0.5rem 1rem' }}>Secondary Disabled</button>`}
        />
      </ContentSection>

      <ContentSection title="Status Colors">
        <p>Colors used to communicate status and feedback.</p>
        <ExampleShowcase
          title="Status Error"
          headingLevel={3}
          description="Color for error status."
          preview={<ColorSwatch colorVar="--status-error" name="Status Error" />}
          code={`<div style={{ backgroundColor: 'var(--status-error)', color: 'var(--text-inverse)', padding: '0.5rem' }}>Error Status</div>`}
        />
        <ExampleShowcase
          title="Status Error Subtle"
          headingLevel={3}
          description="Subtle color for error status."
          preview={<ColorSwatch colorVar="--status-error-subtle" name="Status Error Subtle" />}
          code={`<div style={{ backgroundColor: 'var(--status-error-subtle)', color: 'var(--text-error)', padding: '0.5rem' }}>Subtle Error Status</div>`}
        />
        <ExampleShowcase
          title="Status Success"
          headingLevel={3}
          description="Color for success status."
          preview={<ColorSwatch colorVar="--status-success" name="Status Success" />}
          code={`<div style={{ backgroundColor: 'var(--status-success)', color: 'var(--text-inverse)', padding: '0.5rem' }}>Success Status</div>`}
        />
        <ExampleShowcase
          title="Status Success Subtle"
          headingLevel={3}
          description="Subtle color for success status."
          preview={<ColorSwatch colorVar="--status-success-subtle" name="Status Success Subtle" />}
          code={`<div style={{ backgroundColor: 'var(--status-success-subtle)', color: 'var(--text-success)', padding: '0.5rem' }}>Subtle Success Status</div>`}
        />
        <ExampleShowcase
          title="Status Warning"
          headingLevel={3}
          description="Color for warning status."
          preview={<ColorSwatch colorVar="--status-warning" name="Status Warning" />}
          code={`<div style={{ backgroundColor: 'var(--status-warning)', color: 'var(--text-primary)', padding: '0.5rem' }}>Warning Status</div>`}
        />
        <ExampleShowcase
          title="Status Warning Subtle"
          headingLevel={3}
          description="Subtle color for warning status."
          preview={<ColorSwatch colorVar="--status-warning-subtle" name="Status Warning Subtle" />}
          code={`<div style={{ backgroundColor: 'var(--status-warning-subtle)', color: 'var(--text-warning)', padding: '0.5rem' }}>Subtle Warning Status</div>`}
        />
        <ExampleShowcase
          title="Status Info"
          headingLevel={3}
          description="Color for informational status."
          preview={<ColorSwatch colorVar="--status-info" name="Status Info" />}
          code={`<div style={{ backgroundColor: 'var(--status-info)', color: 'var(--text-inverse)', padding: '0.5rem' }}>Info Status</div>`}
        />
        <ExampleShowcase
          title="Status Info Subtle"
          headingLevel={3}
          description="Subtle color for informational status."
          preview={<ColorSwatch colorVar="--status-info-subtle" name="Status Info Subtle" />}
          code={`<div style={{ backgroundColor: 'var(--status-info-subtle)', color: 'var(--text-primary)', padding: '0.5rem' }}>Subtle Info Status</div>`}
        />
      </ContentSection>

      <ContentSection title="Focus & Overlay">
        <p>Colors used for focus states and overlays.</p>
        <ExampleShowcase
          title="Focus Ring"
          headingLevel={3}
          description="Color for focus indicators."
          preview={<div style={{ width: '50px', height:'50px', boxShadow: `0 0 0 3px var(--focus-ring)`}} />}
          code={`<div style={{ boxShadow: '0 0 0 3px var(--focus-ring)' }} />`}
        />
        <ExampleShowcase
          title="Overlay Background"
          headingLevel={3}
          description="Background color for overlays."
          preview={<ColorSwatch colorVar="--overlay-background" name="Overlay Background" />}
          code={`<div style={{ backgroundColor: 'var(--overlay-background)', width: '100%', height: '50px' }} />`}
        />
        <ExampleShowcase
          title="Overlay Hover"
          headingLevel={3}
          description="Overlay color on hover."
          preview={<ColorSwatch colorVar="--overlay-hover" name="Overlay Hover" />}
          code={`<div style={{ backgroundColor: 'var(--overlay-hover)', width: '100%', height: '50px' }} />`}
        />
      </ContentSection>
      
      <ContentSection title="Primitive Color Scales">
        <p>These are the base color scales that power our semantic color system. They provide the foundation for building consistent color themes.</p>
        
        <ContentSection title="Brand Colors" headingLevel={3}>
            <p>Primary brand colors used for main UI elements and key interactions.</p>
            <PrimitiveColorRow scaleName="Brand" colorVarPrefix="--color-brand" />
        </ContentSection>

        <ContentSection title="Slate Colors" headingLevel={3}>
            <p>Cool gray tones for subtle backgrounds and secondary elements.</p>
            <PrimitiveColorRow scaleName="Slate" colorVarPrefix="--color-slate" />
        </ContentSection>

        <ContentSection title="Red Colors" headingLevel={3}>
            <p>Used for error states, destructive actions, and critical information.</p>
            <PrimitiveColorRow scaleName="Red" colorVarPrefix="--color-red" />
        </ContentSection>

        <ContentSection title="Yellow Colors" headingLevel={3}>
            <p>Used for warnings, pending states, and attention-grabbing elements.</p>
            <PrimitiveColorRow scaleName="Yellow" colorVarPrefix="--color-yellow" />
        </ContentSection>

        <ContentSection title="Green Colors" headingLevel={3}>
            <p>Used for success states, positive actions, and confirmations.</p>
            <PrimitiveColorRow scaleName="Green" colorVarPrefix="--color-green" />
        </ContentSection>

        <ContentSection title="Pink Colors" headingLevel={3}>
            <p>Used for highlighting, special features, and accent elements.</p>
            <PrimitiveColorRow scaleName="Pink" colorVarPrefix="--color-pink" />
        </ContentSection>

        <ContentSection title="Neutral Gray Colors" headingLevel={3}>
            <p>Used for text, borders, and neutral UI elements.</p>
            <PrimitiveColorRow scaleName="Gray" colorVarPrefix="--color-gray" />
        </ContentSection>

        <ContentSection title="White (Alpha) Colors" headingLevel={3}>
            <p>Semi-transparent white colors for overlays and subtle effects.</p>
            <PrimitiveColorRow scaleName="White Alpha" colorVarPrefix="--color-white" />
        </ContentSection>

        <ContentSection title="Black (Alpha) Colors" headingLevel={3}>
            <p>Semi-transparent black colors for shadows and depth.</p>
            <PrimitiveColorRow scaleName="Black Alpha" colorVarPrefix="--color-black" />
        </ContentSection>
      </ContentSection>

    </PageLayout>
  );
} 
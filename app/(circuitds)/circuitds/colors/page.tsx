'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

// Enhanced helper component to display a color swatch with hex values
const ColorSwatch = ({ 
  colorVar, 
  name, 
  hexValue, 
  description 
}: { 
  colorVar: string; 
  name: string; 
  hexValue?: string;
  description?: string;
}) => (
  <div className="flex items-center gap-4 p-3 border border-[var(--border-default)] rounded-lg">
    <div
      className="w-16 h-16 rounded-lg border border-[var(--border-default)] flex-shrink-0"
      style={{ backgroundColor: `var(${colorVar})` }}
    />
    <div className="flex-1">
      <div className="font-medium text-[var(--text-primary)]">{name}</div>
      <div className="text-sm text-[var(--text-secondary)] font-mono">{colorVar}</div>
      {hexValue && (
        <div className="text-sm text-[var(--text-tertiary)] font-mono">{hexValue}</div>
      )}
      {description && (
        <div className="text-xs text-[var(--text-secondary)] mt-1">{description}</div>
      )}
    </div>
  </div>
);

// Component for displaying color scales
const ColorScale = ({ 
  scaleName, 
  colors, 
  description 
}: { 
  scaleName: string; 
  colors: Array<{ name: string; var: string; hex: string; }>; 
  description: string;
}) => (
  <div className="space-y-4">
    <div>
      <h4 className="font-semibold text-[var(--text-primary)] mb-2">{scaleName}</h4>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {colors.map((color) => (
        <ColorSwatch
          key={color.var}
          colorVar={color.var}
          name={color.name}
          hexValue={color.hex}
        />
      ))}
    </div>
  </div>
  );

export default function ColorsPage() {
  return (
    <PageLayout
      title="Colors"
      description="Our color system provides a comprehensive palette for building consistent and accessible interfaces. Each color is available as a CSS custom property with corresponding hex values for design tools."
    >
      <ContentSection title="Circuit Brand Colors">
        <p className="body-medium">
          The core brand colors that define the Circuit design system's visual identity. These colors were designed to work harmoniously together and provide excellent contrast ratios.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorSwatch 
            colorVar="--circuit-dark-teal" 
            name="Circuit Dark Teal" 
            hexValue="#1a4a47"
            description="Primary brand color, used for main backgrounds and emphasis"
          />
          <ColorSwatch 
            colorVar="--circuit-mid-teal" 
            name="Circuit Mid Teal" 
            hexValue="#2d6a65"
            description="Surface backgrounds and secondary elements"
          />
          <ColorSwatch 
            colorVar="--circuit-light-teal" 
            name="Circuit Light Teal" 
            hexValue="#4a9b94"
            description="Borders, dividers, and subtle accents"
          />
          <ColorSwatch 
            colorVar="--circuit-bright-teal" 
            name="Circuit Bright Teal" 
            hexValue="#5dbfb7"
            description="Hover states and interactive highlights"
          />
          <ColorSwatch 
            colorVar="--circuit-bright-yellow" 
            name="Circuit Bright Yellow" 
            hexValue="#ffcf60"
            description="Primary action color and key interactions"
          />
          <ColorSwatch 
            colorVar="--circuit-light-yellow" 
            name="Circuit Light Yellow" 
            hexValue="#fff2d1"
            description="Primary text color and subtle highlights"
          />
          <ColorSwatch 
            colorVar="--circuit-magenta" 
            name="Circuit Magenta" 
            hexValue="#e91e63"
            description="Secondary action color and accent elements"
          />
          <ColorSwatch 
            colorVar="--circuit-darker-teal" 
            name="Circuit Darker Teal" 
            hexValue="#0f2b29"
            description="Deep backgrounds and inverse text"
          />
        </div>
      </ContentSection>
      
      <ContentSection title="Semantic Colors">
        <p className="body-medium">
          Semantic colors provide meaning and context throughout the interface. They adapt to themes while maintaining consistent purpose and accessibility.
        </p>

        <ContentSection title="Core Semantics" headingLevel={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch 
              colorVar="--background" 
              name="Background" 
              hexValue="#1a4a47"
              description="Main page background color"
            />
            <ColorSwatch 
              colorVar="--foreground" 
              name="Foreground" 
              hexValue="#fff2d1"
              description="Primary text and content color"
            />
          </div>
        </ContentSection>

        <ContentSection title="Surface Colors" headingLevel={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorSwatch 
              colorVar="--surface-background" 
              name="Surface Background" 
              hexValue="#2d6a65"
              description="Cards, panels, and elevated surfaces"
            />
            <ColorSwatch 
              colorVar="--surface-background-hover" 
              name="Surface Hover" 
              hexValue="#4a9b94"
              description="Surface hover states"
            />
            <ColorSwatch 
              colorVar="--surface-background-pressed" 
              name="Surface Pressed" 
              hexValue="#1a4a47"
              description="Surface active/pressed states"
            />
            <ColorSwatch 
              colorVar="--surface-background-emphasis" 
              name="Surface Emphasis" 
              hexValue="#fff2d1"
              description="Emphasized surface backgrounds"
            />
          </div>
      </ContentSection>

        <ContentSection title="Text Colors" headingLevel={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorSwatch 
              colorVar="--text-primary" 
              name="Text Primary" 
              hexValue="#fff2d1"
              description="Main body text and headings"
            />
            <ColorSwatch 
              colorVar="--text-secondary" 
              name="Text Secondary" 
              hexValue="#fff2d1"
              description="Supporting text and labels"
            />
            <ColorSwatch 
              colorVar="--text-inverse" 
              name="Text Inverse" 
              hexValue="#1a4a47"
              description="Text on light backgrounds"
            />
            <ColorSwatch 
              colorVar="--text-brand" 
              name="Text Brand" 
              hexValue="#ffcf60"
              description="Brand-colored text and highlights"
            />
          </div>
      </ContentSection>

        <ContentSection title="Interactive Colors" headingLevel={3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorSwatch 
              colorVar="--interactive-primary" 
              name="Interactive Primary" 
              hexValue="#ffcf60"
              description="Primary buttons and main actions"
            />
            <ColorSwatch 
              colorVar="--interactive-primary-hover" 
              name="Primary Hover" 
              hexValue="#ffdc73"
              description="Primary button hover state"
            />
            <ColorSwatch 
              colorVar="--interactive-secondary" 
              name="Interactive Secondary" 
              hexValue="#e91e63"
              description="Secondary actions and accents"
            />
            <ColorSwatch 
              colorVar="--interactive-secondary-hover" 
              name="Secondary Hover" 
              hexValue="#f04fa8"
              description="Secondary button hover state"
            />
          </div>
        </ContentSection>
      </ContentSection>

      <ContentSection title="Status Colors">
        <p className="body-medium">
          Status colors communicate different states and feedback to users. Each status color includes both solid and subtle variants for flexible usage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ColorSwatch 
            colorVar="--status-error" 
            name="Error" 
            hexValue="#e74c3c"
            description="Error states and destructive actions"
          />
          <ColorSwatch 
            colorVar="--status-success" 
            name="Success" 
            hexValue="#2ecc71"
            description="Success states and confirmations"
          />
          <ColorSwatch 
            colorVar="--status-warning" 
            name="Warning" 
            hexValue="#ffcf60"
            description="Warning states and cautions"
          />
          <ColorSwatch 
            colorVar="--status-info" 
            name="Info" 
            hexValue="#4a9b94"
            description="Informational states and tips"
          />
        </div>
      </ContentSection>

      <ContentSection title="Supplementary Color Scales">
        <p className="body-medium">
          Extended color scales provide additional options for data visualization, complex interfaces, and creative applications. Each scale includes multiple shades for versatile usage.
        </p>

        <div className="space-y-8">
          <ColorScale
            scaleName="Blue Scale"
            description="Information states, links, and cool accents. Perfect for conveying trust and stability."
            colors={[
              { name: "Blue 100", var: "--color-blue-100", hex: "#e8f4ff" },
              { name: "Blue 300", var: "--color-blue-300", hex: "#93c5ff" },
              { name: "Blue 500", var: "--color-blue-500", hex: "#3286f5" },
              { name: "Blue 700", var: "--color-blue-700", hex: "#1e5daf" },
            ]}
          />

          <ColorScale
            scaleName="Purple Scale"
            description="Creative accents, premium features, and secondary branding elements."
            colors={[
              { name: "Purple 100", var: "--color-purple-100", hex: "#f5ebff" },
              { name: "Purple 300", var: "--color-purple-300", hex: "#c199ff" },
              { name: "Purple 500", var: "--color-purple-500", hex: "#8c51f5" },
              { name: "Purple 700", var: "--color-purple-700", hex: "#6636b6" },
            ]}
          />

          <ColorScale
            scaleName="Orange Scale"
            description="Warning states, attention-grabbing elements, and energetic accents."
            colors={[
              { name: "Orange 100", var: "--color-orange-100", hex: "#fff2e7" },
              { name: "Orange 300", var: "--color-orange-300", hex: "#ffb681" },
              { name: "Orange 500", var: "--color-orange-500", hex: "#f67e22" },
              { name: "Orange 700", var: "--color-orange-700", hex: "#c15009" },
            ]}
          />

          <ColorScale
            scaleName="Semantic Reds"
            description="Error states, destructive actions, and critical alerts."
            colors={[
              { name: "Red 100", var: "--color-red-100", hex: "#ffeaea" },
              { name: "Red 300", var: "--color-red-300", hex: "#ffb3ba" },
              { name: "Red 500", var: "--color-red-500", hex: "#e74c3c" },
              { name: "Red 600", var: "--color-red-600", hex: "#c0392b" },
            ]}
          />

          <ColorScale
            scaleName="Semantic Greens"
            description="Success states, positive actions, and confirmation feedback."
            colors={[
              { name: "Green 100", var: "--color-green-100", hex: "#ebffef" },
              { name: "Green 300", var: "--color-green-300", hex: "#aff4c6" },
              { name: "Green 500", var: "--color-green-500", hex: "#14ae5c" },
              { name: "Green 700", var: "--color-green-700", hex: "#008043" },
            ]}
          />

          <ColorScale
            scaleName="Semantic Yellows"
            description="Warning states, pending actions, and attention indicators."
            colors={[
              { name: "Yellow 100", var: "--color-yellow-100", hex: "#fffbeb" },
              { name: "Yellow 300", var: "--color-yellow-300", hex: "#ffe8a3" },
              { name: "Yellow 500", var: "--color-yellow-500", hex: "#e6a000" },
              { name: "Yellow 600", var: "--color-yellow-600", hex: "#bf6a02" },
            ]}
          />
        </div>
      </ContentSection>

      <ContentSection title="Alpha Colors">
        <p className="body-medium">
          Semi-transparent colors for overlays, shadows, and subtle effects. Available in both white and black variations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">White Alpha Scale</h4>
            <div className="space-y-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((shade) => (
                <div key={shade} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border border-[var(--border-default)]"
                    style={{ backgroundColor: `var(--color-white-${shade})` }}
                  />
                  <div className="text-sm">
                    <span className="font-mono">--color-white-{shade}</span>
                    <span className="text-[var(--text-secondary)] ml-2">
                      Alpha {(shade / 10).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text-primary)] mb-4">Black Alpha Scale</h4>
            <div className="space-y-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((shade) => (
                <div key={shade} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border border-[var(--border-default)]"
                    style={{ backgroundColor: `var(--color-black-${shade})` }}
                  />
                  <div className="text-sm">
                    <span className="font-mono">--color-black-{shade}</span>
                    <span className="text-[var(--text-secondary)] ml-2">
                      Alpha {(shade / 10).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentSection>
      
      <ContentSection title="Usage Guidelines">
        <div className="space-y-6">
          <div className="p-4 bg-[var(--status-info-subtle)] border border-[var(--color-blue-300)] rounded-lg">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Accessibility</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• All color combinations meet WCAG 2.1 AA contrast requirements</li>
              <li>• Text colors provide at least 4.5:1 contrast ratio against their backgrounds</li>
              <li>• Interactive elements have sufficient color contrast in all states</li>
              <li>• Never rely on color alone to convey important information</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--status-warning-subtle)] border border-[var(--color-orange-300)] rounded-lg">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Implementation</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Use CSS custom properties (variables) instead of hard-coded hex values</li>
              <li>• Semantic tokens adapt automatically when themes change</li>
              <li>• Primitive colors remain consistent across all themes</li>
              <li>• Always test color combinations in both light and dark contexts</li>
            </ul>
          </div>

          <div className="p-4 bg-[var(--status-success-subtle)] border border-[var(--color-green-300)] rounded-lg">
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Design Tokens</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• All colors are available as design tokens for Figma import</li>
              <li>• Hex values provided for design tools and documentation</li>
              <li>• CSS variables ensure consistency between design and code</li>
              <li>• Token names follow a consistent semantic hierarchy</li>
            </ul>
          </div>
        </div>
      </ContentSection>
    </PageLayout>
  );
} 
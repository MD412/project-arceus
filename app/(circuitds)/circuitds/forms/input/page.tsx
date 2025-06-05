'use client';

import React, { useState } from 'react';
import { Input } from '@/components/forms'; // Using the Input from this project
import type { InputProps } from '@/components/forms'; // Import props type
import CodeBlock from '../../components/CodeBlock'; // Corrected relative path

// Helper component to manage state for individual examples
const InputExample: React.FC<InputProps & { exampleTitle: string, initialValue?: string, codeSnippet: string }> = (
  { exampleTitle, initialValue = '', codeSnippet, ...inputProps }
) => {
  const [value, setValue] = useState(initialValue);

  const sectionStyle: React.CSSProperties = {
    marginBottom: 'var(--sds-size-space-800, 32px)',
    paddingBottom: 'var(--sds-size-space-600, 24px)',
    borderBottom: '1px solid var(--border-subtle, #444)'
  };
  const h3Style: React.CSSProperties = {
    font: 'var(--font-subheading)', 
    color: 'var(--text-secondary)',
    marginBottom: 'var(--sds-size-space-300, 12px)'
  };
  const previewStyle: React.CSSProperties = {
    padding: 'var(--sds-size-space-400, 16px)',
    marginBottom: 'var(--sds-size-space-300, 12px)',
    borderRadius: 'var(--sds-size-radius-100, 4px)',
    border: '1px dashed var(--border-default, #ccc)'
  };

  return (
    <section style={sectionStyle}>
      <h3 style={h3Style}>{exampleTitle}</h3>
      <div style={previewStyle}>
        <Input
          {...inputProps}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <CodeBlock code={codeSnippet.trim()} />
    </section>
  );
};

export default function InputDocumentationPage() {
  const pageTitleStyle: React.CSSProperties = {
    font: 'var(--font-title-page)', 
    color: 'var(--text-heading-strong)', 
    marginBottom: 'var(--sds-size-space-200, 8px)'
  };
  const pageDescriptionStyle: React.CSSProperties = {
    font: 'var(--font-body-base)', 
    color: 'var(--text-secondary)', 
    maxWidth: '75ch', 
    marginBottom: 'var(--sds-size-space-800, 32px)'
  };

  return (
    <article>
      <header>
        <h1 style={pageTitleStyle}>Input Component</h1>
        <p style={pageDescriptionStyle}>
          The Input component provides a versatile text input field with support for labels, 
          help text, error states, and various HTML input attributes. It is built using 
          React.forwardRef for easy integration with form libraries and direct DOM access.
        </p>
      </header>

      <InputExample
        exampleTitle="Basic Input"
        label="Card Name"
        name="cardNameBasic"
        placeholder="Enter card name"
        codeSnippet={`
<Input
  label="Card Name"
  name="cardNameBasic"
  placeholder="Enter card name"
/>
        `}
      />

      <InputExample
        exampleTitle="Input with Placeholder Only"
        name="placeholderOnly"
        placeholder="Search for a specific card..."
        codeSnippet={`
<Input
  name="placeholderOnly"
  placeholder="Search for a specific card..."
/>
        `}
      />

      <InputExample
        exampleTitle="Required Input"
        label="Player Name"
        name="playerNameRequired"
        placeholder="Enter your name"
        required
        helpText="This field is required."
        codeSnippet={`
<Input
  label="Player Name"
  name="playerNameRequired"
  placeholder="Enter your name"
  required
  helpText="This field is required."
/>
        `}
      />

      <InputExample
        exampleTitle="Input with Help Text"
        label="Email Address"
        name="emailHelp"
        type="email"
        placeholder="your.email@example.com"
        helpText="We'll never share your email with anyone else."
        codeSnippet={`
<Input
  label="Email Address"
  name="emailHelp"
  type="email"
  placeholder="your.email@example.com"
  helpText="We'll never share your email with anyone else."
/>
        `}
      />

      <InputExample
        exampleTitle="Input with Error State"
        label="Password"
        name="passwordError"
        type="password"
        placeholder="Enter your password"
        error="Password must be at least 8 characters."
        initialValue="short"
        codeSnippet={`
<Input
  label="Password"
  name="passwordError"
  type="password"
  placeholder="Enter your password"
  error="Password must be at least 8 characters."
  defaultValue="short" // Use defaultValue for uncontrolled initial value in examples
/>
        `}
      />

      <InputExample
        exampleTitle="Number Input"
        label="Quantity"
        name="quantityNumber"
        type="number"
        defaultValue="1"
        min="0"
        codeSnippet={`
<Input
  label="Quantity"
  name="quantityNumber"
  type="number"
  defaultValue="1"
  min="0"
/>
        `}
      />

      {/* Add more examples as needed: different types, disabled, readonly, etc. */}

    </article>
  );
} 
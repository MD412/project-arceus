'use client'; // Can be a client component if you need interactivity, or server if static

import React from 'react';
import Link from 'next/link';

export default function CircuitDSHomePage() {
  return (
    <article>
      <header style={{ marginBottom: 'var(--sds-size-space-800, 32px)' }}>
        <h1 style={{ font: 'var(--font-title-page)', color: 'var(--text-heading-strong)', marginBottom: 'var(--sds-size-space-200)' }}>
          Circuit Design System
        </h1>
        <p style={{ font: 'var(--font-body-base)', color: 'var(--text-secondary)', maxWidth: '65ch' }}>
          Welcome to the Circuit Design System documentation. This site provides live examples and usage guidelines 
          for all components within this project, ensuring consistency and accelerating development.
        </p>
      </header>

      <section>
        <h2 style={{ font: 'var(--font-heading)', color: 'var(--text-heading-strong)', marginBottom: 'var(--sds-size-space-400)' }}>
          Getting Started
        </h2>
        <p style={{ font: 'var(--font-body-base)', color: 'var(--text-primary)', marginBottom: 'var(--sds-size-space-200)' }}>
          Explore the component documentation using the sidebar navigation. Each component page includes:
        </p>
        <ul style={{ font: 'var(--font-body-base)', color: 'var(--text-primary)', paddingLeft: 'var(--sds-size-space-600)', marginBottom: 'var(--sds-size-space-600)' }}>
          <li>Live interactive examples of the component.</li>
          <li>Code snippets for easy integration.</li>
          <li>Guidelines on props and usage best practices.</li>
        </ul>
        <p style={{ font: 'var(--font-body-base)', color: 'var(--text-primary)' }}>
          Currently, the first component documented is the <Link href="/circuitds/forms/input" style={{ color: 'var(--text-brand)', textDecoration: 'underline' }}>Input</Link> component.
        </p>
      </section>
      
      {/* You can add more sections here, like Principles, Theming Info, etc. */}
    </article>
  );
} 
'use client'; // Keep as client component if you plan to add copy-to-clipboard button later

import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string; // e.g., 'tsx', 'jsx', 'html', 'css'
}

export default function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  const preStyle: React.CSSProperties = {
    background: 'var(--surface-background-muted, #222)', // Use a muted background from your theme
    color: 'var(--text-secondary, #ddd)', // Ensure good contrast for code
    padding: 'var(--sds-size-space-400, 16px)',
    borderRadius: 'var(--sds-size-radius-100, 4px)',
    overflowX: 'auto',
    fontSize: 'var(--font-body-code, 14px)'.split(' ')[1], // Extract font size for pre/code
    fontFamily: 'var(--font-family-mono, monospace)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap', // Or 'pre' if you don't want wrapping
  };

  const codeStyle: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
  };

  // Basic syntax highlighting for demonstration (can be expanded with a library)
  const highlightedCode = code
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    // Add more complex regex for TSX/JS keywords, strings, comments for better highlighting if not using a library

  return (
    <pre style={preStyle}>
      <code style={codeStyle} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
} 
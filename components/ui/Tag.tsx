import React from 'react';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  className?: string;
}

export default function Tag({ 
  children, 
  variant = 'default', 
  size = 'medium',
  className = ''
}: TagProps) {
  const baseClasses = `circuit-tag circuit-tag--${variant} circuit-tag--${size}`;
  const classes = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <span className={classes}>
      {children}
    </span>
  );
} 
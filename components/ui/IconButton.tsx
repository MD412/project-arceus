'use client';

import React from 'react';

interface IconButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

function IconButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const baseClasses = 'icon-button_base';
  const variantClasses = `icon-button_${variant}`;
  const sizeClasses = `icon-button_${size}`;
  
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default IconButton; 
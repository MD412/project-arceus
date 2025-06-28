'use client';

import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
  onItemClick?: (item: DropdownItem) => void;
}

export function Dropdown({ 
  trigger, 
  items, 
  className, 
  align = 'left',
  onItemClick 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    
    setIsOpen(false);
    onItemClick?.(item);
  };

  return (
    <div ref={dropdownRef} className={clsx('dropdown', className)}>
      <div 
        className="dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div className={clsx('dropdown-menu', `dropdown-menu--${align}`)}>
          <ul className="dropdown-list" role="menu">
            {items.map((item, index) => (
              <li key={`${item.href}-${index}`} role="none">
                <a
                  href={item.href}
                  className={clsx('dropdown-item', {
                    'dropdown-item--disabled': item.disabled
                  })}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  tabIndex={item.disabled ? -1 : 0}
                  role="menuitem"
                  aria-disabled={item.disabled}
                >
                  {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                  <span className="dropdown-item-label">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
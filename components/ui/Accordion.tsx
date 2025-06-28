'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean; // Allow multiple sections open at once
  className?: string;
  variant?: 'default' | 'bordered' | 'minimal';
}

export function Accordion({ 
  items, 
  allowMultiple = false, 
  className,
  variant = 'default'
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    return new Set(items.filter(item => item.defaultOpen).map(item => item.id));
  });

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(itemId)) {
        // Close this item
        newSet.delete(itemId);
      } else {
        // Open this item
        if (!allowMultiple) {
          // Close all other items first
          newSet.clear();
        }
        newSet.add(itemId);
      }
      
      return newSet;
    });
  };

  return (
    <div className={clsx('accordion', `accordion--${variant}`, className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        
        return (
          <div 
            key={item.id} 
            className={clsx('accordion-item', {
              'accordion-item--open': isOpen,
              'accordion-item--disabled': item.disabled
            })}
          >
            <button
              className="accordion-trigger"
              onClick={() => !item.disabled && toggleItem(item.id)}
              aria-expanded={isOpen}
              aria-disabled={item.disabled}
              disabled={item.disabled}
            >
              <span className="accordion-title">{item.title}</span>
              <span className={clsx('accordion-icon', {
                'accordion-icon--rotated': isOpen
              })}>
                ▼
              </span>
            </button>
            
            <div 
              className={clsx('accordion-content', {
                'accordion-content--open': isOpen
              })}
              aria-hidden={!isOpen}
            >
              <div className="accordion-content-inner">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 
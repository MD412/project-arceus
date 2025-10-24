'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X, MoreVertical } from 'lucide-react';
import { Dropdown, type DropdownItem } from './Dropdown';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  /** Render as inline panel instead of overlay modal */
  inline?: boolean;
  /** Custom menu items for the three-dot menu */
  menuItems?: DropdownItem[];
  /** Handler for menu item clicks */
  onMenuItemClick?: (item: DropdownItem) => void;
}

/**
 * BaseModal - Foundation modal component
 * 
 * Provides:
 * - Overlay modal with backdrop (default)
 * - Inline panel mode (when inline=true)
 * - Optional header with close/back button
 * - Content area (children)
 * 
 * Use this directly for simple modals, or wrap it for specialized modals
 * like CardDetailModal or CardCorrectionModal.
 */
export function BaseModal({ 
  isOpen, 
  onClose, 
  children, 
  className = '', 
  title, 
  showCloseButton = true,
  inline = false,
  menuItems = [
    { label: 'Delete', href: '/delete' },
    { label: 'Change', href: '/change' }
  ],
  onMenuItemClick
}: BaseModalProps) {
  if (!isOpen) return null;

  // Inline panel mode - renders directly in place
  if (inline) {
    return (
      <div className="modal-backdrop-inline" onClick={onClose}>
        <div className={`modal-panel ${className}`} onClick={(e) => e.stopPropagation()}>
        {/* Optional Header */}
        {(title || showCloseButton) && (
          <header className="modal-header">
            <div className="modal-header-content">
              {title && (
                <div className="modal-title">
                  {typeof title === 'string' ? <h2>{title}</h2> : title}
                </div>
              )}
              <div className="modal-actions">
                <div className="modal-actions-wrapper">
                  <Dropdown
                    trigger={
                      <button className="modal-menu" aria-label="More options">
                        <MoreVertical size={20} />
                      </button>
                    }
                    items={menuItems}
                    align="right"
                    onItemClick={onMenuItemClick}
                  />
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="modal-close"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}
        
        {/* Content */}
        {children}
        </div>
      </div>
    );
  }

  // SSR guard - portals only work client-side
  if (typeof document === 'undefined') return null;

  // Overlay modal mode - renders as portal with backdrop
  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="modal-container">
        <div className={`modal-content ${className}`} onClick={(e) => e.stopPropagation()}>
          {/* Optional Header */}
          {(title || showCloseButton) && (
            <header className="modal-header">
              <div className="modal-header-content">
                {title && (
                  <div className="modal-title">
                    {typeof title === 'string' ? <h2>{title}</h2> : title}
                  </div>
                )}
                <div className="modal-actions">
                  <Dropdown
                    trigger={
                      <button className="modal-menu" aria-label="More options">
                        <MoreVertical size={20} />
                      </button>
                    }
                    items={menuItems}
                    align="right"
                    onItemClick={onMenuItemClick}
                  />
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="modal-close"
                      aria-label="Close modal"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>
              </div>
            </header>
          )}
          
          {/* Content */}
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}



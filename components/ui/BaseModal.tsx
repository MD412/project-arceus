'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  /** Render as inline panel instead of overlay modal */
  inline?: boolean;
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
  inline = false
}: BaseModalProps) {
  if (!isOpen) return null;

  // Inline panel mode - renders directly in place
  if (inline) {
    return (
      <div className={`modal-panel ${className}`}>
        {/* Optional Header */}
        {(title || showCloseButton) && (
          <header className="modal-header">
            {showCloseButton && (
              <button
                onClick={onClose}
                className="modal-back"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {title && (
              <div className="modal-title">
                {typeof title === 'string' ? <h2>{title}</h2> : title}
              </div>
            )}
          </header>
        )}
        
        {/* Content */}
        {children}
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
        <div className={`modal-content ${className}`}>
          {/* Optional Header */}
          {(title || showCloseButton) && (
            <header className="modal-header">
              {title && (
                <div className="modal-title">
                  {typeof title === 'string' ? <h2>{title}</h2> : title}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="modal-close"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              )}
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



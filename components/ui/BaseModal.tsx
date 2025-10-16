'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  showCloseButton?: boolean;
}

/**
 * BaseModal - Foundation modal component
 * 
 * Provides:
 * - Portal rendering
 * - Backdrop with click-to-close
 * - Optional header with close button
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
  showCloseButton = true
}: BaseModalProps) {
  if (!isOpen) return null;

  // SSR guard - portals only work client-side
  if (typeof document === 'undefined') return null;

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



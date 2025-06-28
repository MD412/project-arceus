'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className = '' }: ModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="modal-container">
        <div className={`modal-content ${className}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          {children}
        </div>
      </div>
    </>
  );
}

// Specialized component for card info
interface CardInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    name: string;
    imageUrl: string;
    number?: string;
    setCode?: string;
    setName?: string;
    description?: string;
    // Add more fields as needed
  };
}

export function CardInfoModal({ isOpen, onClose, card }: CardInfoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-card-info">
      <div className="card-info-layout">
        {/* Left side - Large card image */}
        <div className="card-info-image">
          {card.imageUrl && card.imageUrl.trim() !== '' ? (
            <img 
              src={card.imageUrl} 
              alt={card.name}
              className="card-image-full"
            />
          ) : (
            <div className="card-image-full card-image-placeholder">
              <span>No Image Available</span>
            </div>
          )}
        </div>
        
        {/* Right side - Card details */}
        <div className="card-info-details">
          <header className="card-info-header">
            <h2 className="card-info-title">{card.name}</h2>
            <p className="card-info-meta">
              {card.number && <span>#{card.number}</span>}
              {card.setCode && <span> • {card.setCode}</span>}
            </p>
          </header>
          
          <div className="card-info-content">
            {card.setName && (
              <div className="info-section">
                <h3>Set</h3>
                <p>{card.setName}</p>
              </div>
            )}
            
            {card.description && (
              <div className="info-section">
                <h3>Description</h3>
                <p>{card.description}</p>
              </div>
            )}
            
            {/* Add more sections as needed */}
            <div className="info-section">
              <h3>Market Value</h3>
              <p className="text-2xl font-bold">$24.99</p>
            </div>
            
            <div className="info-section">
              <h3>Actions</h3>
              <div className="action-buttons">
                <button className="btn btn--primary">Edit Details</button>
                <button className="btn btn--secondary">View Prices</button>
                <button className="btn btn--danger">Remove from Collection</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
} 
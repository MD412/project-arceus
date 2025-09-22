'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import { updateCardQuantity } from '@/services/cards';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { type Card as SearchResultCard } from '@/hooks/useCardSearch';
import { replaceUserCard } from '@/services/cards';

interface Card {
  id?: string; // user_cards id for updates
  name: string;
  imageUrl?: string;
  number: string;
  setCode: string;
  setName: string;
  quantity?: number;
  condition?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: Card;
  className?: string;
  onDeleteCard?: (cardId: string) => Promise<void>;
  children?: React.ReactNode;
  onReplaced?: (updated: {
    name: string;
    imageUrl: string;
    number: string;
    setCode: string;
    setName: string;
  }) => void;
}

export function Modal({ isOpen, onClose, card, className = '', onDeleteCard, children, onReplaced }: ModalProps) {
  const [localQuantity, setLocalQuantity] = React.useState(card?.quantity || 1);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isReplaceMode, setIsReplaceMode] = React.useState(false);
  const [isReplacing, setIsReplacing] = React.useState(false);
  const [displayCard, setDisplayCard] = React.useState(card);

  // Update local quantity when card changes
  React.useEffect(() => {
    setLocalQuantity(card?.quantity || 1);
  }, [card?.quantity]);

  // Keep a local copy we can optimistically update when replacing
  React.useEffect(() => {
    setDisplayCard(card);
  }, [card]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!card?.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateCardQuantity(card.id, newQuantity);
      setLocalQuantity(newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // Revert local state on error
      setLocalQuantity(card.quantity || 1);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  // Use portal to render modal outside the normal DOM hierarchy
  // This prevents stacking context issues with parent elements
  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="modal-container">
        <div className={`modal-content ${displayCard ? 'modal-card-info' : ''} ${className}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          
          {displayCard ? (
            <div className="card-info-layout">
            {/* Left side - Large card image */}
            <div className="card-info-image">
              {(() => {
                // Construct image URL from card data if not provided
                const imageUrl = displayCard?.imageUrl && displayCard.imageUrl.trim() !== '' 
                  ? displayCard.imageUrl 
                  : `https://images.pokemontcg.io/${displayCard?.setCode}/${displayCard?.number}.png`;
                
                return (
                  <img 
                    src={imageUrl}
                    alt={displayCard?.name || 'Card'}
                    className="card-image-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('card-image-placeholder');
                    }}
                  />
                );
              })()}
            </div>
            
            {/* Right side - Card details */}
            <div className="card-info-details">
              <div className="card-info-header">
                <h2 className="card-info-title">{displayCard?.name}</h2>
                <p className="card-info-meta">#{displayCard?.number} • {displayCard?.setCode}</p>
              </div>
              
              <div className="card-info-content">
                {isReplaceMode ? (
                  <div className="info-section replace-panel">
                    <h3>Replace Card</h3>
                    <CardSearchInput
                      placeholder="Search by name or number…"
                      onSelect={async (c: SearchResultCard) => {
                        if (!card?.id) return;
                        setIsReplacing(true);
                        try {
                          await replaceUserCard(card.id!, { id: c.id, set_code: c.set_code, card_number: c.card_number });
                          setDisplayCard({
                            id: card.id,
                            name: c.name,
                            imageUrl: c.image_url || '',
                            number: c.card_number,
                            setCode: c.set_code,
                            setName: c.set_name,
                            quantity: localQuantity,
                            condition: card?.condition,
                          });
                          onReplaced?.({
                            name: c.name,
                            imageUrl: c.image_url || '',
                            number: c.card_number,
                            setCode: c.set_code,
                            setName: c.set_name,
                          });
                          setIsReplaceMode(false);
                        } catch (err) {
                          console.error('Failed to replace card:', err);
                        } finally {
                          setIsReplacing(false);
                        }
                      }}
                    />
                    <div className="replace-actions">
                      <Button variant="ghost" size="sm" onClick={() => setIsReplaceMode(false)} disabled={isReplacing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Market Value Section */}
                    <div className="info-section">
                      <h3>Market Value</h3>
                      <p>$24.99</p>
                    </div>
                    
                    {/* Collection Details Section */}
                    <div className="info-section">
                      <h3>Collection Details</h3>
                      <div className="collection-details">
                        <div className="detail-item">
                          <span className="detail-label">Quantity:</span>
                          <span className="detail-value">{localQuantity}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Condition:</span>
                          <span className="detail-value">{displayCard?.condition || 'Near Mint'}</span>
                        </div>
                      </div>
                      
                      <div className="quantity-controls">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => {
                            const newQuantity = Math.max(1, localQuantity - 1);
                            handleQuantityChange(newQuantity);
                          }}
                        >
                          -
                        </Button>
                        <span className="quantity-display">{localQuantity}</span>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => {
                            const newQuantity = localQuantity + 1;
                            handleQuantityChange(newQuantity);
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    {/* Actions Section */}
                    <div className="info-section">
                      <h3>Actions</h3>
                      <div className="action-buttons">
                        <Button variant="secondary" size="sm">View Prices</Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsReplaceMode(true)}>
                          Replace Card
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isDeleting || !card?.id}
                          onClick={async () => {
                            if (!card?.id || !onDeleteCard) return;
                            
                            setIsDeleting(true);
                            try {
                              await onDeleteCard(card.id);
                              onClose(); // Close modal after successful deletion
                            } catch (error) {
                              console.error('Failed to delete card:', error);
                              // Error handling is done by the parent component
                            } finally {
                              setIsDeleting(false);
                            }
                          }}
                        >
                          {isDeleting ? 'Removing...' : 'Remove from Collection'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          children
        )}
        </div>
      </div>
    </>,
    document.body
  );
} 
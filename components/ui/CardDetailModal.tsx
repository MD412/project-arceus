'use client';

import * as React from 'react';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { CardSearchInput } from './CardSearchInput';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { type Card as SearchResultCard } from '@/hooks/useCardSearch';
import { updateCardQuantity, replaceUserCard } from '@/services/cards';

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string;
    name: string;
    imageUrl?: string;
    number: string;
    setCode: string;
    setName: string;
    quantity?: number;
    condition?: string;
    rawCropUrl?: string;
  };
  onDeleteCard?: (cardId: string) => Promise<void>;
  onReplaced?: (updated: {
    name: string;
    imageUrl: string;
    number: string;
    setCode: string;
    setName: string;
  }) => void;
}

/**
 * CardDetailModal - Display and manage a card in your collection
 * 
 * Features:
 * - Large card image preview
 * - Market value display
 * - Quantity management (+/-)
 * - Condition display
 * - Replace card functionality
 * - Remove from collection
 * - Optional scan provenance (rawCropUrl)
 */
export function CardDetailModal({ 
  isOpen, 
  onClose, 
  card,
  onDeleteCard,
  onReplaced
}: CardDetailModalProps) {
  const [localQuantity, setLocalQuantity] = React.useState(card.quantity || 1);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isReplaceMode, setIsReplaceMode] = React.useState(false);
  const [isReplacing, setIsReplacing] = React.useState(false);
  const [displayCard, setDisplayCard] = React.useState(card);

  // Update local quantity when card changes
  React.useEffect(() => {
    setLocalQuantity(card.quantity || 1);
    setDisplayCard(card);
  }, [card]);

  const handleQuantityChange = async (newQuantity: number) => {
    if (!card.id || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateCardQuantity(card.id, newQuantity);
      setLocalQuantity(newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setLocalQuantity(card.quantity || 1);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReplace = async (newCard: SearchResultCard) => {
    if (!card.id) return;
    setIsReplacing(true);
    try {
      await replaceUserCard(card.id, { 
        id: newCard.id, 
        set_code: newCard.set_code, 
        card_number: newCard.card_number 
      });
      
      const updated = {
        id: card.id,
        name: newCard.name,
        imageUrl: newCard.image_url || '',
        number: newCard.card_number,
        setCode: newCard.set_code,
        setName: newCard.set_name,
        quantity: localQuantity,
        condition: card.condition,
      };
      
      setDisplayCard(updated);
      onReplaced?.({
        name: newCard.name,
        imageUrl: newCard.image_url || '',
        number: newCard.card_number,
        setCode: newCard.set_code,
        setName: newCard.set_name,
      });
      setIsReplaceMode(false);
    } catch (err) {
      console.error('Failed to replace card:', err);
    } finally {
      setIsReplacing(false);
    }
  };

  const imageUrl = displayCard.imageUrl && displayCard.imageUrl.trim() !== '' 
    ? displayCard.imageUrl 
    : `https://images.pokemontcg.io/${displayCard.setCode}/${displayCard.number}.png`;

  const title = (
    <>
      <h2 className="card-detail-modal__title">{displayCard.name}</h2>
      <p className="card-detail-modal__meta">#{displayCard.number} • {displayCard.setName}</p>
    </>
  );

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      className="card-detail-modal"
      title={title}
    >
      <Tabs defaultValue="card" className="card-detail-modal__tabs">
        <TabsList>
          <TabsTrigger value="card">Card</TabsTrigger>
          {displayCard.rawCropUrl && <TabsTrigger value="scan">Scan</TabsTrigger>}
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        {/* Card Tab - Main view with image and details */}
        <TabsContent value="card">
          <div className="card-detail-modal__layout">
            {/* Left: Large card image */}
            <div className="card-detail-modal__image">
              <img 
                src={imageUrl}
                alt={displayCard.name}
                className="card-detail-modal__image-full"
              />
            </div>
            
            {/* Right: Details panel */}
            <div className="card-detail-modal__details">
              {/* Collection Details Section */}
              <div className="card-detail-modal__section">
                <h3>Collection Details</h3>
                <div className="card-detail-modal__collection-details">
                  <div className="card-detail-modal__detail-item">
                    <span className="card-detail-modal__detail-label">Quantity:</span>
                    <span className="card-detail-modal__detail-value">{localQuantity}</span>
                  </div>
                  <div className="card-detail-modal__detail-item">
                    <span className="card-detail-modal__detail-label">Condition:</span>
                    <span className="card-detail-modal__detail-value">{displayCard.condition || 'Near Mint'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Scan Tab - Compare scan crop and correct if needed */}
        {displayCard.rawCropUrl && (
          <TabsContent value="scan">
            <div className="card-detail-modal__scan-view">
              {/* Left: Original scan crop */}
              <div className="card-detail-modal__scan-column">
                <div className="card-detail-modal__scan-image-wrapper">
                  <img
                    src={displayCard.rawCropUrl}
                    alt="Original scan crop"
                    className="card-detail-modal__scan-image"
                  />
                </div>
              </div>

              {/* Right: Replace card controls */}
              <div className="card-detail-modal__scan-column card-detail-modal__scan-actions">
                {isReplaceMode ? (
                  <div className="card-detail-modal__replace-panel">
                    <h3>Search for Correct Card</h3>
                    <CardSearchInput
                      placeholder="Search by name or number…"
                      onSelect={handleReplace}
                    />
                    <div className="card-detail-modal__replace-actions">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsReplaceMode(false)} 
                        disabled={isReplacing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="card-detail-modal__scan-info">
                    <h3>AI Identified As</h3>
                    <div className="card-detail-modal__identified-card">
                      <img 
                        src={imageUrl}
                        alt={displayCard.name}
                        className="card-detail-modal__identified-image"
                      />
                      <div className="card-detail-modal__identified-details">
                        <p className="card-detail-modal__identified-name">{displayCard.name}</p>
                        <p className="card-detail-modal__identified-meta">#{displayCard.number} • {displayCard.setName}</p>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="md" 
                      onClick={() => setIsReplaceMode(true)}
                      className="card-detail-modal__replace-trigger"
                    >
                      Replace Card
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Market Tab - Pricing and market data */}
        <TabsContent value="market">
          <div className="card-detail-modal__market-view">
            <div className="card-detail-modal__section">
              <h3>Market Value</h3>
              <p className="card-detail-modal__price-display">$24.99</p>
              <p className="card-detail-modal__price-note">
                Real-time pricing coming soon
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer with action buttons */}
      <footer className="card-detail-modal__footer">
        <div className="card-detail-modal__footer-nav">
          <span className="card-detail-modal__footer-pos" />
        </div>
        
        <div className="card-detail-modal__footer-cta">
          <Button 
            variant="destructive" 
            size="sm"
            disabled={isDeleting || !card.id}
            onClick={async () => {
              if (!card.id || !onDeleteCard) return;
              setIsDeleting(true);
              try {
                await onDeleteCard(card.id);
                onClose();
              } catch (error) {
                console.error('Failed to delete card:', error);
              } finally {
                setIsDeleting(false);
              }
            }}
          >
            {isDeleting ? 'Removing...' : 'Remove from Collection'}
          </Button>
        </div>
        
        <div className="card-detail-modal__footer-state">
          {/* Future: Quick actions or status indicators */}
        </div>
      </footer>
    </BaseModal>
  );
}


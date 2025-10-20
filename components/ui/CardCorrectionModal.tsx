'use client';

import * as React from 'react';
import { BaseModal } from './BaseModal';
import { Button } from './Button';
import { CardSearchInput } from './CardSearchInput';
import { type Card } from '@/hooks/useCardSearch';
import Image from 'next/image';

interface CardCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  detection: {
    id: string;
    crop_url?: string | null;
    card?: {
      id?: string;
      name?: string;
      card_number?: string;
      set_code?: string;
      image_url?: string | null;
    } | null;
  };
  onSave: (cardId: string) => Promise<void>;
}

/**
 * CardCorrectionModal - Correct AI detection mistakes in scan review
 * 
 * Features:
 * - Side-by-side comparison: AI Match vs Original Crop
 * - Replace card functionality with search
 * - Optimized for quick correction workflow
 */
export function CardCorrectionModal({ 
  isOpen, 
  onClose, 
  detection,
  onSave
}: CardCorrectionModalProps) {
  const cropSrc = detection.crop_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${detection.crop_url}`
    : undefined;
  
  const cardImage = detection.card?.image_url || undefined;
  const cardName = detection.card?.name || 'Unknown Card';
  const cardNumber = detection.card?.card_number;
  const setName = detection.card?.set_name;

  // Auto-enable search mode for Unknown Cards
  const isUnknownCard = !detection.card?.id || cardName === 'Unknown Card';
  const [isReplaceMode, setIsReplaceMode] = React.useState(isUnknownCard);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset to default state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setIsReplaceMode(isUnknownCard);
      setIsSaving(false);
    }
  }, [isOpen, isUnknownCard]);

  const handleSelectCard = async (card: Card) => {
    setIsSaving(true);
    try {
      await onSave(card.id);
      // Success - exit replace mode to show updated card
      setIsReplaceMode(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Save failed:', error);
      setIsSaving(false);
      // Keep modal open on error so user can retry
    }
  };

  const title = (
    <>
      <h2 className="card-correction-modal__title">{cardName}</h2>
      {(cardNumber || setName) && (
        <p className="card-correction-modal__meta">
          {cardNumber && `#${cardNumber}`}
          {cardNumber && setName && ' • '}
          {setName}
        </p>
      )}
    </>
  );

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      className="card-correction-modal"
      title={title}
    >
      <div className="card-correction-modal__layout">
        {/* Left: AI Match OR Search Panel */}
        <div className="card-correction-modal__column">
          {!isReplaceMode ? (
            <>
              <div className="card-correction-modal__section">
                <h3>AI Match</h3>
                <div className="card-correction-modal__ai-match-wrapper">
                  {cardImage ? (
                    <Image 
                      src={cardImage} 
                      alt={cardName} 
                      fill={false} 
                      width={0} 
                      height={0} 
                      sizes="100vw" 
                      className="card-correction-modal__ai-match-image" 
                      unoptimized 
                    />
                  ) : (
                    <div className="card-correction-modal__placeholder">
                      <p>No card image available</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="card-correction-modal__section card-correction-modal__action">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setIsReplaceMode(true)}
                >
                  Replace Card
                </Button>
              </div>
            </>
          ) : (
            <div className="card-correction-modal__replace-panel">
              <div className="card-correction-modal__replace-header">
                <h3>{isUnknownCard ? 'Find Card' : 'Search Replacement Card'}</h3>
                <p>{isUnknownCard ? 'Search for the correct card by name or number' : 'Type a card name or number to find the correct match'}</p>
              </div>
              <div className="card-correction-modal__replace-input">
                <CardSearchInput
                  placeholder="Search by name or number…"
                  placement="bottom"
                  onCancel={() => setIsReplaceMode(false)}
                  onSelect={handleSelectCard}
                  autoFocus={true}
                />
              </div>
              {!isUnknownCard && (
                <div className="card-correction-modal__replace-footer">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsReplaceMode(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Original Scan Crop */}
        <div className="card-correction-modal__column">
          {cropSrc && (
            <div className="card-correction-modal__section">
              <h3>Original Scan Crop</h3>
              <div className="card-correction-modal__crop-wrapper">
                <Image 
                  src={cropSrc} 
                  alt="Original scan crop" 
                  fill={false} 
                  width={0} 
                  height={0} 
                  sizes="100vw" 
                  className="card-correction-modal__crop-image" 
                  unoptimized 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}


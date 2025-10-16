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
      name?: string;
      card_number?: string;
      set_code?: string;
      image_url?: string | null;
    } | null;
  };
  onSave: (cardId: string) => void;
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
  const [isReplaceMode, setIsReplaceMode] = React.useState(false);

  const cropSrc = detection.crop_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${detection.crop_url}`
    : undefined;
  
  const cardImage = detection.card?.image_url || undefined;
  const cardName = detection.card?.name || 'Unknown Card';
  const cardNumber = detection.card?.card_number;
  const setCode = detection.card?.set_code;

  const handleSelectCard = (card: Card) => {
    onSave(card.id);
    setIsReplaceMode(false);
  };

  const title = (
    <>
      <h2 className="card-correction-modal__title">{cardName}</h2>
      {(cardNumber || setCode) && (
        <p className="card-correction-modal__meta">
          {cardNumber && `#${cardNumber}`}
          {cardNumber && setCode && ' • '}
          {setCode}
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
                  ) : cropSrc ? (
                    <Image 
                      src={cropSrc} 
                      alt="Original scan crop" 
                      fill={false} 
                      width={0} 
                      height={0} 
                      sizes="100vw" 
                      className="card-correction-modal__ai-match-image" 
                      unoptimized 
                    />
                  ) : (
                    <div className="card-correction-modal__placeholder" />
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
                <h3>Search Replacement Card</h3>
                <p>Type a card name or number to find the correct match</p>
              </div>
              <div className="card-correction-modal__replace-input">
                <CardSearchInput
                  placeholder="Search by name or number…"
                  placement="bottom"
                  onCancel={() => setIsReplaceMode(false)}
                  onSelect={handleSelectCard}
                />
              </div>
              <div className="card-correction-modal__replace-footer">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsReplaceMode(false)}
                >
                  Cancel
                </Button>
              </div>
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


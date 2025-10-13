'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { type Card } from '@/hooks/useCardSearch';
import Image from 'next/image';
import Link from 'next/link';
import { DetectionRecord } from '@/hooks/useDetections';
import { Button } from '@/components/ui/Button';

type DetectionWithCard = DetectionRecord & { card?: { name?: string; card_number?: string; set_code?: string; image_url?: string | null } | null };

interface CorrectionModalProps {
  detection: DetectionWithCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string) => void;
}

export default function CorrectionModal({ detection, isOpen, onClose, onSave }: CorrectionModalProps) {
  if (!detection) return null;

  const cropSrc = detection.crop_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${detection.crop_url}`
    : undefined;
  const cardImage = (detection.card as any)?.image_url || undefined;
  const [isReplaceMode, setIsReplaceMode] = React.useState(false);

  const displayCard = detection.card ? {
    name: (detection.card as any)?.name || 'Unknown Card',
    number: (detection.card as any)?.card_number,
    setCode: (detection.card as any)?.set_code,
  } : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-card-info" displayCard={displayCard}>
      <div className="card-info-layout">
        {/* Left: AI Match OR search panel when replacing */}
        <div className="card-info-details">
          {!isReplaceMode ? (
            <>
              <div className="info-section info-section--image">
                <h3>AI Match</h3>
                <div className="ai-match-card-wrapper">
                  {cardImage ? (
                    <Image src={cardImage} alt={detection.card?.name || 'Card'} fill={false} width={0} height={0} sizes="100vw" className="ai-match-card-image" unoptimized />
                  ) : cropSrc ? (
                    <Image src={cropSrc} alt="Original scan crop" fill={false} width={0} height={0} sizes="100vw" className="ai-match-card-image" unoptimized />
                  ) : (
                    <div className="card-image-placeholder" style={{ width: '100%', aspectRatio: '63/88' }} />
                  )}
                </div>
              </div>
              <div className="info-section info-section--action">
                <Button variant="secondary" size="sm" onClick={() => setIsReplaceMode(true)}>Replace Card</Button>
              </div>
            </>
          ) : (
            // Replace mode: Show search panel here
            <div className="replace-search-panel">
              <div className="replace-search-header">
                <h3>Search Replacement Card</h3>
                <p>Type a card name or number to find the correct match</p>
              </div>
              <div className="replace-search-input-wrapper">
                <CardSearchInput
                  placeholder="Search by name or number…"
                  placement="bottom"
                  onCancel={() => setIsReplaceMode(false)}
                  onSelect={(card: Card) => {
                    onSave(card.id);
                    setIsReplaceMode(false);
                  }}
                />
              </div>
              <div className="replace-search-footer">
                <Button variant="ghost" size="sm" onClick={() => setIsReplaceMode(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Original scan crop (always visible) + details */}
        <div className="card-info-details">
          {/* Original crop preview */}
          {cropSrc && (
            <div className="info-section info-section--image">
              <h3>Original Scan Crop</h3>
              <div className="original-crop-wrapper">
                <Image src={cropSrc} alt="Original scan crop" fill={false} width={0} height={0} sizes="100vw" className="original-crop-image" unoptimized />
              </div>
            </div>
          )}

        </div>
      </div>
    </Modal>
  );
}

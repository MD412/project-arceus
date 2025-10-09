'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { type Card } from '@/hooks/useCardSearch';
import Image from 'next/image';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="modal-card-info">
      <header className="modal__header">
        <div className="modal__title">
          <h2 className="card-info-title" style={{ margin: 0 }}>{(detection.card as any)?.name || 'Unknown Card'}</h2>
          {(((detection.card as any)?.card_number) || ((detection.card as any)?.set_code)) && (
            <p className="card-info-meta">
              {(detection.card as any)?.card_number ? `#${(detection.card as any).card_number}` : ''}
              {((detection.card as any)?.card_number) && ((detection.card as any)?.set_code) ? ' • ' : ''}
              {(detection.card as any)?.set_code || ''}
            </p>
          )}
        </div>
      </header>
      <div className="card-info-layout">
        {/* Left: Large card image (guessed card if available, otherwise crop) */}
        <div className="card-info-image">
          {cardImage ? (
            <Image src={cardImage} alt={detection.card?.name || 'Card'} width={640} height={896} className="card-image-full" unoptimized />
          ) : cropSrc ? (
            <Image src={cropSrc} alt="Original scan crop" width={640} height={896} className="card-image-full" unoptimized />
          ) : (
            <div className="card-image-placeholder" style={{ width: '640px', height: '896px' }} />
          )}
        </div>

        {/* Right: Replace flow or details */}
        <div className={`card-info-details ${isReplaceMode ? 'card-info-details--replace' : ''}`}>
          {!isReplaceMode ? (
            <>
              {/* Original crop preview */}
              {cropSrc && (
                <div className="info-section">
                  <h3>Original Scan Crop</h3>
                  <div className="original-crop-wrapper">
                    <Image src={cropSrc} alt="Original scan crop" fill={false} width={320} height={480} className="original-crop-image" unoptimized />
                  </div>
                </div>
              )}

              {/* Market value placeholder */}
              <div className="info-section">
                <h3>Market Value</h3>
                <p>—</p>
              </div>
            </>
          ) : (
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
      </div>
      <footer className="card-controls">
        <div className="controls__nav">
          <span className="controls__pos" />
        </div>
        <div className="controls__cta">
          {!isReplaceMode && (
            <Button variant="secondary" size="sm" onClick={() => setIsReplaceMode(true)}>Replace Card</Button>
          )}
        </div>
        <div className="controls__state" />
      </footer>
    </Modal>
  );
}

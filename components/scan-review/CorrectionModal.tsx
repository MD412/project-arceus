'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CardSearchInput } from '@/components/ui/CardSearchInput';
import { type Card } from '@/hooks/useCardSearch';
import Image from 'next/image';
import { DetectionRecord } from '@/hooks/useDetections';
import styles from './CorrectionModal.module.css';

interface CorrectionModalProps {
  detection: DetectionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string) => void;
}

export default function CorrectionModal({ detection, isOpen, onClose, onSave }: CorrectionModalProps) {
  if (!detection) return null;

  const cropSrc = detection.crop_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${detection.crop_url}`
    : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
      <div className={styles.content}>
        {/* Left crop */}
        <div className={styles.cropPane}>
          {cropSrc ? (
            <Image src={cropSrc} alt="Card crop" width={240} height={336} />
          ) : (
            <div className={styles.placeholder}>No crop</div>
          )}
        </div>

        {/* Right search */}
        <div className={styles.formPane}>
          <h3>Correct this card</h3>
          <CardSearchInput
            placeholder="Search cards…"
            onSelect={(card: Card) => {
              console.log('CardSearchInput onSelect called with:', card);
              onSave(card.id);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

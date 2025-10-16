'use client';

import React from 'react';
import { CardCorrectionModal } from '@/components/ui/CardCorrectionModal';
import { DetectionRecord } from '@/hooks/useDetections';

type DetectionWithCard = DetectionRecord & { card?: { name?: string; card_number?: string; set_code?: string; image_url?: string | null } | null };

interface CorrectionModalProps {
  detection: DetectionWithCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardId: string) => void;
}

export default function CorrectionModal({ detection, isOpen, onClose, onSave }: CorrectionModalProps) {
  if (!detection) return null;

  return (
    <CardCorrectionModal
      isOpen={isOpen}
      onClose={onClose}
      detection={detection}
      onSave={onSave}
    />
  );
}

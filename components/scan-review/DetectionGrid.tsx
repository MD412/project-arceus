'use client';

import React from 'react';
import { useDetections } from '@/hooks/useDetections';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';
import DetectionTile from './DetectionTile';
import CorrectionModal from './CorrectionModal';
import styles from './DetectionGrid.module.css';
import toast from 'react-hot-toast';

interface DetectionGridProps {
  scanId: string;
  onReviewed: () => void;
}

export default function DetectionGrid({ scanId, onReviewed }: DetectionGridProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const {
    data: detections,
    correctDetection,
    isLoading,
  } = useDetections(scanId);
  const supabase = getSupabaseClient();
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState<string | null>(null);

  if (isLoading) return <p>Loading detections…</p>;
  if (!detections) return <p>No detections found.</p>;

  const editingDetection = detections.find((d) => d.id === editing) || null;

  // ---- bulk actions ---- //
  const handleApproveAll = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('scan_uploads')
        .update({ processing_status: 'completed' })
        .eq('id', scanId);
      if (error) throw error;
      toast.success('Scan approved');
      queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
      onReviewed();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve scan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDiscard = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('scan_uploads')
        .update({ processing_status: 'rejected' })
        .eq('id', scanId);
      if (error) throw error;
      toast.success('Scan discarded');
      queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
      onReviewed();
    } catch (err) {
      console.error(err);
      toast.error('Failed to discard scan');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.approveBtn} onClick={handleApproveAll} disabled={isUpdating}>Approve All</button>
        <button className={styles.rejectBtn} onClick={handleDiscard} disabled={isUpdating}>Discard Scan</button>
        <span className={styles.count}>{detections.length} cards</span>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {detections.map((det) => (
          <DetectionTile key={det.id} detection={det} onClick={() => setEditing(det.id)} />
        ))}
      </div>

      {/* Modal */}
      <CorrectionModal
        detection={editingDetection}
        isOpen={Boolean(editingDetection)}
        onClose={() => setEditing(null)}
        onSave={async (cardId) => {
          if (editingDetection) {
            console.log('Saving correction:', editingDetection.id, '->', cardId);
            try {
              await correctDetection(editingDetection.id, cardId);
              console.log('Correction saved successfully');
              setEditing(null);
              toast.success('Card corrected successfully');
            } catch (error) {
              console.error('Failed to correct card:', error);
              toast.error('Failed to correct card');
            }
          }
        }}
      />
    </div>
  );
}

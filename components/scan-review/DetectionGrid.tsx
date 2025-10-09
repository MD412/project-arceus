'use client';

import React from 'react';
import { useDetections } from '@/hooks/useDetections';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/browser';
import DetectionTile from './DetectionTile';
import CorrectionModal from './CorrectionModal';
import styles from './DetectionGrid.module.css';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';

interface DetectionGridProps {
  scanId: string;
  onReviewed: (scanId: string) => void;
  hideBulkActions?: boolean;
}

export default function DetectionGrid({ scanId, onReviewed, hideBulkActions = false }: DetectionGridProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const {
    data: detections,
    correctDetection,
    isLoading,
  } = useDetections(scanId);
  const supabase = getSupabaseClient();
  const queryClient = useQueryClient();
  const [editing, setEditing] = React.useState<string | null>(null);

  const editingDetection = React.useMemo(() => {
    return (detections?.find((d) => d.id === editing) || null) as (typeof detections extends Array<infer T> ? T : any) | null;
  }, [detections, editing]);

  // Enable left/right arrow navigation between detections while modal is open
  React.useEffect(() => {
    if (!editingDetection) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isFormField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
      if (isFormField) return;

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (!detections || detections.length === 0) return;

      const currentIndex = detections.findIndex((d) => d.id === editingDetection.id);
      if (currentIndex === -1) return;

      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + delta + detections.length) % detections.length;
      const next = detections[nextIndex];
      if (next) setEditing(next.id);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingDetection, detections]);

  // ---- bulk actions ---- //
  const handleApproveAll = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      // Optimistically remove from inbox immediately, capture previous to rollback on failure
      const previousInbox = queryClient.getQueryData(['review-inbox']);
      queryClient.setQueryData(['review-inbox'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((item: any) => item.id !== scanId);
      });
      onReviewed(scanId);

      // 1) Approve detections into user_cards via API (server-side privileges)
      const res = await fetch(`/api/scans/${scanId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // rollback optimistic removal on failure
        queryClient.setQueryData(['review-inbox'], previousInbox as any);
        throw new Error(data.error || 'Approve API failed');
      }

      // 2) Mark scan_uploads as completed for UI status (best-effort)
      const { error } = await supabase
        .from('scan_uploads')
        .update({ processing_status: 'completed' })
        .eq('id', scanId);
      if (error) {
        console.warn('Non-blocking status update error:', error);
      }
      toast.success('Scan approved');
      // Trigger a refetch to reconcile with server state
      queryClient.invalidateQueries({ queryKey: ['review-inbox'] });
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

  const count = Array.isArray(detections) ? detections.length : 0;

  return (
    <div className={styles.wrapper}>
      {/* Toolbar (hidden when page renders breadcrumb actions) */}
      <div className={styles.toolbar} style={{ display: hideBulkActions ? 'none' : undefined }}>
        {!hideBulkActions && (
          <>
            <TextLink onClick={handleApproveAll} ariaLabel="Approve all detected cards in this scan" className="u-text-link--success">
              Approve all
            </TextLink>
            <TextLink onClick={handleDiscard} ariaLabel="Discard this scan" className="u-text-link--destructive">
              Discard scan
            </TextLink>
          </>
        )}
        <span className={styles.count}>{count} cards</span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <p>Loading detections…</p>
      ) : !detections || detections.length === 0 ? (
        <p>No detections found.</p>
      ) : (
        <div className={styles.grid}>
          {detections.map((det) => (
            <DetectionTile key={det.id} detection={det} onClick={() => setEditing(det.id)} />
          ))}
        </div>
      )}

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

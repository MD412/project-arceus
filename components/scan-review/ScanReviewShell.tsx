'use client';

import React from 'react';
import InboxSidebar from './InboxSidebar';
import DetectionGrid from './DetectionGrid';
import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';
import { RenameScanModal } from '@/components/ui/RenameScanModal';
import { useReviewInbox } from '@/hooks/useReviewInbox';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/Button';
import styles from './ScanReviewShell.module.css';

/** View mode for the scan review interface */
type ViewMode = 'review' | 'history';

/**
 * ScanReviewShell - Main container for the scan review interface
 * 
 * Provides a two-panel layout for reviewing completed scans:
 * - Left panel: Inbox sidebar with list of scans awaiting review
 * - Right panel: Detection grid showing identified cards for the selected scan
 * 
 * Features:
 * - Auto-selects most recent scan on load
 * - Toggle between review mode and scan history
 * - Rename and delete scans
 * - Flag failed scans for ML training
 * - Hide approved scans from inbox
 * 
 * @returns The complete scan review interface
 */
export default function ScanReviewShell() {
  const [activeScanId, setActiveScanId] = React.useState<string | undefined>();
  const [hiddenIds, setHiddenIds] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<ViewMode>('review');
  const [renamingUpload, setRenamingUpload] = React.useState<{ id: string; scan_title: string } | null>(null);

  const { data: inboxItems } = useReviewInbox();
  const { data: uploads, renameJob, deleteJob } = useJobs();

  // Auto-select most recent scan when inbox first loads
  React.useEffect(() => {
    if (!activeScanId && inboxItems && inboxItems.length > 0) {
      setActiveScanId(inboxItems[0].id);
    }
  }, [activeScanId, inboxItems]);

  const handleRename = (newTitle: string) => {
    if (renamingUpload) {
      renameJob({ jobId: renamingUpload.id, newTitle });
      setRenamingUpload(null);
    }
  };

  /** Delete a scan after user confirmation */
  const handleDelete = (uploadId: string, jobTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      deleteJob(uploadId);
    }
  };

  /** Flag a failed scan for ML training dataset */
  const handleFlagForTraining = async (uploadId: string) => {
    try {
      const response = await fetch('/api/training/add-failure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scan_id: uploadId }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag scan for training');
      }

      const result = await response.json();
      alert(`✅ Scan added to training set! Total training images: ${result.training_count || 'unknown'}`);
    } catch (error) {
      console.error('Failed to flag for training:', error);
      alert('Failed to add scan to training set. Please try again.');
    }
  };

  // Filter completed scans for history table
  const historyUploads = (uploads as any[])?.filter(upload =>
    ['completed', 'review_pending', 'cancelled'].includes(upload.processing_status)
  ) || [];

  // Filter processing scans for indicator
  const processingUploads = (uploads as any[])?.filter(upload =>
    ['queued', 'processing', 'review_pending'].includes(upload.processing_status)
  ) || [];

  return (
    <div className={styles.container}>
      {/* Left column: inbox */}
      <aside className={styles.leftColumn}>
        <InboxSidebar activeId={activeScanId} onSelect={setActiveScanId} hiddenIds={hiddenIds} />
      </aside>

      {/* Right column: toolbar + modular panels */}
      <main className={styles.rightColumn}>
        {/* View Mode Toggle */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--sds-size-space-200)', 
          marginBottom: 'var(--sds-size-space-400)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--sds-size-space-300)'
        }}>
          <Button 
            variant={viewMode === 'review' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('review')}
          >
            Scans
          </Button>
          <Button 
            variant={viewMode === 'history' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('history')}
          >
            Scan History ({historyUploads.length})
          </Button>
        </div>
        <section className={styles.panels}>
          <div className={styles.panelPrimary}>
            {viewMode === 'review' ? (
              activeScanId ? (
                <DetectionGrid
                  scanId={activeScanId}
                  onReviewed={(approvedId) => {
                    // Hide the approved scan from inbox
                    setHiddenIds((prev) => Array.from(new Set([...prev, approvedId])));
                    
                    // Auto-advance to next scan if we just approved the active one
                    if (approvedId === activeScanId) {
                      const remaining = (inboxItems || [])
                        .filter((i) => i.id !== approvedId && !hiddenIds.includes(i.id));
                      setActiveScanId(remaining.length > 0 ? remaining[0].id : undefined);
                    }
                  }}
                />
              ) : (
                <p>Select a scan from the inbox to begin reviewing.</p>
              )
            ) : (
              <div>
                <div style={{ marginBottom: 'var(--sds-size-space-400)' }}>
                  <h2 style={{ 
                    margin: '0 0 var(--sds-size-space-200) 0',
                    fontSize: 'var(--font-size-400)',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Scan History
                  </h2>
                  <p style={{ 
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--font-size-75)'
                  }}>
                    Completed scans and their results
                  </p>
                </div>
                {historyUploads.length > 0 ? (
                  <ScanHistoryTable
                    uploads={historyUploads}
                    onRename={setRenamingUpload}
                    onDelete={handleDelete}
                    onFlagForTraining={handleFlagForTraining}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 'var(--sds-size-space-600)', color: 'var(--text-secondary)' }}>
                    <p>No completed scans found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <aside className={styles.panelSecondary}>
            {/* Reserved for future modular panel (e.g., metadata / training aide) */}
            {processingUploads.length > 0 && (
              <div style={{
                marginBottom: 'var(--sds-size-space-400)',
                padding: 'var(--sds-size-space-300)',
                backgroundColor: 'var(--surface-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--sds-size-radius-200)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sds-size-space-200)'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-warning)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 'var(--font-size-100)', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {processingUploads.length} scan{processingUploads.length === 1 ? '' : 's'} processing...
                </span>
              </div>
            )}
          </aside>
        </section>
      </main>

      {/* Rename Modal */}
      {renamingUpload && (
        <RenameScanModal
          currentTitle={renamingUpload.scan_title || ''}
          onRename={handleRename}
          onClose={() => setRenamingUpload(null)}
        />
      )}
    </div>
  );
}

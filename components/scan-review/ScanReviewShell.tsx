'use client';

import React from 'react';
import InboxSidebar from './InboxSidebar';
import DetectionGrid from './DetectionGrid';
import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';
import { RenameScanModal } from '@/components/ui/RenameScanModal';
import { useReviewInbox } from '@/hooks/useReviewInbox';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/Button';

type ViewMode = 'review' | 'history';

export default function ScanReviewShell() {
  const [activeScanId, setActiveScanId] = React.useState<string | undefined>();
  const [viewMode, setViewMode] = React.useState<ViewMode>('review');
  const [renamingUpload, setRenamingUpload] = React.useState<any>(null);

  const { data: inboxItems } = useReviewInbox();
  const { data: uploads, renameJob, deleteJob } = useJobs();

  // auto-select most recent when list first loads
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

  const handleDelete = (uploadId: string, jobTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      deleteJob(uploadId);
    }
  };

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
    <div>
      <InboxSidebar activeId={activeScanId} onSelect={setActiveScanId} />

      <main style={{ marginLeft: 'calc(var(--sidebar-width, 200px) + 280px)', padding: 'var(--sds-size-space-400)', overflowY: 'auto' }}>
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

        {/* Processing Indicator */}
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
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-warning)',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ 
              fontSize: 'var(--font-size-100)',
              color: 'var(--text-primary)',
              fontWeight: '500'
            }}>
              {processingUploads.length} scan{processingUploads.length === 1 ? '' : 's'} processing...
            </span>
          </div>
        )}

        {viewMode === 'review' ? (
          activeScanId ? (
            <DetectionGrid scanId={activeScanId} onReviewed={() => setActiveScanId(undefined)} />
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
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--sds-size-space-600)',
                color: 'var(--text-secondary)'
              }}>
                <p>No completed scans found.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rename Modal */}
      {renamingUpload && (
        <RenameScanModal
          currentTitle={renamingUpload.scan_title || ''}
          onRename={handleRename}
          onClose={() => setRenamingUpload(null)}
        />
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

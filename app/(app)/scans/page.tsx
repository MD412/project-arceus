'use client';

import React, { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { ProcessingQueueCard } from '@/components/ui/ProcessingQueueCard';
import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';
import { RenameScanModal } from '@/components/ui/RenameScanModal';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

// This is the shape of the 'scan_uploads' table row.
interface ScanUpload {
  id: string;
  created_at: string;
  scan_title: string;
  processing_status: 'queued' | 'processing' | 'review_pending' | 'failed' | 'timeout' | 'cancelled' | 'completed';
  results?: {
    summary_image_path?: string;
    total_cards_detected?: number;
  };
  error_message?: string;
}

export default function ScansPage() {
  const { data: uploads, isLoading, isError, error, renameJob, deleteJob } = useJobs();
  const [renamingUpload, setRenamingUpload] = useState<ScanUpload | null>(null);

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

  const handleRetry = async (uploadId: string) => {
    try {
      // Reset the upload status to queued and create a new job
      const response = await fetch(`/api/scans/${uploadId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retry upload');
      }

      // Refresh the data to show updated status
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry upload. Please try again.');
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

  const handleFixStuckScans = async () => {
    try {
      const response = await fetch('/api/scans/fix-stuck', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fix stuck scans');
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to fix stuck scans:', error);
      alert('Failed to fix stuck scans. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="scans-page">
        <div className="scans-page__loading">Loading your scans...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="scans-page">
        <div className="scans-page__error">
          Error loading scans: {(error as Error).message}
        </div>
      </div>
    );
  }

  // Separate uploads into priority (needs attention) and history (completed)
  const priorityUploads = (uploads as ScanUpload[])?.filter(upload => 
    ['pending', 'queued', 'processing', 'failed', 'timeout'].includes(upload.processing_status)
  ) || [];

  const historyUploads = (uploads as ScanUpload[])?.filter(upload =>
    ['completed', 'review_pending', 'cancelled', 'ready'].includes(upload.processing_status)
  ) || [];

  const totalUploads = uploads?.length || 0;

  return (
    <div className="scans-page">
      {totalUploads === 0 ? (
        <div className="scans-page__empty-state">
          <div className="scans-page__empty-content">
            <h2>No scans found</h2>
            <p>You haven&apos;t uploaded any card scans for processing yet.</p>
            <Link href="/upload">
              <Button variant="primary">
              Upload Your First Scan
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Priority Section - Needs Attention */}
          {priorityUploads.length > 0 && (
            <section className="scans-page__priority-section">
              <div className="scans-page__section-header">
                <h2 className="scans-page__section-title">
                  Needs Attention
                  <span className="scans-page__section-count">
                    {priorityUploads.length}
                  </span>
                </h2>
                <p className="scans-page__section-description">
                  Scans that require your attention or are currently processing
                </p>
                {priorityUploads.some(u => ['queued', 'processing'].includes(u.processing_status)) && (
                  <Button
                    variant="info"
                    onClick={handleFixStuckScans}
                    title="Reset scans that have been stuck for more than 5 minutes"
                  >
                    Fix Stuck Scans
                  </Button>
                )}
                  </div>
                  
              <div className="scans-page__priority-grid">
                {priorityUploads.map((upload) => (
                  <ProcessingQueueCard
                    key={upload.id}
                    upload={upload}
                    onRetry={handleRetry}
                    onRename={setRenamingUpload}
                    onDelete={handleDelete}
                  />
                ))}
                    </div>
            </section>
                  )}
                  
          {/* History Section - Completed Scans */}
          {historyUploads.length > 0 && (
            <section className="scans-page__history-section">
              <div className="scans-page__section-header">
                <h2 className="scans-page__section-title">
                  Scan History
                  <span className="scans-page__section-count">
                    {historyUploads.length}
                  </span>
                </h2>
                <p className="scans-page__section-description">
                  Completed scans and their results
                </p>
              </div>
              
              <ScanHistoryTable
                uploads={historyUploads}
                onRename={setRenamingUpload}
                onDelete={handleDelete}
                onFlagForTraining={handleFlagForTraining}
              />
            </section>
          )}
        </>
      )}

      {/* Rename Modal */}
      {renamingUpload && (
        <RenameScanModal
          currentTitle={renamingUpload.scan_title || ''}
          onRename={handleRename}
          onClose={() => setRenamingUpload(null)}
        />
      )}

      <style jsx>{`
        .scans-page {
          margin: 0;
          padding: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .scans-page__priority-section {
          margin: 0;
          padding: var(--sds-size-space-200); /* 8px */
          flex-shrink: 0;
        }

        .scans-page__history-section {
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        
        .scans-page__history-section :global(.table-wrapper) {
          flex: 1;
          min-height: 0;
          max-height: 100%;
        }

        .scans-page__section-header {
          margin: 0;
          padding: var(--sds-size-space-200); /* 8px */
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--sds-size-space-200);
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .scans-page__section-title {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-200);
          margin: 0;
          font-size: var(--font-size-300);
          font-weight: 600;
          color: var(--text-primary);
        }

        .scans-page__section-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 var(--sds-size-space-100);
          background: rgba(74, 155, 148, 0.15);
          color: var(--text-primary);
          border-radius: var(--sds-size-radius-full);
          font-size: var(--font-size-75);
          font-weight: 500;
        }

        .scans-page__section-description {
          display: none;
        }



        .scans-page__priority-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--sds-size-space-400);
          align-items: start;
        }

        .scans-page__loading,
        .scans-page__error {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: var(--text-secondary);
          font-size: var(--font-size-100);
        }

        .scans-page__error {
          color: var(--status-error);
        }

        .scans-page__empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
        }

        .scans-page__empty-content h2 {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--font-size-400);
          color: var(--text-primary);
        }

        .scans-page__empty-content p {
          margin: 0 0 var(--sds-size-space-400) 0;
          color: var(--text-secondary);
          font-size: var(--font-size-100);
        }



        @media (max-width: 768px) {
          .scans-page {
            padding: 0;
          }

          .scans-page__section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .scans-page__priority-grid {
            grid-template-columns: 1fr;
            gap: var(--sds-size-space-300);
          }

          .scans-page__section-title {
            font-size: var(--font-size-200);
          }

          .scans-page__section-count {
            min-width: 18px;
            height: 18px;
            font-size: var(--font-size-50);
          }
        }
      `}</style>
    </div>
  );
} 
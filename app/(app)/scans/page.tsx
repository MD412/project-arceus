'use client';

import React, { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RenameScanModal } from '@/components/ui/RenameScanModal';

// This is the shape of the 'scan_uploads' table row.
interface ScanUpload {
  id: string;
  created_at: string;
  scan_title: string;
  processing_status: 'queued' | 'processing' | 'review_pending' | 'failed' | 'timeout' | 'cancelled' | 'completed';
  // The 'results' field is now part of the 'jobs' table, so it's optional here.
  results?: {
    summary_image_path?: string;
    total_cards_detected?: number;
  };
  error_message?: string;
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function ScansPage() {
  const { data: uploads, isLoading, isError, error, renameJob, deleteJob, deleteJobStatus } = useJobs();
  const [renamingUpload, setRenamingUpload] = useState<ScanUpload | null>(null);
  
  // Show delete status for debugging
  if (deleteJobStatus.isPending) {
    console.log('🔄 Delete in progress...');
  }
  if (deleteJobStatus.isError) {
    console.error('❌ Delete error:', deleteJobStatus.error);
  }

  const handleRename = (newTitle: string) => {
    if (renamingUpload) {
      renameJob({ jobId: renamingUpload.id, newTitle });
    }
  };

  const handleDelete = (uploadId: string, jobTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      console.log('🗑️ Attempting to delete:', jobTitle, uploadId);
      deleteJob(uploadId);
    }
  };

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'review_pending':
        return 'status-chip--completed';
      case 'processing': 
        return 'status-chip--processing';
      case 'queued':
        return 'status-chip--queued';
      case 'failed': 
        return 'status-chip--failed';
      default: 
        return 'status-chip--default';
    }
  };

  if (isLoading) {
    return <div className="scans-container"><div className="scans-loading">Loading your scans...</div></div>;
  }

  if (isError) {
    return <div className="scans-container"><div className="scans-error">Error loading scans: {(error as Error).message}</div></div>;
  }

  return (
    <div className="scans-container">
      <header className="scans-header">
        <h1>My Processed Scans</h1>
        <p>Here are the results of your submitted card scans.</p>
      </header>

      {uploads && uploads.length > 0 ? (
        <div className="scans-grid">
          {(uploads as ScanUpload[]).map((upload) => (
            <div key={upload.id} className="scan-card-wrapper">
              <Link href={`/scans/${upload.id}`} className="scan-card-link">
                <div className="scan-card">
                  <h3>{upload.scan_title || 'Untitled Scan'}</h3>
                  <div className={`status-chip ${getStatusChipClass(upload.processing_status)}`}>
                    {upload.processing_status}
                  </div>
                  
                  {upload.processing_status === 'completed' && upload.results?.summary_image_path && (
                    <div className="scan-image-container">
                      <img
                        src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/scans/${upload.results.summary_image_path}`}
                        alt={`Processed view of ${upload.scan_title}`}
                        className="scan-result-image"
                      />
                      <p className="scan-card-count">
                        Detected {upload.results.total_cards_detected || 0} cards
                      </p>
                    </div>
                  )}
                  
                  {upload.processing_status === 'processing' && <p className="scan-status-message">Your scan is currently being processed...</p>}
                  {upload.processing_status === 'queued' && <p className="scan-status-message">This scan is in the queue and will be processed shortly.</p>}
                  {upload.processing_status === 'failed' && <p className="scan-error-text">Processing failed: {upload.error_message}</p>}

                  <p className="scan-timestamp">Uploaded: {new Date(upload.created_at).toLocaleString()}</p>
                </div>
              </Link>
              <div className="scan-actions">
                <Button variant="ghost" size="sm" onClick={() => setRenamingUpload(upload)}>Rename</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(upload.id, upload.scan_title || 'Untitled Scan')}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="scans-empty-state">
          <h2>No scans found.</h2>
          <p>You haven't uploaded any card scans for processing yet.</p>
          <Link href="/upload" className="scans-upload-link">
            Upload Your First Scan
          </Link>
        </div>
      )}

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
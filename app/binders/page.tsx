'use client';

import React, { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RenameBinderModal } from '@/components/ui/RenameBinderModal';

// This is the shape of the 'binder_page_uploads' table row.
interface BinderPageUpload {
  id: string;
  created_at: string;
  binder_title: string;
  processing_status: 'queued' | 'processing' | 'review_pending' | 'failed' | 'timeout' | 'cancelled' | 'completed';
  // The 'results' field is now part of the 'jobs' table, so it's optional here.
  results?: {
    summary_image_path?: string;
    total_cards_detected?: number;
  };
  error_message?: string;
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function BindersPage() {
  const { data: uploads, isLoading, isError, error, renameJob, deleteJob } = useJobs();
  const [renamingUpload, setRenamingUpload] = useState<BinderPageUpload | null>(null);

  const handleRename = (newTitle: string) => {
    if (renamingUpload) {
      renameJob({ jobId: renamingUpload.id, newTitle });
    }
  };

  const handleDelete = (uploadId: string, jobTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      deleteJob(uploadId);
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'review_pending':
        return '#22c55e'; // green-500
      case 'processing': return '#3b82f6'; // blue-500
      case 'queued':
        return '#f97316'; // orange-500
      case 'failed': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  if (isLoading) {
    return <div className="container"><p>Loading your binders...</p></div>;
  }

  if (isError) {
    return <div className="container"><p>Error loading binders: {(error as Error).message}</p></div>;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>My Processed Binders</h1>
        <p>Here are the results of your submitted binder scans.</p>
      </header>

      {uploads && uploads.length > 0 ? (
        <div className="binders-grid">
          {(uploads as BinderPageUpload[]).map((upload) => (
            <div key={upload.id} className="binder-card-wrapper">
              <Link href={`/binders/${upload.id}`} className="binder-card-link">
                <div className="binder-card">
                  <h3>{upload.binder_title || 'Untitled Binder'}</h3>
                  <div className="status-chip" style={{ backgroundColor: getStatusChipColor(upload.processing_status) }}>
                    {upload.processing_status}
                  </div>
                  
                  {upload.processing_status === 'completed' && upload.results?.summary_image_path && (
                    <div className="image-container">
                      <img
                        src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${upload.results.summary_image_path}`}
                        alt={`Processed view of ${upload.binder_title}`}
                        className="result-image"
                      />
                      <p className="card-count">
                        Detected {upload.results.total_cards_detected || 0} cards
                      </p>
                    </div>
                  )}
                  
                  {upload.processing_status === 'processing' && <p>Your binder is currently being processed...</p>}
                  {upload.processing_status === 'queued' && <p>This binder is in the queue and will be processed shortly.</p>}
                  {upload.processing_status === 'failed' && <p className="error-text">Processing failed: {upload.error_message}</p>}

                  <p className="timestamp">Uploaded: {new Date(upload.created_at).toLocaleString()}</p>
                </div>
              </Link>
              <div className="binder-actions">
                <Button variant="ghost" size="sm" onClick={() => setRenamingUpload(upload)}>Rename</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(upload.id, upload.binder_title)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No binders found.</h2>
          <p>You haven't uploaded any binders for processing yet.</p>
          <Link href="/upload" className="button-primary">
            Upload Your First Binder
          </Link>
        </div>
      )}

      {renamingUpload && (
        <RenameBinderModal
          currentTitle={renamingUpload.binder_title}
          onRename={handleRename}
          onClose={() => setRenamingUpload(null)}
        />
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        .header {
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 1rem;
        }
        .binders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        .binder-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .binder-card-link:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .binder-card-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem; /* Space between card and actions */
        }
        .binder-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .binder-card {
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          padding: 1.5rem;
          background: var(--surface-background);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 100%;
          overflow: hidden;
        }
        .binder-card h3 {
          margin: 0;
        }
        .status-chip {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          align-self: flex-start;
        }
        .image-container {
          margin-top: 1rem;
        }
        .result-image {
          max-width: 100%;
          width: auto;
          height: auto;
          max-height: 300px;
          border-radius: var(--sds-size-radius-100);
          border: 1px solid var(--border-subtle);
          display: block;
        }
        .card-count {
          font-weight: 500;
          text-align: center;
          margin-top: 0.5rem;
        }
        .error-text {
          color: var(--color-error-600);
          font-style: italic;
        }
        .timestamp {
          font-size: 0.8rem;
          color: var(--text-subtle);
          margin-top: auto; /* Pushes to the bottom */
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          border: 1px dashed var(--border-subtle);
          border-radius: var(--sds-size-radius-200);
          background-color: var(--surface-background);
        }
        .button-primary { /* Basic styling for the link */
          display: inline-block;
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background-color: var(--color-primary-500);
          color: white;
          border-radius: var(--sds-size-radius-100);
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 
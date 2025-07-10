'use client';

import React from 'react';
import { ProcessingQueueCard } from '@/components/ui/ProcessingQueueCard';
import CodeBlock from '../CodeBlock';

export default function ProcessingQueueCardPage() {
  // Mock data for examples
  const mockUploads = [
    {
      id: '1',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      scan_title: 'Pokemon Binder Page 1',
      processing_status: 'processing' as const,
      results: undefined,
      error_message: undefined,
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      scan_title: 'Collection Scan',
      processing_status: 'queued' as const,
      results: undefined,
      error_message: undefined,
    },
    {
      id: '3',
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      scan_title: 'Failed Upload Test',
      processing_status: 'failed' as const,
      results: undefined,
      error_message: 'Processing timeout: Image too large',
    },
  ];

  const handleRetry = (uploadId: string) => {
    console.log('Retry:', uploadId);
  };

  const handleRename = (upload: any) => {
    console.log('Rename:', upload.scan_title);
  };

  const handleDelete = (uploadId: string, title: string) => {
    console.log('Delete:', title);
  };

  const basicUsageCode = `import { ProcessingQueueCard } from '@/components/ui/ProcessingQueueCard';

// Basic usage
<ProcessingQueueCard
  upload={scanUpload}
  onRetry={handleRetry}
  onRename={handleRename}
  onDelete={handleDelete}
/>`;

  const interfaceCode = `interface ScanUpload {
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

interface ProcessingQueueCardProps {
  upload: ScanUpload;
  onRetry?: (uploadId: string) => void;
  onRename?: (upload: ScanUpload) => void;
  onDelete?: (uploadId: string, title: string) => void;
}`;

  return (
    <div className="content-section">
      <header className="content-section__header">
        <h1>ProcessingQueueCard</h1>
        <p>
          A priority-focused card component for displaying scan uploads that need user attention.
          Features dynamic status indicators, progress bars, and contextual actions.
        </p>
      </header>

      <section className="content-section__section">
        <h2>Design Principles</h2>
        <ul>
          <li><strong>Priority Visual Hierarchy:</strong> Uses larger cards with more spacing than history items</li>
          <li><strong>Status-driven UI:</strong> Different visual states for processing, queued, and failed uploads</li>
          <li><strong>Linear Progress Bars:</strong> Animated progress indicators for active processing</li>
          <li><strong>Contextual Actions:</strong> Shows retry button only for failed items</li>
          <li><strong>Zero-latency Feel:</strong> Hover states and smooth transitions under 16ms</li>
        </ul>
      </section>

      <section className="content-section__section">
        <h2>Examples</h2>
        
        <div className="example-showcase">
          <h3>Processing Status</h3>
          <ProcessingQueueCard
            upload={mockUploads[0]}
            onRetry={handleRetry}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>

        <div className="example-showcase">
          <h3>Queued Status</h3>
          <ProcessingQueueCard
            upload={mockUploads[1]}
            onRetry={handleRetry}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>

        <div className="example-showcase">
          <h3>Failed Status (with Retry)</h3>
          <ProcessingQueueCard
            upload={mockUploads[2]}
            onRetry={handleRetry}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        </div>
      </section>

      <section className="content-section__section">
        <h2>Usage</h2>
        <CodeBlock code={basicUsageCode} />
      </section>

      <section className="content-section__section">
        <h2>Interface</h2>
        <CodeBlock code={interfaceCode} />
      </section>

      <section className="content-section__section">
        <h2>Status States</h2>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-badge status-badge--processing">⏳ Processing</div>
            <p>Shows animated linear progress bar with "Processing cards..." message</p>
          </div>
          <div className="status-item">
            <div className="status-badge status-badge--queued">⏰ Queued</div>
            <p>Displays "Waiting in queue for processing..." with yellow styling</p>
          </div>
          <div className="status-item">
            <div className="status-badge status-badge--failed">❌ Failed</div>
            <p>Shows error message and retry button with red error styling</p>
          </div>
        </div>
      </section>

      <section className="content-section__section">
        <h2>Best Practices</h2>
        <div className="best-practices">
          <div className="practice-item">
            <h4>✅ Do</h4>
            <ul>
              <li>Use in priority sections for items needing attention</li>
              <li>Provide clear error messages for failed states</li>
              <li>Implement retry functionality for failed uploads</li>
              <li>Keep scan titles descriptive but concise</li>
            </ul>
          </div>
          <div className="practice-item">
            <h4>❌ Don't</h4>
            <ul>
              <li>Use for completed items (use ScanHistoryTable instead)</li>
              <li>Show retry button for non-failed states</li>
              <li>Override the built-in status styling</li>
              <li>Use for more than 10 items at once (overwhelming)</li>
            </ul>
          </div>
        </div>
      </section>

      <style jsx>{`
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--sds-size-space-400);
          margin: var(--sds-size-space-400) 0;
        }

        .status-item {
          padding: var(--sds-size-space-300);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--sds-size-space-100);
          padding: var(--sds-size-space-100) var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
          font-size: var(--font-size-75);
          font-weight: 500;
          margin-bottom: var(--sds-size-space-200);
        }

        .status-badge--processing {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }

        .status-badge--queued {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
        }

        .status-badge--failed {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .status-item p {
          margin: 0;
          font-size: var(--font-size-75);
          color: var(--text-secondary);
        }

        .best-practices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--sds-size-space-400);
          margin: var(--sds-size-space-400) 0;
        }

        .practice-item {
          padding: var(--sds-size-space-300);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
        }

        .practice-item h4 {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--font-size-100);
        }

        .practice-item ul {
          margin: 0;
          padding-left: var(--sds-size-space-400);
        }

        .practice-item li {
          margin-bottom: var(--sds-size-space-100);
          font-size: var(--font-size-75);
        }

        @media (max-width: 768px) {
          .best-practices,
          .status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 
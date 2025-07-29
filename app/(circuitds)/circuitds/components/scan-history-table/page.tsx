"use client";

import React from 'react';
import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';
import CodeBlock from '../CodeBlock';

export default function ScanHistoryTablePage() {
  // Mock data for examples
  const mockHistoryUploads = [
    {
      id: '1',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      scan_title: 'Pokemon Collection Batch 1',
      processing_status: 'completed' as const,
      results: {
        summary_image_path: 'mock/path/summary.jpg',
        total_cards_detected: 12,
      },
      error_message: undefined,
    },
    {
      id: '2',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      scan_title: 'Vintage Cards Scan',
      processing_status: 'review_pending' as const,
      results: {
        summary_image_path: 'mock/path/vintage.jpg',
        total_cards_detected: 8,
      },
      error_message: undefined,
    },
    {
      id: '3',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      scan_title: 'Japanese Cards Test',
      processing_status: 'completed' as const,
      results: {
        summary_image_path: 'mock/path/japanese.jpg',
        total_cards_detected: 6,
      },
      error_message: undefined,
    },
    {
      id: '4',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      scan_title: 'Cancelled Upload',
      processing_status: 'cancelled' as const,
      results: undefined,
      error_message: undefined,
    },
  ];

  const handleRename = (upload: any) => {
    console.log('Rename:', upload.scan_title);
  };

  const handleDelete = (uploadId: string, title: string) => {
    console.log('Delete:', title);
  };

  const basicUsageCode = `import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';

// Basic usage
<ScanHistoryTable
  uploads={historyUploads}
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

interface ScanHistoryTableProps {
  uploads: ScanUpload[];
  onRename?: (upload: ScanUpload) => void;
  onDelete?: (uploadId: string, title: string) => void;
}`;

  const tanstackFeaturesCode = `// Built-in TanStack Table features
const table = useReactTable({
  data: uploads,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onSortingChange: setSorting,
  state: { sorting },
});

// Default sorting: Most recent first
const [sorting, setSorting] = useState([
  { id: 'created_at', desc: true }
]);`;

  return (
    <div className="content-section">
      <header className="content-section__header">
        <h1>ScanHistoryTable</h1>
        <p>
          A compact, sortable table component for displaying completed scan history.
          Built with TanStack Table for performance and includes hover actions, relative dates, and card count displays.
        </p>
      </header>

      <section className="content-section__section">
        <h2>Design Principles</h2>
        <ul>
          <li><strong>Compact Density:</strong> Efficient space usage for scanning large lists</li>
          <li><strong>Sortable Columns:</strong> Click headers to sort by date, title, or card count</li>
          <li><strong>Hover Actions:</strong> Actions appear on row hover to reduce visual clutter</li>
          <li><strong>Relative Dates:</strong> Human-friendly "Today", "Yesterday", "2 days ago" formatting</li>
          <li><strong>Status Badges:</strong> Subtle, color-coded status indicators</li>
          <li><strong>Mobile Responsive:</strong> Adapts to smaller screens with always-visible actions</li>
        </ul>
      </section>

      <section className="content-section__section">
        <h2>Example</h2>
        
        <div className="example-showcase">
          <h3>Complete History Table</h3>
          <ScanHistoryTable
            uploads={mockHistoryUploads}
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
        <h2>TanStack Table Integration</h2>
        <CodeBlock code={tanstackFeaturesCode} />
      </section>

      <section className="content-section__section">
        <h2>Column Structure</h2>
        <div className="column-grid">
          <div className="column-item">
            <h4>Scan Title</h4>
            <p>Clickable link to scan details page. Falls back to "Untitled Scan" if empty.</p>
          </div>
          <div className="column-item">
            <h4>Status</h4>
            <p>Color-coded badge showing completion state (completed, review_pending, cancelled).</p>
          </div>
          <div className="column-item">
            <h4>Cards</h4>
            <p>Number of detected cards with 🃏 icon. Shows "—" if no results available.</p>
          </div>
          <div className="column-item">
            <h4>Upload Date</h4>
            <p>Relative time format (Today, Yesterday, Jan 15) for easy scanning.</p>
          </div>
          <div className="column-item">
            <h4>Actions</h4>
            <p>Hover-revealed Rename and Delete buttons. Always visible on mobile.</p>
          </div>
        </div>
      </section>

      <section className="content-section__section">
        <h2>Status Styling</h2>
        <div className="status-examples">
          <div className="status-example">
            <span className="status-badge status-badge--success">completed</span>
            <span className="status-badge status-badge--success">review_pending</span>
          </div>
          <div className="status-example">
            <span className="status-badge status-badge--neutral">cancelled</span>
          </div>
        </div>
      </section>

      <section className="content-section__section">
        <h2>Best Practices</h2>
        <div className="best-practices">
          <div className="practice-item">
            <h4>✅ Do</h4>
            <ul>
              <li>Use for completed/historical items only</li>
              <li>Filter to appropriate statuses (completed, review_pending, cancelled)</li>
              <li>Provide meaningful scan titles for easy identification</li>
              <li>Implement sorting by date for better UX</li>
              <li>Use in bottom section below priority items</li>
            </ul>
          </div>
          <div className="practice-item">
            <h4>❌ Don't</h4>
            <ul>
              <li>Include pending/processing items (use ProcessingQueueCard)</li>
              <li>Show more than 50 items without pagination</li>
              <li>Override hover action behavior</li>
              <li>Use for real-time updating data</li>
              <li>Remove the sortable functionality</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-section__section">
        <h2>Technical Notes</h2>
        <div className="technical-notes">
          <div className="note-item">
            <h4>Performance</h4>
            <p>TanStack Table provides virtual scrolling capabilities for large datasets. Built-in sorting and filtering are highly optimized.</p>
          </div>
          <div className="note-item">
            <h4>Accessibility</h4>
            <p>Includes proper ARIA labels, keyboard navigation, and screen reader support through semantic table structure.</p>
          </div>
          <div className="note-item">
            <h4>Mobile Responsiveness</h4>
            <p>Actions are always visible on mobile devices to avoid touch interaction issues with hover states.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .column-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--sds-size-space-300);
          margin: var(--sds-size-space-400) 0;
        }

        .column-item {
          padding: var(--sds-size-space-200);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-100);
        }

        .column-item h4 {
          margin: 0 0 var(--sds-size-space-100) 0;
          font-size: var(--font-size-75);
          font-weight: 600;
          color: var(--text-primary);
        }

        .column-item p {
          margin: 0;
          font-size: var(--font-size-75);
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .status-examples {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-200);
          margin: var(--sds-size-space-400) 0;
        }

        .status-example {
          display: flex;
          gap: var(--sds-size-space-200);
        }

        .status-badge {
          display: inline-block;
          padding: var(--sds-size-space-50) var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
          font-size: var(--font-size-75);
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge--success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-badge--neutral {
          background: #f9fafb;
          color: #6b7280;
          border: 1px solid #e5e7eb;
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

        .technical-notes {
          display: grid;
          gap: var(--sds-size-space-300);
          margin: var(--sds-size-space-400) 0;
        }

        .note-item {
          padding: var(--sds-size-space-300);
          background: var(--surface-secondary);
          border-radius: var(--sds-size-radius-200);
        }

        .note-item h4 {
          margin: 0 0 var(--sds-size-space-100) 0;
          font-size: var(--font-size-100);
          color: var(--text-primary);
        }

        .note-item p {
          margin: 0;
          font-size: var(--font-size-75);
          color: var(--text-secondary);
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .best-practices,
          .column-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import Link from 'next/link';

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

interface ScanHistoryTableProps {
  uploads: ScanUpload[];
  onRename?: (upload: ScanUpload) => void;
  onDelete?: (uploadId: string, title: string) => void;
}

export function ScanHistoryTable({ uploads, onRename, onDelete }: ScanHistoryTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'created_at', desc: true } // Most recent first by default
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "scan-history-table__status-badge";
    
    switch (status) {
      case 'completed':
      case 'review_pending':
        return `${baseClasses} ${baseClasses}--success`;
      case 'cancelled':
        return `${baseClasses} ${baseClasses}--neutral`;
      default:
        return `${baseClasses} ${baseClasses}--neutral`;
    }
  };

  const columns: ColumnDef<ScanUpload>[] = [
    {
      accessorKey: 'scan_title',
      header: 'Scan Title',
      cell: ({ row }) => (
        <Link 
          href={`/scans/${row.original.id}`}
          className="scan-history-table__title-link"
        >
          {row.getValue('scan_title') || 'Untitled Scan'}
        </Link>
      ),
    },
    {
      accessorKey: 'processing_status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={getStatusBadge(row.getValue('processing_status'))}>
          {row.getValue('processing_status')}
        </span>
      ),
    },
    {
      accessorKey: 'results.total_cards_detected',
      header: 'Cards',
      cell: ({ row }) => {
        const count = row.original.results?.total_cards_detected;
        return (
          <div className="scan-history-table__cards">
            <span className="scan-history-table__cards-count">
              {count !== undefined ? count : '—'}
            </span>
            {count !== undefined && count > 0 && (
              <span className="scan-history-table__cards-icon">🃏</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Upload Date',
      cell: ({ row }) => (
        <span className="scan-history-table__date">
          {formatDate(row.getValue('created_at'))}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="scan-history-table__actions">
          {onRename && (
            <button 
              className="scan-history-table__action-link"
              onClick={(e) => {
                e.preventDefault();
                onRename(row.original);
              }}
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button 
              className="scan-history-table__action-link scan-history-table__action-link--destructive"
              onClick={(e) => {
                e.preventDefault();
                onDelete(row.original.id, row.original.scan_title || 'Untitled Scan');
              }}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: uploads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (uploads.length === 0) {
    return (
      <div className="scan-history-table__empty">
        <p>No completed scans yet.</p>
      </div>
    );
  }

  return (
    <div className="scan-history-table">
      <table className="scan-history-table__table">
        <thead className="scan-history-table__header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="scan-history-table__header-row">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`scan-history-table__header-cell ${
                    header.column.getCanSort() ? 'scan-history-table__header-cell--sortable' : ''
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="scan-history-table__header-content">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getCanSort() && (
                      <span className="scan-history-table__sort-indicator">
                        {header.column.getIsSorted() === 'asc' ? '↑' : 
                         header.column.getIsSorted() === 'desc' ? '↓' : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="scan-history-table__body">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="scan-history-table__row">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="scan-history-table__cell">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .scan-history-table {
          background: var(--surface-background);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          overflow: hidden;
        }

        .scan-history-table__table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .scan-history-table__header {
          background: var(--surface-secondary);
        }

        .scan-history-table__header-row {
          border-bottom: 1px solid var(--border-default);
        }

        .scan-history-table__header-cell {
          padding: var(--sds-size-space-200) var(--sds-size-space-300);
          text-align: left;
          font-size: var(--font-size-75);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .scan-history-table__header-cell--sortable {
          cursor: pointer;
          user-select: none;
        }

        .scan-history-table__header-cell--sortable:hover {
          background: var(--surface-tertiary);
        }

        .scan-history-table__header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .scan-history-table__sort-indicator {
          margin-left: var(--sds-size-space-100);
          color: var(--text-tertiary);
          font-size: 0.75em;
        }

        .scan-history-table__body {
          background: var(--surface-background);
        }

        .scan-history-table__row {
          border-bottom: 1px solid var(--border-subtle);
          transition: background-color 0.15s ease;
        }

        .scan-history-table__row:hover {
          background: var(--surface-secondary);
        }

        .scan-history-table__row:last-child {
          border-bottom: none;
        }

        .scan-history-table__cell {
          padding: var(--sds-size-space-200) var(--sds-size-space-300);
          font-family: var(--font-inter);
          font-size: var(--font-size-87);
          font-weight: 300;
          color: var(--text-primary);
          vertical-align: middle;
        }

        .scan-history-table__title-link {
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 400; /* Keep titles slightly heavier for readability */
        }

        .scan-history-table__title-link:hover {
          color: var(--interactive-primary);
          text-decoration: underline;
        }

        .scan-history-table__status-badge {
          display: inline-block;
          padding: var(--sds-size-space-50) var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
          font-size: var(--font-size-75);
          font-weight: 500;
          text-transform: capitalize;
        }

        .scan-history-table__status-badge--success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .scan-history-table__status-badge--neutral {
          background: #f9fafb;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .scan-history-table__cards {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-100);
        }

        .scan-history-table__cards-count {
          font-weight: 500;
        }

        .scan-history-table__cards-icon {
          font-size: 0.875em;
        }

        .scan-history-table__date {
          color: var(--text-secondary);
          font-size: var(--font-size-75);
        }

        .scan-history-table__actions {
          display: flex;
          gap: var(--sds-size-space-300);
          justify-content: flex-end;
        }

        .scan-history-table__action-link {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: var(--font-size-75);
          font-family: var(--font-inter);
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
        }

        .scan-history-table__action-link:hover {
          text-decoration: underline;
        }

        .scan-history-table__action-link--destructive {
          color: var(--status-warning);
        }

        .scan-history-table__empty {
          padding: var(--sds-size-space-600) var(--sds-size-space-400);
          text-align: center;
          color: var(--text-secondary);
          font-size: var(--font-size-100);
        }

        @media (max-width: 768px) {
          .scan-history-table__header-cell,
          .scan-history-table__cell {
            padding: var(--sds-size-space-200);
          }

          .scan-history-table__actions {
            opacity: 1; /* Always show actions on mobile */
          }
        }
      `}</style>
    </div>
  );
} 
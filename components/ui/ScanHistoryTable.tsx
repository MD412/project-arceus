'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
  onFlagForTraining?: (uploadId: string) => void;
}

export function ScanHistoryTable({ uploads, onRename, onDelete, onFlagForTraining }: ScanHistoryTableProps) {
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
        <span className="scan-history-table__title">
          {row.getValue('scan_title') || 'Untitled Scan'}
        </span>
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
        <div 
          className="scan-history-table__actions"
          style={{ 
            display: 'flex',
            gap: 'var(--sds-size-space-200)',
            justifyContent: 'flex-end'
          }}
        >
          {/* Review link removed */}
          {onFlagForTraining && row.original.processing_status === 'completed' && (
            <button 
              className="scan-history-table__action-link"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#6b7280',
                fontSize: '12px',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
                              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#2d6a65';
                target.style.textDecorationColor = '#2d6a65';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#6b7280';
                target.style.textDecorationColor = 'transparent';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onFlagForTraining(row.original.id);
              }}
              title="Add this scan to the training dataset"
            >
              Training
            </button>
          )}
          {onRename && (
            <button 
              className="scan-history-table__action-link"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#6b7280',
                fontSize: '12px',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#2d6a65';
                target.style.textDecorationColor = '#2d6a65';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#6b7280';
                target.style.textDecorationColor = 'transparent';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRename(row.original);
              }}
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button 
              className="scan-history-table__action-link scan-history-table__action-link--danger"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#6b7280',
                fontSize: '12px',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#dc2626';
                target.style.textDecorationColor = '#dc2626';
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.color = '#6b7280';
                target.style.textDecorationColor = 'transparent';
              }}
              onClick={(e) => {
                e.stopPropagation();
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
            <tr 
              key={row.id} 
              className="scan-history-table__row"
              onClick={() => {
                // Navigate to scan detail page
                window.location.href = `/scans/review`;
              }}

            >
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
          cursor: pointer;
        }

        .scan-history-table__row:hover {
          background: var(--surface-secondary);
        }

        .scan-history-table__row:hover .scan-history-table__title {
          color: var(--interactive-primary);
        }

        /* Hide actions by default, reveal on row hover */
        .scan-history-table__actions {
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .scan-history-table__row:hover .scan-history-table__actions {
          opacity: 1;
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

        .scan-history-table__title {
          color: var(--text-primary);
          font-weight: 500;
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

        /* Action link base style */
        .scan-history-table__action-link {
          background: none;
          border: none;
          padding: 0;
          color: #6b7280;
          font-size: 12px;
          text-decoration: underline;
          text-decoration-color: transparent;
          cursor: pointer;
          transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }

        .scan-history-table__action-link:hover {
          color: #2d6a65;
          text-decoration-color: #2d6a65;
        }

        .scan-history-table__action-link--danger:hover {
          color: #dc2626;
          text-decoration-color: #dc2626;
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
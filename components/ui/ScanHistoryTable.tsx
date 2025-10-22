'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { Trash, CaretUp, CaretDown } from '@phosphor-icons/react';
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
  onFlagForTraining?: (uploadId: string) => void;
}

type SortField = 'scan_title' | 'processing_status' | 'total_cards_detected' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

export function ScanHistoryTable({ uploads, onRename, onDelete, onFlagForTraining }: ScanHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField | null>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Most recent first by default

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUploads = [...uploads].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    if (sortField === 'total_cards_detected') {
      aValue = a.results?.total_cards_detected ?? 0;
      bValue = b.results?.total_cards_detected ?? 0;
    } else if (sortField === 'scan_title') {
      aValue = a.scan_title || '';
      bValue = b.scan_title || '';
    } else if (sortField === 'processing_status') {
      aValue = a.processing_status || '';
      bValue = b.processing_status || '';
    } else if (sortField === 'created_at') {
      aValue = new Date(a.created_at).getTime();
      bValue = new Date(b.created_at).getTime();
    }

    // Handle null/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // String comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    // Number comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
      case 'review_pending':
        return 'status-badge status-badge--success';
      case 'cancelled':
        return 'status-badge status-badge--neutral';
      default:
        return 'status-badge status-badge--neutral';
    }
  };

  const SortableHeader = ({ field, children, ...props }: { field: SortField; children: React.ReactNode; [key: string]: any }) => (
    <TableHead
      className="circuit-table-head--sortable"
      onClick={() => handleSort(field)}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none' }}>
        {children}
        {sortField === field && sortDirection === 'asc' && <CaretUp size={14} weight="bold" />}
        {sortField === field && sortDirection === 'desc' && <CaretDown size={14} weight="bold" />}
      </div>
    </TableHead>
  );

  if (uploads.length === 0) {
    return (
      <div style={{ padding: 'var(--sds-size-space-600) var(--sds-size-space-400)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No completed scans yet.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHeader field="scan_title">Scan Title</SortableHeader>
          <SortableHeader field="processing_status" style={{ width: '140px' }}>Status</SortableHeader>
          <SortableHeader field="total_cards_detected" style={{ width: '100px' }}>Cards</SortableHeader>
          <SortableHeader field="created_at" style={{ width: '120px' }}>Uploaded</SortableHeader>
          <TableHead style={{ width: '200px' }}>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedUploads.map((upload) => (
          <TableRow
            key={upload.id}
            onClick={() => window.location.href = `/scans/${upload.id}`}
            style={{ cursor: 'pointer' }}
          >
            <TableCell className="table-scan-name">{upload.scan_title || 'Untitled Scan'}</TableCell>
            <TableCell className="circuit-table-cell--center">
              <span className={getStatusBadgeClass(upload.processing_status)}>
                {upload.processing_status.replace('_', ' ')}
              </span>
            </TableCell>
            <TableCell className="circuit-table-cell--numeric">
              {upload.results?.total_cards_detected ?? '—'}
            </TableCell>
            <TableCell className="circuit-table-cell--numeric table-date-cell">
              {formatDate(upload.created_at)}
            </TableCell>
            <TableCell>
              <div className="table-actions" style={{ display: 'flex', gap: 'var(--sds-size-space-200)', justifyContent: 'flex-end' }}>
                {onFlagForTraining && upload.processing_status === 'completed' && (
                  <button
                    className="table-action-button table-action-button--secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlagForTraining(upload.id);
                    }}
                    title="Add this scan to the training dataset"
                  >
                    Training
                  </button>
                )}
                {onRename && (
                  <button
                    className="table-action-button table-action-button--secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename(upload);
                    }}
                  >
                    Rename
                  </button>
                )}
                {onDelete && (
                  <button
                    className="table-action-button table-action-button--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(upload.id, upload.scan_title || 'Untitled Scan');
                    }}
                    aria-label="Delete scan"
                  >
                    <Trash size={18} weight="regular" className="table-action-icon" />
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
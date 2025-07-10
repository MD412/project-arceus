import React from 'react';
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

interface ProcessingQueueCardProps {
  upload: ScanUpload;
  onRetry?: (uploadId: string) => void;
  onRename?: (upload: ScanUpload) => void;
  onDelete?: (uploadId: string, title: string) => void;
}

export function ProcessingQueueCard({ upload, onRetry, onRename, onDelete }: ProcessingQueueCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'blue';
      case 'queued':
        return 'yellow';
      case 'failed':
      case 'timeout':
        return 'red';
      default:
        return 'gray';
    }
  };

  const menuItems = [
    {
      label: 'Rename',
      onClick: () => onRename && onRename(upload),
      disabled: !onRename,
    },
    {
      label: 'Delete',
      onClick: () => onDelete && onDelete(upload.id, upload.scan_title || 'Untitled Scan'),
      destructive: true,
      disabled: !onDelete,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'queued':
        return '⏰';
      case 'failed':
      case 'timeout':
        return '❌';
      default:
        return '⚪';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="processing-queue-card">
      <div className="processing-queue-card__header">
        <div className="processing-queue-card__title-section">
          <Link href={`/scans/${upload.id}`} className="processing-queue-card__title">
            {upload.scan_title || 'Untitled Scan'}
          </Link>
          <span className="processing-queue-card__timestamp">
            {formatTimeAgo(upload.created_at)}
          </span>
        </div>
        
        <div className={`processing-queue-card__status processing-queue-card__status--${getStatusColor(upload.processing_status)}`}>
          <span className="processing-queue-card__status-icon">{getStatusIcon(upload.processing_status)}</span>
          <span className="processing-queue-card__status-text">{upload.processing_status}</span>
        </div>
      </div>

      {/* Progress bar for processing status */}
      {upload.processing_status === 'processing' && (
        <div className="processing-queue-card__progress">
          <div className="processing-queue-card__progress-bar">
            <div className="processing-queue-card__progress-fill"></div>
          </div>
          <span className="processing-queue-card__progress-text">Processing cards...</span>
        </div>
      )}

      {/* Error message for failed status */}
      {(upload.processing_status === 'failed' || upload.processing_status === 'timeout') && (
        <div className="processing-queue-card__error">
          <span className="processing-queue-card__error-text">
            {upload.error_message || 'Processing failed. Please try again.'}
          </span>
        </div>
      )}

      {/* Queue message */}
      {upload.processing_status === 'queued' && (
        <div className="processing-queue-card__queue">
          <span className="processing-queue-card__queue-text">
            Waiting in queue for processing...
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="processing-queue-card__actions">
        <div className="spacer" />
        {(upload.processing_status === 'failed' || upload.processing_status === 'timeout') && onRetry && (
          <button 
            className="processing-queue-card__action-link"
            onClick={() => onRetry(upload.id)}
          >
            Retry
          </button>
        )}
        
        {onRename && (
          <button 
            className="processing-queue-card__action-link"
            onClick={() => onRename(upload)}
          >
            Rename
          </button>
        )}
        
        {onDelete && (
          <button 
            className="processing-queue-card__action-link processing-queue-card__action-link--destructive"
            onClick={() => onDelete(upload.id, upload.scan_title || 'Untitled Scan')}
          >
            Delete
          </button>
        )}
      </div>

      <style jsx>{`
        .processing-queue-card {
          background: var(--surface-background);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          padding: var(--sds-size-space-400);
          padding-bottom: var(--sds-size-space-300);
          transition: all 0.2s ease;
        }
        
        .processing-queue-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--sds-size-space-300);
        }
        
        .processing-queue-card__title-section {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-100);
        }
        
        .processing-queue-card__title {
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: none;
          font-size: var(--font-size-200);
        }
        
        .processing-queue-card__title:hover {
          color: var(--interactive-primary);
        }
        
        .processing-queue-card__timestamp {
          font-size: var(--font-size-75);
          color: var(--text-secondary);
        }
        
        .processing-queue-card__status {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-100);
          padding: var(--sds-size-space-100) var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
          font-size: var(--font-size-75);
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .processing-queue-card__status--blue {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        
        .processing-queue-card__status--yellow {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fed7aa;
        }
        
        .processing-queue-card__status--red {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .processing-queue-card__status--gray {
          background: #f9fafb;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }
        
        .processing-queue-card__progress {
          margin-bottom: var(--sds-size-space-300);
        }
        
        .processing-queue-card__progress-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: var(--sds-size-space-100);
        }
        
        .processing-queue-card__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 2px;
          animation: progress-indeterminate 2s ease-in-out infinite;
        }
        
        @keyframes progress-indeterminate {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 40%;
            margin-left: 30%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        
        .processing-queue-card__progress-text {
          font-size: var(--font-size-75);
          color: var(--text-secondary);
        }
        
        .processing-queue-card__error,
        .processing-queue-card__queue {
          margin-bottom: 0;
          padding: var(--sds-size-space-200);
          border-radius: var(--sds-size-radius-100);
        }
        
        .processing-queue-card__error {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        
        .processing-queue-card__error-text {
          font-size: var(--font-size-75);
          color: #dc2626;
        }
        
        .processing-queue-card__queue {
          background: #fffbeb;
          border: 1px solid #fed7aa;
        }
        
        .processing-queue-card__queue-text {
          font-size: var(--font-size-75);
          color: #d97706;
        }
        
        .processing-queue-card__actions {
          display: flex;
          gap: var(--sds-size-space-300);
          margin-top: var(--sds-size-space-300);
          width: 100%;
        }

        .processing-queue-card__actions .spacer {
          flex-grow: 1;
        }

        .processing-queue-card__action-link {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font-size: var(--font-size-75);
          font-family: var(--font-inter);
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          min-height: auto;
        }

        .processing-queue-card__action-link:hover {
          text-decoration: underline;
        }

        .processing-queue-card__action-link--destructive {
          color: var(--status-warning);
        }
        
        @media (max-width: 768px) {
          .processing-queue-card__header {
            flex-direction: column;
            gap: var(--sds-size-space-200);
          }
          
          .processing-queue-card__actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
} 
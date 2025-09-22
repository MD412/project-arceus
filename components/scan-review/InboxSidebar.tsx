'use client';

import React from 'react';
import { useReviewInbox } from '@/hooks/useReviewInbox';
import styles from './InboxSidebar.module.css';
import { SpinnerGap, FileImage } from '@phosphor-icons/react';

interface InboxSidebarProps {
  activeId: string | undefined;
  onSelect: (id: string) => void;
  hiddenIds?: string[];
}

export default function InboxSidebar({ activeId, onSelect, hiddenIds = [] }: InboxSidebarProps) {
  const { data: items, isLoading, isFetching, error } = useReviewInbox();

  // Defensive: hide any zero-card scans that may leak from inconsistent views
  const visibleItems = React.useMemo(
    () => (items || []).filter(i => (i.total_detections ?? 0) > 0 && !hiddenIds.includes(i.id)),
    [items, hiddenIds]
  );

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.heading}>Scans</h3>

      {isLoading && !items && (
        <div className={styles.loading}>
          <SpinnerGap size={16} weight="bold" />
          Loading scans…
        </div>
      )}

      {(!isLoading && (!visibleItems || visibleItems.length === 0)) || error ? (
        <div className={styles.empty}>
          <FileImage size={16} />
          {error ? 'Failed to load scans' : 'No scans pending'}
        </div>
      ) : null}

      <ul className={styles.list}>
        {visibleItems?.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${activeId === item.id ? styles.active : ''}`}
          >
            <button onClick={() => onSelect(item.id)} className={styles.button} data-scan-id={item.id} data-testid="inbox-scan-item">
              <div className={styles.content}>
                <span className={styles.title}>{item.id}</span>
                <span className={styles.count}>{item.total_detections} cards · added {new Date(item.created_at).toLocaleString()}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

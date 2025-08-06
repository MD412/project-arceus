'use client';

import React from 'react';
import { useReviewInbox } from '@/hooks/useReviewInbox';
import styles from './InboxSidebar.module.css';
import { SpinnerGap, FileImage } from '@phosphor-icons/react';

interface InboxSidebarProps {
  activeId: string | undefined;
  onSelect: (id: string) => void;
}

export default function InboxSidebar({ activeId, onSelect }: InboxSidebarProps) {
  const { data: items, isLoading, isFetching, error } = useReviewInbox();

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.heading}>Scans</h3>

      {isLoading && !items && (
        <div className={styles.loading}>
          <SpinnerGap size={16} weight="bold" />
          Loading scans…
        </div>
      )}

      {(!isLoading && (!items || items.length === 0)) || error ? (
        <div className={styles.empty}>
          <FileImage size={16} />
          {error ? 'Failed to load scans' : 'No scans pending'}
        </div>
      ) : null}

      <ul className={styles.list}>
        {items?.map((item) => (
          <li
            key={item.id}
            className={`${styles.item} ${activeId === item.id ? styles.active : ''}`}
          >
            <button onClick={() => onSelect(item.id)} className={styles.button}>
              <div className={styles.content}>
                <span className={styles.title}>{item.title ?? 'Untitled Scan'}</span>
                <span className={styles.count}>{item.total_detections} cards</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

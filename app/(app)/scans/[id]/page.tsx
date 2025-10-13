'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DetectionGrid from '@/components/scan-review/DetectionGrid';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

export default function ScanDetailPage() {
  const params = useParams<{ id: string }>();
  const scanId = params?.id as string;

  return (
    <PageLayout title="Scan Detail" description="Review detected cards for this scan" hideHeader={true} noPadding>
      <div className={styles.scanDetailContainer}>
        {/* Fixed header with breadcrumbs and actions */}
        <header className={styles.scanDetailHeader}>
          <div className={styles.scanDetailHeaderContent}>
            <div className={styles.scanDetailBreadcrumbs}>
              <Breadcrumbs
                items={[
                  { label: 'Collection', href: '/' },
                  { label: 'My Scans', href: '/scans' },
                  { label: 'Scan Detail' },
                ]}
              />
            </div>
            <div className={styles.scanDetailActions}>
              <button className="u-text-link u-text-link--muted" onClick={() => { /* no-op placeholder */ }} title="Approve all">
                Approve all
              </button>
              <button className="u-text-link u-text-link--muted" onClick={() => { /* no-op placeholder */ }} title="Discard scan">
                Discard scan
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable card grid */}
        <div className={styles.scanDetailGridContainer}>
          {scanId && (
            <DetectionGrid scanId={scanId} onReviewed={() => {}} hideBulkActions />
          )}
        </div>
      </div>
    </PageLayout>
  );
}



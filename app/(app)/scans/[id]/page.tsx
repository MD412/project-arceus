'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import DetectionGrid from '@/components/scan-review/DetectionGrid';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useParams } from 'next/navigation';

export default function ScanDetailPage() {
  const params = useParams<{ id: string }>();
  const scanId = params?.id as string;

  return (
    <PageLayout title="Scan Detail" description="Review detected cards for this scan" hideHeader={true} noPadding>
      <div style={{ padding: 'var(--sds-size-space-400)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-300)' }}>
          <div style={{ flex: 1 }}>
            <Breadcrumbs
              items={[
                { label: 'Collection', href: '/' },
                { label: 'My Scans', href: '/scans' },
                { label: 'Scan Detail' },
              ]}
            />
          </div>
          {/* Right-aligned subtle text links matching breadcrumb color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sds-size-space-300)' }}>
            <button className="u-text-link u-text-link--muted" onClick={() => { /* no-op placeholder */ }} title="Approve all">
              Approve all
            </button>
            <button className="u-text-link u-text-link--muted" onClick={() => { /* no-op placeholder */ }} title="Discard scan">
              Discard scan
            </button>
          </div>
        </div>

        {scanId && (
          <DetectionGrid scanId={scanId} onReviewed={() => {}} hideBulkActions />
        )}
      </div>
    </PageLayout>
  );
}



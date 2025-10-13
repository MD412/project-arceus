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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative'
      }}>
        {/* Fixed header with breadcrumbs and actions */}
        <div style={{ 
          padding: 'var(--sds-size-space-400)',
          background: 'var(--background-default)',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
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
        </div>

        {/* Scrollable card grid */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          padding: 'var(--sds-size-space-400)'
        }}>
          {scanId && (
            <DetectionGrid scanId={scanId} onReviewed={() => {}} hideBulkActions />
          )}
        </div>
      </div>
    </PageLayout>
  );
}



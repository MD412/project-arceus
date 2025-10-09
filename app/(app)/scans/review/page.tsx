'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ScanReviewShell from '@/components/scan-review/ScanReviewShell';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default function ReviewInboxPage() {
  return (
    <PageLayout title="Scans" description="Triage your completed scans and approve cards." hideHeader={true} noPadding>
      <div style={{ padding: 'var(--sds-size-space-400)' }}>
        <Breadcrumbs items={[{ label: 'Collection', href: '/' }, { label: 'My Scans' }, { label: 'Review Inbox' }]} />
      </div>
      <ScanReviewShell />
    </PageLayout>
  );
}

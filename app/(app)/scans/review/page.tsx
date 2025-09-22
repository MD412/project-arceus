'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ScanReviewShell from '@/components/scan-review/ScanReviewShell';

export default function ReviewInboxPage() {
  return (
    <PageLayout title="Scans" description="Triage your completed scans and approve cards." hideHeader={true} noPadding>
      <ScanReviewShell />
    </PageLayout>
  );
}

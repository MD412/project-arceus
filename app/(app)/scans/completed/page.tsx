'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { ScanHistoryTable } from '@/components/ui/ScanHistoryTable';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useJobs } from '@/hooks/useJobs';

export default function CompletedScansPage() {
  const { data: uploads = [] } = useJobs();
  const completed = (uploads as any[])?.filter(upload => ['completed', 'review_pending', 'cancelled', 'ready'].includes(upload.processing_status)) || [];

  return (
    <PageLayout title="Scan History" description="All finished scans in your workspace">
      <ContentSection title="" headingLevel={2}>
        <Breadcrumbs
          items={[
            { label: 'Collection', href: '/' },
            { label: 'My Scans', href: '/scans' },
            { label: 'Scan History' },
          ]}
        />

        <ScanHistoryTable uploads={completed} />
      </ContentSection>
    </PageLayout>
  );
}



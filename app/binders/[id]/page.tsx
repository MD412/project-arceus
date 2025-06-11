'use client';

import React from 'react';
import { useJob } from '@/hooks/useJobs';
import Image from 'next/image';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

interface BinderPageProps {
  params: {
    id: string;
  };
}

const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function BinderDetailPage({ params }: BinderPageProps) {
  const { id: jobId } = React.use(params as any) as { id: string };
  const { data: job, isLoading, isError, error } = useJob(jobId);

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e'; // green-500
      case 'processing': return '#3b82f6'; // blue-500
      case 'pending': return '#f97316'; // orange-500
      case 'failed': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  };

  if (isLoading) {
    // Placeholder UI: Loading state
    return (
        <PageLayout title="Loading Binder..." description="Fetching the details of your processed binder.">
            <div className="placeholder">Loading...</div>
        </PageLayout>
    );
  }

  if (isError || !job) {
    // Placeholder UI: Error state
    return (
        <PageLayout title="Error" description="Could not load binder details.">
            <div className="placeholder error">
                <p>Couldn't load binder details.</p>
                <p>{(error as Error)?.message || 'Job not found.'}</p>
            </div>
        </PageLayout>
    );
  }

  return (
    <PageLayout
      title={job.binder_title || 'Binder Details'}
      description={`Review the results for binder processed on ${new Date(job.created_at).toLocaleDateString()}`}
    >
      <ContentSection title="Processing Summary" headingLevel={2}>
        <div className="summary-card">
            <div className="status-chip" style={{ backgroundColor: getStatusChipColor(job.status) }}>
                {job.status}
            </div>
            <p><strong>Total Cards Detected:</strong> {job.results?.total_cards_detected ?? 0}</p>
            {job.results?.summary_image_path && (
                <Image
                    src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${job.results.summary_image_path}`}
                    alt={`Summary view of ${job.binder_title}`}
                    width={800}
                    height={600}
                    className="summary-image"
                />
            )}
        </div>
      </ContentSection>

      <ContentSection title="Detected Cards" headingLevel={2}>
        {job.status === 'completed' ? (
          <div className="card-grid">
            {job.results?.detected_card_paths && job.results.detected_card_paths.length > 0 ? (
              job.results.detected_card_paths.map((path: string, index: number) => (
                <div key={path} className="card-slot">
                  <Image
                    src={`${SUPABASE_PUBLIC_URL}/storage/v1/object/public/binders/${path}`}
                    alt={`Detected card ${index + 1}`}
                    width={240}
                    height={336}
                    className="card-image"
                  />
                </div>
              ))
            ) : (
              <p>The vision pipeline ran successfully, but no individual cards were detected in this image.</p>
            )}
          </div>
        ) : (
          <p>Individual card results will be shown here once processing is complete.</p>
        )}
      </ContentSection>
      <style jsx>{`
        .placeholder { padding: 2rem; text-align: center; }
        .error { color: var(--color-error-600); }
        .summary-card { padding: 1rem; border: 1px solid var(--border-subtle); border-radius: var(--sds-size-radius-100); }
        .summary-image { width: 100%; height: auto; margin-top: 1rem; border-radius: var(--sds-size-radius-100); }
        .status-chip { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; color: white; margin-bottom: 1rem; }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
        .card-slot { border: 1px solid var(--border-default); border-radius: var(--sds-size-radius-100); padding: 0.5rem; background: var(--surface-background); }
        .card-image { width: 100%; height: auto; border-radius: var(--sds-size-radius-100); }
      `}</style>
    </PageLayout>
  );
} 
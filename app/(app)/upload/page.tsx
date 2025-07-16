'use client';

import ScanUploadForm from '@/components/scans/ScanUploadForm';
import PageLayout from '@/components/layout/PageLayout';

export default function UploadPage() {
  return (
    <PageLayout 
      title="Upload New Scans" 
      description="Upload photos of your Pokemon cards to start processing. Supports JPEG, PNG, WebP, and HEIC formats."
    >
      <div className="upload-page-container">
        <ScanUploadForm />
      </div>
      
      <style jsx>{`
        .upload-page-container {
          max-width: 600px;
          margin: 0 auto;
          padding: var(--sds-size-space-600);
          background: var(--surface-background);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
        }
      `}</style>
    </PageLayout>
  );
} 
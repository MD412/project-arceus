'use client';

import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { Dropzone } from '@/app/(circuitds)/circuitds/components/dropzone/Dropzone';
import styles from './scan-upload.module.css';

export default function ScanUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = async (files: File[]) => {
    console.log('Files dropped:', files);
    setUploadedFiles(files);
    
    // TODO: Implement actual upload logic
    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      // Here you would typically:
      // 1. Upload files to Supabase storage
      // 2. Create scan_upload record
      // 3. Queue worker job
      // 4. Redirect to scan review
    }, 2000);
  };

  const handleError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload error: ${error.message}`);
  };

  return (
    <PageLayout
      title="Upload Scan"
      description="Upload images to be scanned and identified"
    >
      <ContentSection title="" headingLevel={2}>
        <div className={styles.container}>
          <Dropzone
            onDrop={handleDrop}
            onError={handleError}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
            maxFiles={20}
            maxSize={10 * 1024 * 1024} // 10MB
            minSize={1024} // 1KB
          />
          
          {isUploading && (
            <div className={styles.uploadingStatus}>
              <p>Processing upload...</p>
            </div>
          )}
          
          {uploadedFiles.length > 0 && !isUploading && (
            <div className={styles.uploadResults}>
              <h3>Ready to Process</h3>
              <p>{uploadedFiles.length} file(s) uploaded successfully</p>
              <button className={styles.processButton}>
                Start Processing
              </button>
            </div>
          )}
        </div>
      </ContentSection>
    </PageLayout>
  );
} 
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import { Dropzone } from '@/app/(circuitds)/circuitds/components/dropzone/Dropzone';
import { Button } from '@/components/ui/Button';
import { CircleNotch } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import styles from './scan-upload.module.css';

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export default function ScanUploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;
    
    console.log('Files dropped:', files);
    setUploadState('uploading');
    setErrorMessage('');

    try {
      // Create FormData for bulk upload
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // Upload files to API
      const response = await fetch('/api/scans/bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      setUploadState('processing');
      
      // Auto-redirect to first scan review after processing starts
      if (result.scans && result.scans.length > 0) {
        const firstScanId = result.scans[0].scan_id;
        toast.success(`${result.count} files uploaded successfully! Processing your cards...`);
        
        // Wait a moment for processing to start, then redirect
        setTimeout(() => {
          router.push(`/scans/review`);
        }, 1500);
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setErrorMessage(errorMessage);
      setUploadState('error');
      toast.error(`Upload failed: ${errorMessage}`);
    }
  };

  const handleError = (error: Error) => {
    console.error('Dropzone error:', error);
    setErrorMessage(error.message);
    setUploadState('error');
    toast.error(`Upload error: ${error.message}`);
  };

  const handleRetry = () => {
    setUploadState('idle');
    setErrorMessage('');
  };

  const getStatusMessage = () => {
    switch (uploadState) {
      case 'uploading':
        return 'Uploading your files...';
      case 'processing':
        return 'Processing your cards...';
      case 'success':
        return 'Upload successful! Redirecting to review...';
      case 'error':
        return `Upload failed: ${errorMessage}`;
      default:
        return '';
    }
  };

  const isProcessing = uploadState === 'uploading' || uploadState === 'processing';

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
            disabled={isProcessing}
          />
          
          {isProcessing && (
            <div className={styles.processingStatus}>
              <div className={styles.processingContent}>
                <CircleNotch size={24} className={styles.spinner} />
                <p className={styles.processingText}>{getStatusMessage()}</p>
              </div>
            </div>
          )}
          
          {uploadState === 'error' && (
            <div className={styles.errorStatus}>
              <p className={styles.errorText}>{getStatusMessage()}</p>
              <Button 
                variant="secondary" 
                onClick={handleRetry}
                className={styles.retryButton}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </ContentSection>
    </PageLayout>
  );
} 
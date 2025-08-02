'use client';

import React, { useState } from 'react';
import { Dropzone } from './Dropzone';
import styles from './dropzone.module.css';

export default function DropzonePage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDrop = (files: File[]) => {
    console.log('Files dropped:', files);
    setUploadedFiles(files);
  };

  const handleError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload error: ${error.message}`);
  };

  return (
    <div className={styles.pageContainer}>
      <h1>Dropzone Component</h1>
      <p>Drag and drop files to upload them.</p>
      
      <Dropzone
        onDrop={handleDrop}
        onError={handleError}
        accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
        maxFiles={10}
        maxSize={10 * 1024 * 1024} // 10MB
        minSize={1024} // 1KB
      />
      
      {uploadedFiles.length > 0 && (
        <div className={styles.results}>
          <h2>Upload Results</h2>
          <p>Successfully uploaded {uploadedFiles.length} file(s)</p>
        </div>
      )}
    </div>
  );
} 
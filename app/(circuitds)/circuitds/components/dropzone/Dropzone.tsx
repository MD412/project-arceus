'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from '@phosphor-icons/react';
import styles from './dropzone.module.css';

interface DropzoneProps {
  onDrop?: (files: File[]) => void;
  onError?: (error: Error) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  minSize?: number;
  disabled?: boolean;
  className?: string;
}

export function Dropzone({
  onDrop,
  onError,
  accept = { 'image/*': [] },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  minSize = 1024, // 1KB
  disabled = false,
  className
}: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDropCallback = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const message = fileRejections[0]?.errors[0]?.message;
      onError?.(new Error(message));
      return;
    }
    
    setFiles(acceptedFiles);
    onDrop?.(acceptedFiles);
  }, [onDrop, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    disabled,
    onDrop: onDropCallback
  });

  return (
    <div className={styles.dropzoneWrapper}>
      <div
        {...getRootProps()}
        className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''} ${className || ''}`}
      >
        <input {...getInputProps()} />
        
        <div className={styles.uploadContent}>
          <div className={styles.uploadIcon}>
            <Upload size={48} weight="light" />
          </div>
          
          <h2 className={styles.uploadTitle}>
            Upload images to be scanned
          </h2>
          
          <p className={styles.uploadSubtitle}>
            Drop as many images as you want here!
          </p>
          
          <div className={styles.dropArea}>
            <p className={styles.dropText}>Drop Files here</p>
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index} className={styles.fileItem}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
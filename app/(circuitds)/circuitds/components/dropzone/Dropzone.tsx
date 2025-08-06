'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash } from '@phosphor-icons/react';
import IconButton from '@/components/ui/IconButton';
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

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    onDrop?.(newFiles); // Update parent component with new file list
  };

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
        role="button"
        tabIndex={0}
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
            <p className={styles.dropText}>Click to browse files</p>
          </div>
        </div>
      </div>
      
      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3>Selected Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index} className={styles.fileItem}>
                <span className={styles.fileName}>{file.name}</span>
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className={styles.removeButton}
                >
                  <Trash size={16} weight="light" />
                </IconButton>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import styles from './ApproveScanButton.module.css';

interface ApproveScanButtonProps {
  scanId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function ApproveScanButton({ 
  scanId, 
  onSuccess, 
  onError, 
  disabled = false 
}: ApproveScanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleApprove = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setIsSuccess(false);

    try {
      const response = await fetch(`/api/scans/${scanId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve scan');
      }

      setIsSuccess(true);
      onSuccess?.(result);

      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (error) {
      console.error('Approve scan error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Button
        onClick={handleApprove}
        disabled={disabled || isLoading}
        variant={isSuccess ? "success" : "primary"}
      >
        {isLoading ? (
          <>
            <div className={styles.spinner}></div>
            Approving...
          </>
        ) : isSuccess ? (
          <>
            ✅ Approved
          </>
        ) : (
          <>
            📚 Approve Scan
          </>
        )}
      </Button>
      
      {isSuccess && (
        <div className={styles.successMessage}>
          Cards added to your collection!
        </div>
      )}
    </div>
  );
} 
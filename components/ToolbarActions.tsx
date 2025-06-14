'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadCardForm from '@/components/UploadCardForm';
import { Modal } from '@/components/ui/Modal';
import BinderUploadForm from '@/components/binder/BinderUploadForm';

/**
 * Centralised toolbar actions that appear in the main app layout.
 * Handles interaction logic for:
 *  • “Add Card” – opens UploadCardForm modal.
 *  • “Process Scan” – opens BinderUploadForm modal.
 */
export default function ToolbarActions() {
  const router = useRouter();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  return (
    <>
      {/* Add Card */}
      <button
        className="toolbar-action-button with-text"
        aria-label="Add Card"
        onClick={() => setShowAddCard(true)}
      >
        + Add Card
      </button>

      {/* Process Scan */}
      <button
        className="toolbar-action-button with-text"
        aria-label="Process Scan"
        onClick={() => setShowScanModal(true)}
      >
        + Process Scan
      </button>

      {/* Modal – shown when Add Card button pressed */}
      {showAddCard && (
        <UploadCardForm
          close={() => setShowAddCard(false)}
          // After adding a card, close modal & refresh data across pages
          onAdded={() => {
            setShowAddCard(false);
            router.refresh();
          }}
        />
      )}

      {/* Modal – Process Scan */}
      {showScanModal && (
        <Modal open={true} onClose={() => setShowScanModal(false)} title="Upload New Scan">
          <BinderUploadForm close={() => {
            setShowScanModal(false);
            router.refresh();
          }} />
        </Modal>
      )}
    </>
  );
} 
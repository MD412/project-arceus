'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { BaseModal } from './BaseModal';
import { Input } from '../forms/Input';

interface RenameScanModalProps {
  currentTitle: string;
  onRename: (newTitle: string) => void;
  onClose: () => void;
}

export function RenameScanModal({ currentTitle, onRename, onClose }: RenameScanModalProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(newTitle.trim());
      onClose();
    }
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title="Rename Scan" className="rename-scan-modal">
      <form onSubmit={handleSubmit} className="rename-scan-modal__form">
        <p className="rename-scan-modal__description">Enter a new title for your scan:</p>
        <Input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new scan title"
          autoFocus
        />
        <div className="rename-scan-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!newTitle.trim()}>
            Save
          </Button>
        </div>
      </form>
    </BaseModal>
  );
} 
'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
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
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="rename-modal-content">
        <h2 className="modal-title">Rename Scan</h2>
        <p>Enter a new title for your scan:</p>
        <Input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter new scan title"
          autoFocus
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!newTitle.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
} 
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';

interface RenameBinderModalProps {
  currentTitle: string;
  onRename: (newTitle: string) => void;
  onClose: () => void;
}

export const RenameBinderModal: React.FC<RenameBinderModalProps> = ({ currentTitle, onRename, onClose }) => {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [error, setError] = useState('');

  const handleRename = () => {
    if (!newTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }
    onRename(newTitle.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">Rename Scan</h2>
        <p>Enter a new title for your scan:</p>
        
        <Input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
          error={error}
        />
        
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleRename}>Save</Button>
        </div>
      </div>
    </div>
  );
}; 
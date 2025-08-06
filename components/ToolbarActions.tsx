'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadCardForm from '@/components/UploadCardForm';
import { Button } from './ui/Button';
import { Home, ScanLine, Layers, PlusCircle, Settings, HelpCircle, User, PanelLeftClose, PanelLeft } from 'lucide-react';

interface ToolbarActionsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

/**
 * Centralised toolbar actions that appear in the main app layout.
 * Uses Figma auto-layout principles with flex space-between.
 * Layout: [Minimize] <----flexible space----> [Add Card][Process Scan]
 */
export default function ToolbarActions({ isMinimized = false, onToggleMinimize }: ToolbarActionsProps = {}) {
  const router = useRouter();
  const [showAddCard, setShowAddCard] = useState(false);

  return (
    <div className="action-toolbar">
      
      {/* Left Group: Sidebar Control */}
      <div className="toolbar-left-actions">
        {onToggleMinimize && (
          <Button
            variant="toolbar"
            aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
            title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
            onClick={onToggleMinimize}
          >
            {isMinimized ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </Button>
        )}
      </div>

      {/* Right Group: Primary Actions */}
      <div className="toolbar-right-actions">
        <Button
          variant="toolbar"
          aria-label="Add Card"
          onClick={() => {
            console.log('Add Card button clicked, setting state to true.');
            setShowAddCard(true);
          }}
        >
          + Add Card
        </Button>

        <Button
          variant="toolbar"
          aria-label="Process Scan"
          onClick={() => {
            console.log('Process Scan button clicked, navigating to scan-upload page.');
            router.push('/scan-upload');
          }}>
          + Process Scan
        </Button>
      </div>

      {/* Modals */}
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


    </div>
  );
} 
'use client';

import React from 'react';
import styles from './CollectionFilters.module.css';
import { Dropdown } from './Dropdown';

export interface CollectionFiltersState {
  query: string;
  setCode: string;
  rarity: string;
  viewMode?: 'grid' | 'table';
}

interface SetOption {
  code: string;
  name: string;
}

interface CollectionFiltersProps {
  value: CollectionFiltersState;
  onChange: (next: CollectionFiltersState) => void;
  setOptions: SetOption[];
  rarityOptions: string[];
  className?: string;
}

export function CollectionFilters({ value, onChange, setOptions, rarityOptions, className = '' }: CollectionFiltersProps) {
  const update = (partial: Partial<CollectionFiltersState>) => onChange({ ...value, ...partial });
  const viewMode = value.viewMode || 'grid';

  // Find the current set name for display
  const currentSetName = setOptions.find(s => s.code === value.setCode)?.name || 'All Sets';

  return (
    <div className={`${styles.toolbar} ${className}`}>
      <div className={styles.searchWrap}>
        <input
          type="text"
          value={value.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Search name or number…"
          className={styles.search}
        />
      </div>

      <div className={styles.filtersRow}>
        <Dropdown
          trigger={<button className={`button_button_uCVc button_button_filter_uCVc`}>{currentSetName}</button>}
          items={[
            { label: 'All Sets', href: '#all' }, 
            ...setOptions.map((s) => ({ label: s.name, href: `#${s.code}` }))
          ]}
          onItemClick={(item) => {
            const selectedSet = setOptions.find(s => s.name === item.label);
            update({ setCode: selectedSet ? selectedSet.code : '' });
          }}
        />

        <Dropdown
          trigger={<button className={`button_button_uCVc button_button_filter_uCVc`}>{value.rarity || 'All Rarities'}</button>}
          items={[{ label: 'All Rarities', href: '#' }, ...rarityOptions.map((r) => ({ label: r, href: `#${r}` }))]}
          onItemClick={(item) => update({ rarity: item.label === 'All Rarities' ? '' : item.label })}
        />

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
            onClick={() => update({ viewMode: 'grid' })}
            aria-label="Grid view"
            title="Grid view"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'table' ? styles.viewButtonActive : ''}`}
            onClick={() => update({ viewMode: 'table' })}
            aria-label="Table view"
            title="Table view"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="3" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="2" rx="0.5" fill="currentColor"/>
              <rect x="1" y="11" width="14" height="2" rx="0.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CollectionFilters;



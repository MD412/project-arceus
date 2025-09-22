'use client';

import React from 'react';
import styles from './CollectionFilters.module.css';
import { Dropdown } from './Dropdown';

export interface CollectionFiltersState {
  query: string;
  setCode: string;
  rarity: string;
}

interface CollectionFiltersProps {
  value: CollectionFiltersState;
  onChange: (next: CollectionFiltersState) => void;
  setOptions: string[];
  rarityOptions: string[];
  className?: string;
}

export function CollectionFilters({ value, onChange, setOptions, rarityOptions, className = '' }: CollectionFiltersProps) {
  const update = (partial: Partial<CollectionFiltersState>) => onChange({ ...value, ...partial });

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

      <Dropdown
        trigger={<button className={styles.selectButton}>{value.setCode || 'All Sets'}</button>}
        items={[{ label: 'All Sets', href: '#' }, ...setOptions.map((s) => ({ label: s, href: `#${s}` }))]}
        onItemClick={(item) => update({ setCode: item.label === 'All Sets' ? '' : item.label })}
      />

      <Dropdown
        trigger={<button className={styles.selectButton}>{value.rarity || 'All Rarities'}</button>}
        items={[{ label: 'All Rarities', href: '#' }, ...rarityOptions.map((r) => ({ label: r, href: `#${r}` }))]}
        onItemClick={(item) => update({ rarity: item.label === 'All Rarities' ? '' : item.label })}
      />
    </div>
  );
}

export default CollectionFilters;



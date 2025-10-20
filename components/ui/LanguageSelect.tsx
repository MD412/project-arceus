import React from 'react';
import { LANGUAGES, type LanguageCode } from '@/lib/languages';
import styles from './LanguageSelect.module.css';

interface LanguageSelectProps {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LanguageSelect({
  value,
  onChange,
  compact = false,
  disabled = false,
  className = ''
}: LanguageSelectProps) {
  const selectedLang = LANGUAGES.find(lang => lang.code === value);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as LanguageCode);
  };

  return (
    <div className={`${styles.languageSelect} ${compact ? styles.compact : ''} ${className}`}>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={styles.select}
        aria-label="Select card language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
      
      {compact && selectedLang && (
        <div className={styles.compactDisplay}>
          <span className={styles.flag}>{selectedLang.flag}</span>
          <span className={styles.code}>{value.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}




import { useState, useRef } from 'react';
import { useCardSearch, type Card } from '@/hooks/useCardSearch';
import { Input } from '@/components/forms/Input';
import styles from './CardSearchInput.module.css';

interface CardSearchInputWithExternalResultsProps {
  onSelect: (card: Card) => void;
  placeholder?: string;
  className?: string;
}

export function CardSearchInputWithExternalResults({ 
  onSelect, 
  placeholder, 
  className
}: CardSearchInputWithExternalResultsProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = useCardSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = data?.results || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (results[0]) {
          onSelect(results[0]);
          setQuery('');
        }
        break;
      case 'Escape':
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Search cards..."}
        role="combobox"
        aria-autocomplete="list"
        className={styles.input}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        name="externalCardSearch"
        id="externalCardSearch"
      />
    </div>
  );
} 
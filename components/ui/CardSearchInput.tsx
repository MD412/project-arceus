import { useState, useRef, useEffect } from 'react';
import { useCardSearch, type Card } from '@/hooks/useCardSearch';
import { Input } from '@/components/forms/Input';
import styles from './CardSearchInput.module.css';

interface CardSearchInputProps {
  onSelect: (card: Card) => void;
  placeholder?: string;
  className?: string;
}

export function CardSearchInput({ onSelect, placeholder, className }: CardSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data, isLoading, error } = useCardSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = data?.results || [];
  
  // Debug logging
  console.log('CardSearchInput state:', { 
    query, 
    isLoading, 
    error: error?.message, 
    resultsCount: results.length 
  });

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex]);
          setIsOpen(false);
          setQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
    setSelectedIndex(0);
  };

  const handleCardSelect = (card: Card) => {
    console.log('handleCardSelect called with:', card);
    onSelect(card);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        placeholder={placeholder || "Search cards..."}
        role="combobox"
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && results.length > 0 ? `option-${selectedIndex}` : undefined}
        aria-autocomplete="list"
        className={styles.input}
      />
      
      {isOpen && (
        <div className={styles.dropdown}>
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <span>Searching...</span>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <span>Search failed. Please try again.</span>
            </div>
          )}
          
          {!isLoading && !error && results.length === 0 && query.length >= 2 && (
            <div className={styles.empty}>
              <span>No cards found</span>
            </div>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <ul className={styles.results} role="listbox">
              {results.map((card, index) => (
                <li
                  key={card.id}
                  id={`option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`${styles.option} ${index === selectedIndex ? styles.selected : ''}`}
                  onClick={() => {
                    console.log('Card clicked:', card);
                    handleCardSelect(card);
                  }}
                >
                  <div className={styles.cardImage}>
                    {card.image_url ? (
                      <img 
                        src={card.image_url} 
                        alt="" 
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div className={styles.placeholder} />
                    )}
                  </div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardName}>{card.name}</div>
                    <div className={styles.cardDetails}>
                      {card.set_name} • {card.card_number}
                    </div>
                    {card.rarity && (
                      <div className={styles.cardRarity}>{card.rarity}</div>
                    )}
                  </div>
                  {card.market_price !== null && (
                    <div className={styles.cardPrice}>
                      ${card.market_price.toFixed(2)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
} 
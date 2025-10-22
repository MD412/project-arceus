import { useState, useRef, useEffect } from 'react';
import { useCardSearch, type Card } from '@/hooks/useCardSearch';
import { Input } from '@/components/forms/Input';
import { Dropdown } from './Dropdown';
import styles from './CardSearchInput.module.css';

interface CardSearchInputProps {
  onSelect: (card: Card) => void;
  placeholder?: string;
  className?: string;
  placement?: 'top' | 'bottom';
  onCancel?: () => void; // Called when user explicitly cancels (e.g., Escape with empty query)
  autoFocus?: boolean; // Auto-focus the search input when mounted
}

export function CardSearchInput({ onSelect, placeholder, className, placement = 'bottom', onCancel, autoFocus }: CardSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wasOpenFromFocus, setWasOpenFromFocus] = useState(false);
  const [rarityFilter, setRarityFilter] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const { data, isLoading, error } = useCardSearch(query);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = data?.results || [];
  
  // Get unique rarities and sets from results for filter options
  const uniqueRarities = Array.from(new Set(results.map(card => card.rarity).filter(Boolean)));
  const uniqueSets = Array.from(new Set(results.map(card => card.set_name).filter(Boolean)));
  
  // Filter results based on selected filters
  const filteredResults = results.filter(card => {
    const matchesRarity = !rarityFilter || card.rarity === rarityFilter;
    const matchesSet = !setFilter || card.set_name === setFilter;
    return matchesRarity && matchesSet;
  });
  
  // Debug logging
  console.log('CardSearchInput state:', { 
    query, 
    isLoading, 
    error: error?.message, 
    resultsCount: results.length,
    filteredCount: filteredResults.length,
    rarityFilter,
    setFilter
  });

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

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
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(query.length >= 2);
      return;
    }
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
        if (query.length > 0) {
          setQuery('');
          setIsOpen(false);
        } else {
          setIsOpen(false);
          onCancel?.();
          inputRef.current?.blur();
        }
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
        onFocus={() => {
          setWasOpenFromFocus(true);
          setIsOpen(true);
        }}
        onBlur={() => setWasOpenFromFocus(false)}
        placeholder={placeholder || "Search cards..."}
        role="combobox"
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && results.length > 0 ? `option-${selectedIndex}` : undefined}
        aria-autocomplete="list"
        className={styles.input}
        autoFocus={autoFocus}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        name="cardSearchInput"
        id="cardSearchInput"
      />
      
      {isOpen && (
        <div className={`${styles.dropdown} ${placement === 'top' ? styles.dropdownUp : ''}`}>
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
          
          {!isLoading && !error && (
            <>
              {/* Filter Bar */}
              <div className={styles.filterBar}>
                <div className={styles.filterButtons}>
                  <Dropdown
                    trigger={
                      <button className="button_button_uCVc button_button_filter_uCVc">
                        {rarityFilter || 'All Rarities'}
                      </button>
                    }
                    items={[
                      { label: 'All Rarities', href: '#' },
                      ...uniqueRarities.map((rarity) => ({ label: rarity, href: `#${rarity}` }))
                    ]}
                    onItemClick={(item) => {
                      setRarityFilter(item.label === 'All Rarities' ? '' : item.label);
                      setSelectedIndex(0);
                    }}
                  />
                  
                  <Dropdown
                    trigger={
                      <button className="button_button_uCVc button_button_filter_uCVc">
                        {setFilter || 'All Sets'}
                      </button>
                    }
                    items={[
                      { label: 'All Sets', href: '#' },
                      ...uniqueSets.map((set) => ({ label: set, href: `#${set}` }))
                    ]}
                    onItemClick={(item) => {
                      setSetFilter(item.label === 'All Sets' ? '' : item.label);
                      setSelectedIndex(0);
                    }}
                  />
                </div>
                
                <button 
                  className="button_button_uCVc button_button_filter_uCVc"
                  onClick={() => {
                    setRarityFilter('');
                    setSetFilter('');
                    setSelectedIndex(0);
                  }}
                  title="Clear filters"
                >
                  Clear
                </button>
              </div>
              
              {filteredResults.length === 0 && query.length >= 2 && (
                <div className={styles.empty}>
                  <span>No cards found</span>
                </div>
              )}
              
              {query.length < 2 && (
                <div className={styles.empty}>
                  <span>Type at least 2 characters to search</span>
                </div>
              )}
              
              {filteredResults.length > 0 && (
                <ul className={styles.results} role="listbox">
                {filteredResults.map((card, index) => (
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
                  {typeof card.market_price === 'number' && Number.isFinite(card.market_price) && (
                    <div className={styles.cardPrice}>
                      ${card.market_price.toFixed(2)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 

'use client';
import React, { useState } from 'react';

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
  className?: string;
  label?: string;
  helpText?: string;
  showSearchButton?: boolean;
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  defaultValue = "",
  className = "",
  label,
  helpText,
  showSearchButton = true
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Optional: Add debounced search here if needed
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`circuit-search-form ${className}`.trim()}>
      <div className="circuit-field">
        {label && <label htmlFor="search-input" className="circuit-label">{label}</label>}
        <div className="circuit-search-wrapper">
          <input
            id="search-input"
            type="search"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="circuit-input circuit-search-input"
            aria-label={label || "Search"}
          />
          {showSearchButton && (
            <button 
              type="submit" 
              className="circuit-button primary circuit-search-button"
              aria-label="Submit search"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path 
                  d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M19 19L14.65 14.65" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
        {helpText && <small className="circuit-field-hint">{helpText}</small>}
      </div>
    </form>
  );
}
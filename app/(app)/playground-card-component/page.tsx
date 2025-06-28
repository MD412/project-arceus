'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import SortablePlayerGrid, { PlayerCardData } from '@/components/ui/SortablePlayerGrid';
import StaticDragGrid from '@/components/ui/StaticDragGrid';
import SearchBar from '@/components/ui/SearchBar';

const PlaygroundCardStatesPage = () => {
  // Sample data matching the PlayerCardData interface
  const allCards: PlayerCardData[] = [
    {
      id: '1',
      title: 'Pikachu',
      description: 'Electric mouse Pokémon',
      theme: 'arceus',
      icon: '/ui-playground-pk-img/pikachu.jpg',
      variant: 'default'
    },
    {
      id: '2',
      title: 'Bulbasaur',
      description: 'Seed Pokémon',
      theme: 'global',
      icon: '/ui-playground-pk-img/bulbasaur.jpg',
      variant: 'elevated'
    },
    {
      id: '3',
      title: 'Gyarados',
      description: 'Atrocious Pokémon',
      theme: 'file',
      icon: '/ui-playground-pk-img/gyarados.jpg',
      variant: 'outlined'
    },
    {
      id: '4',
      title: 'Moltres',
      description: 'Flame Pokémon',
      theme: 'window',
      icon: '/ui-playground-pk-img/moltres.jpg',
      variant: 'default'
    },
    {
      id: '5',
      title: 'Sylveon',
      description: 'Intertwining Pokémon',
      theme: 'frame',
      icon: '/ui-playground-pk-img/slveon.jpg',
      variant: 'elevated'
    },
    {
      id: '6',
      title: 'Walking Wake',
      description: 'Paradox Pokémon',
      theme: 'next',
      icon: '/ui-playground-pk-img/walking-wake.jpg',
      variant: 'outlined'
    },
    {
      id: '7',
      title: 'Garchomp',
      description: 'Mach Pokémon',
      theme: 'deploy',
      icon: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      variant: 'default'
    },
    {
      id: '8',
      title: 'Unknown Card',
      description: 'Mystery awaits',
      theme: 'network',
      icon: '/ui-playground-pk-img/1600.jpg',
      variant: 'elevated'
    }
  ];

  const [cards, setCards] = React.useState<PlayerCardData[]>(allCards);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('default');
  const [useStaticMode, setUseStaticMode] = React.useState(true);

  // Filter cards based on search
  const filteredCards = React.useMemo(() => {
    let filtered = [...allCards];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'theme':
        filtered.sort((a, b) => a.theme.localeCompare(b.theme));
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [searchQuery, sortBy]);

  // Update cards when filters change
  React.useEffect(() => {
    setCards(filteredCards);
  }, [filteredCards]);

  const sortOptions = [
    { value: 'default', label: 'Default Order' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'theme', label: 'Theme' }
  ];

  return (
    <PageLayout
      title="Playground: Drag & Drop Cards"
      description="Testing @dnd-kit implementation with search, sort, and different drag behaviors"
    >
      <div className="mode-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={useStaticMode}
            onChange={(e) => setUseStaticMode(e.target.checked)}
          />
          <span className="toggle-switch"></span>
          <span className="toggle-text">
            {useStaticMode ? 'Static Placement Mode' : 'Auto-Sort Mode'}
          </span>
        </label>
      </div>

      <div className="playground-controls">
        <div className="controls-left">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            placeholder="Search Pokémon..."
          />
          <div className="sort-select">
            <label htmlFor="sort-by" className="sort-label">Sort by:</label>
            <select 
              id="sort-by"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="controls-right">
          <button
            className={`btn ${viewMode === 'grid' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </button>
          <button
            className={`btn ${viewMode === 'list' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      <div className="results-info">
        Showing {cards.length} of {allCards.length} cards
      </div>

      <div className="playground-content">
        {useStaticMode ? (
          <StaticDragGrid 
            cards={cards} 
            setCards={setCards} 
            viewMode={viewMode}
          />
        ) : (
          <SortablePlayerGrid 
            cards={cards} 
            setCards={setCards} 
            viewMode={viewMode}
          />
        )}
      </div>

      <style jsx>{`
        .mode-toggle {
          margin-bottom: var(--sds-size-space-600);
          display: flex;
          justify-content: center;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-200);
          cursor: pointer;
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 24px;
          background: var(--surface-subtle);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: var(--text-secondary);
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        input[type="checkbox"] {
          display: none;
        }

        input[type="checkbox"]:checked + .toggle-switch {
          background: var(--interactive-primary-subtle);
          border-color: var(--interactive-primary);
        }

        input[type="checkbox"]:checked + .toggle-switch::after {
          transform: translateX(24px);
          background: var(--interactive-primary);
        }

        .toggle-text {
          font-size: var(--font-size-100);
          font-weight: 500;
        }

        .playground-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--sds-size-space-400);
          margin-bottom: var(--sds-size-space-400);
          flex-wrap: wrap;
        }

        .controls-left,
        .controls-right {
          display: flex;
          gap: var(--sds-size-space-200);
          align-items: center;
        }

        .results-info {
          color: var(--text-secondary);
          font-size: var(--font-size-75);
          margin-bottom: var(--sds-size-space-400);
        }

        .playground-content {
          padding: var(--sds-size-space-400);
          background: var(--surface-subtle);
          border-radius: var(--sds-size-radius-200);
          min-height: 500px;
        }

        .btn {
          padding: var(--sds-size-space-200) var(--sds-size-space-400);
          border-radius: var(--sds-size-radius-100);
          font-size: var(--font-size-100);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .btn--primary {
          background: var(--interactive-primary);
          color: var(--text-on-primary);
          border-color: var(--interactive-primary);
        }

        .btn--secondary {
          background: var(--surface-background);
          color: var(--text-primary);
          border-color: var(--border-default);
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 768px) {
          .playground-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .controls-left,
          .controls-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </PageLayout>
  );
};

export default PlaygroundCardStatesPage; 
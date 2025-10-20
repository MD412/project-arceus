'use client';

import Image from 'next/image';
import { clsx } from 'clsx';

interface TradingCardProps {
  /** Card title, e.g., "Charizard" */
  name: string;
  /** Main card image */
  imageUrl: string;
  /** Quantity owned - not currently displayed; optional */
  quantity?: number;
  /** Card condition (e.g., mint, near_mint, played) */
  condition?: string;
  /** Card number within its set */
  number?: string;
  /** Set code or shorthand (e.g., "BASE") */
  setCode?: string;
  /** Set name (e.g., "VStar Universe") - displayed instead of code */
  setName?: string;
  /** Language/region code (e.g., "en", "jp") */
  language?: string;
  /** Optional extra class names */
  className?: string;
  /** Click handler for opening modal or other actions */
  onClick?: () => void;
}

export function TradingCard({
  name,
  imageUrl,
  quantity,
  condition,
  number,
  setCode,
  setName,
  language,
  className,
  onClick,
}: TradingCardProps) {
  /** Format snake_case condition into "Title Case" for display */
  const formatCondition = (value?: string) =>
    value
      ? value
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : undefined;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick();
      // Blur the element after click to prevent focus from getting stuck
      // This prevents the yellow border from persisting after interaction
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <div 
      className={clsx('circuit-trading-card', onClick && 'circuit-trading-card--clickable', className)}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid="trading-card"
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="circuit-trading-card-image-wrapper">
        {imageUrl && imageUrl.trim() !== '' ? (
          <Image
            src={imageUrl}
            alt={name}
            width={300}
            height={420}
            className="circuit-trading-card-img"
          />
        ) : setCode && number ? (  // Fallback to pokemontcg.io if no imageUrl
          <Image
            src={`https://images.pokemontcg.io/${setCode.toLowerCase()}/${number}.png`}
            alt={name}
            width={300}
            height={420}
            className="circuit-trading-card-img"
          />
        ) : (
          <div className="circuit-trading-card-img circuit-trading-card-placeholder">
            <span>No Image</span>
          </div>
        )}
        
        {/* Language badge - only show if not English */}
        {language && language !== 'en' && (
          <div className="circuit-trading-card-language-badge">
            {language.toUpperCase()}
          </div>
        )}
      </div>

      {/* Card Meta */}
      <div className="circuit-trading-card-info">
        <h3 className="circuit-trading-card-name">{name}</h3>
        <p className="circuit-trading-card-meta">
          {setName && <span>{setName}</span>}
        </p>
      </div>
    </div>
  );
} 
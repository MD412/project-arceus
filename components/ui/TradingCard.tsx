import Image from 'next/image';
import { clsx } from 'clsx';

interface TradingCardProps {
  /** Card title, e.g., "Charizard" */
  name: string;
  /** Main card image */
  imageUrl: string;
  /** Quantity owned – shows as a pill in the top-left; optional */
  quantity?: number;
  /** Card condition (e.g., mint, near_mint, played) */
  condition?: string;
  /** Card number within its set */
  number?: string;
  /** Set code or shorthand (e.g., "BASE") */
  setCode?: string;
  /** Optional extra class names */
  className?: string;
  /** Optional delete handler – renders an overlay "×" button when provided */
  onDelete?: () => void;
}

export function TradingCard({
  name,
  imageUrl,
  quantity,
  condition,
  number,
  setCode,
  className,
  onDelete,
}: TradingCardProps) {
  /** Format snake_case condition into "Title Case" for display */
  const formatCondition = (value?: string) =>
    value
      ? value
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : undefined;

  return (
    <div className={clsx('circuit-trading-card', className)}>
      <div className="circuit-trading-card-image-wrapper">
        {onDelete && (
          <button
            type="button"
            className="circuit-trading-card-delete"
            onClick={onDelete}
            title={`Delete ${name}`}
          >
            ×
          </button>
        )}
        {quantity !== undefined && (
          <span className="circuit-trading-card-quantity-pill">
            {quantity}×
          </span>
        )}
        <Image
          src={imageUrl}
          alt={name}
          width={300}
          height={420}
          className="circuit-trading-card-img"
        />
      </div>

      {/* Card Meta */}
      <div className="circuit-trading-card-info">
        <h3 className="circuit-trading-card-name">{name}</h3>
        <p className="circuit-trading-card-meta">
          {number && <span>{number}</span>}
          {number && (condition || setCode) && <span> • </span>}
          {condition && <span>{formatCondition(condition)}</span>}
          {condition && setCode && <span> • </span>}
          {setCode && <span>{setCode.toUpperCase()}</span>}
        </p>
      </div>
    </div>
  );
} 
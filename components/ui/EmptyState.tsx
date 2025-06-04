import { clsx } from 'clsx';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={clsx('circuit-empty-state', className)}>
      <p className="circuit-empty-state-title">
        {title}
      </p>
      {description && (
        <p className="circuit-empty-state-description">
          {description}
        </p>
      )}
    </div>
  );
} 
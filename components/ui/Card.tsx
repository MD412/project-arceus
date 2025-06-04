import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'stats' | 'main';
}

export function Card({ 
  className, 
  variant = 'default',
  ...props 
}: CardProps) {
  const baseClass = variant === 'stats' 
    ? 'circuit-stats-card' 
    : variant === 'main'
    ? 'circuit-main-container'
    : 'circuit-card';

  return (
    <div
      className={clsx(baseClass, className)}
      {...props}
    />
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatsCard({ label, value, className }: StatsCardProps) {
  return (
    <Card variant="stats" className={className}>
      <div className="circuit-stats-label">{label}</div>
      <div className="circuit-stats-value">{value}</div>
    </Card>
  );
} 
'use client';

import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'highlighted';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  return (
    <div className={clsx('circuit-metric-card', variant === 'highlighted' && 'circuit-metric-card-highlighted', className)}>
      {Icon && (
        <div className="circuit-metric-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="circuit-metric-value">{value}</div>
      <div className="circuit-metric-title">{title}</div>
      {subtitle && <div className="circuit-metric-subtitle">{subtitle}</div>}
    </div>
  );
} 
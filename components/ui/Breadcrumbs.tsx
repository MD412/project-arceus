'use client';

import React from 'react';
import Link from 'next/link';
import { CaretRight } from '@phosphor-icons/react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs ${className || ''}`}>
      <ol className="breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="breadcrumbs__item" aria-current={isLast ? 'page' : undefined}>
              {item.href && !isLast ? (
                <Link href={item.href} className="breadcrumbs__link">
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumbs__current">{item.label}</span>
              )}
              {!isLast && (
                <span className="breadcrumbs__separator" aria-hidden="true">
                  <CaretRight size={14} weight="bold" />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .breadcrumbs {
          width: 100%;
        }
        .breadcrumbs__list {
          list-style: none;
          display: flex;
          align-items: center;
          gap: var(--sds-size-space-150);
          padding: 0;
          margin: 0;
        }
        .breadcrumbs__item {
          display: inline-flex;
          align-items: center;
          gap: var(--sds-size-space-150);
          color: var(--text-secondary);
          font-size: var(--font-size-75);
        }
        .breadcrumbs__separator :global(svg) {
          color: var(--text-tertiary);
        }
        .breadcrumbs__link {
          color: var(--text-secondary);
          text-decoration: none;
        }
        .breadcrumbs__link:hover {
          color: var(--interactive-primary);
          text-decoration: underline;
          font-weight: 600;
        }
        .breadcrumbs__current {
          color: var(--text-primary);
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
}

export default Breadcrumbs;



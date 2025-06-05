import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <article className="page-layout">
      <header className="page-layout-header">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </header>
      <div className="page-layout-content">
        {children}
      </div>
    </article>
  );
} 
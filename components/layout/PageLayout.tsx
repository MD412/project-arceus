import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  description?: string;
  hideHeader?: boolean;
  noPadding?: boolean; // remove inner padding from app-content container
}

export default function PageLayout({ title, description, children, hideHeader = false, noPadding = false }: PageLayoutProps) {
  const articleClass = `page-layout app-content${noPadding ? ' app-content--no-padding' : ''}`;
  return (
    <article className={articleClass}>
      {!hideHeader && (
        <header className="page-layout-header">
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </header>
      )}
      <div className="page-layout-content">
        {children}
      </div>
    </article>
  );
} 
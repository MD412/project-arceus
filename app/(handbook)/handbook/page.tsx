'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Link from 'next/link';

export default function HandbookHomePage() {
  return (
    <PageLayout
      title="📖 Handbook & Update Log"
      description="The central source of truth for Project Arceus. This page contains critical startup information and a running log of major updates."
    >
      <ContentSection title="🚀 Session Startup Instructions" headingLevel={2}>
        <p className="body-medium">
          Follow these steps every time you start a new development session to ensure the application runs correctly.
        </p>
        <ol className="list-decimal pl-6 body-medium space-y-2 mt-4">
          <li>
            <strong>Start the Frontend:</strong> Open a terminal and run the Next.js development server.
            <pre className="code-block">npm run dev</pre>
            The app will be available at <code>http://localhost:3000</code>
          </li>
          <li>
            <strong>Start the Python Worker:</strong> Open a second, separate terminal and run the Python worker.
            <pre className="code-block">py worker/normalized_worker_v3.py</pre>
            This worker processes uploaded binder images to detect and identify cards.
          </li>
          <li>
            <strong>Current Functionality:</strong> Upload binder photos → automatic card detection → high-quality individual crops
            <ul className="list-disc pl-6 body-small space-y-1 mt-2">
              <li>Navigate to <code>/upload</code> to submit new binder photos</li>
              <li>View processing results at <code>/scans</code></li>
              <li>Review individual detected cards at <code>/scans/[id]</code></li>
            </ul>
          </li>
          <li>
            <strong>Database:</strong> Connected to live Supabase instance. No local setup required.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="📝 Project History & Patterns" headingLevel={2}>
        <p className="body-medium">
          Consult the project's living documents to understand key architectural decisions and historical context.
        </p>
        <div className="handbook-links">
          <Link href="/handbook/changelog" className="handbook-link">
            <div className="link-title">📜 Project Changelog</div>
            <div className="link-description">A reverse-chronological log of major features, architectural changes, and bug fixes.</div>
          </Link>
          <Link href="/handbook/patterns/optimistic-crud-pipeline" className="handbook-link">
            <div className="link-title">⚡ The Factorio Pattern</div>
            <div className="link-description">The standard for all CRUD operations, ensuring instant UI feedback and resilient background processing.</div>
          </Link>
        </div>
      </ContentSection>

      <style jsx>{`
        .code-block {
          background: var(--surface-preview-background);
          padding: var(--sds-size-space-300);
          border-radius: var(--sds-size-radius-100);
          margin-top: var(--sds-size-space-200);
          font-family: var(--font-family-mono);
          font-size: var(--font-body-code);
          border: 1px solid var(--border-subtle);
        }
        .update-log-feed {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .log-entry {
          padding: 1.5rem;
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          background: var(--surface-background);
        }
        .log-header {
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .log-title {
          margin: 0;
          color: var(--text-primary);
        }
        .log-date {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-subtle);
        }
        .log-body h4 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .handbook-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--sds-size-space-400);
          margin-top: var(--sds-size-space-400);
        }
        .handbook-link {
          display: block;
          padding: var(--sds-size-space-400);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .handbook-link:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .link-title {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--sds-size-space-100);
        }
        .link-description {
          font-size: var(--font-size-75);
          color: var(--text-secondary);
        }
      `}</style>
    </PageLayout>
  );
} 
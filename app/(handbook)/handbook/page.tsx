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
          </li>
          <li>
            <strong>Start the Python Worker:</strong> Open a second, separate terminal and run the Python worker script.
            <pre className="code-block">py worker/production_worker.py</pre>
            This worker is responsible for processing uploaded binder images. It will poll the database for new jobs.
          </li>
          <li>
            <strong>Note on Database:</strong> We are connected to a live, remote Supabase database. There is no local database setup required. All migrations are handled via the Supabase CLI, but applied directly to the remote DB.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="📝 Project Update Log" headingLevel={2}>
        <div className="update-log-feed">
          {/* --- NEW UPDATE ENTRY --- */}
          <div className="log-entry">
            <div className="log-header">
              <h3 className="log-title">Binder Review UI & Vision Pipeline Robustness</h3>
              <p className="log-date">June 10, 2025 (Afternoon Session)</p>
            </div>
            <div className="log-body">
              <p>
                Built the foundational UI for reviewing processed binders and significantly improved the robustness and accuracy of the Python vision worker.
              </p>
              <h4>Key Achievements:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Read-Only Review UI:</strong>
                  <ul className="list-disc pl-6">
                    <li>Created a dynamic page at <code>/binders/[id]</code> to display results for a single binder.</li>
                    <li>Built the data layer (<code>getJobById</code> service, <code>useJob</code> hook) to fetch data for a single job.</li>
                    <li>The UI now displays the main summary image and a grid of all individually detected card crops.</li>
                  </ul>
                </li>
                <li>
                  <strong>Vision Pipeline Hardening:</strong>
                  <ul className="list-disc pl-6">
                    <li>Upgraded the Python worker to save individual image crops for each detected card, providing the necessary data for the review UI.</li>
                    <li>Made the worker's storage uploads idempotent by implementing a "delete then upload" strategy to prevent errors on re-runs.</li>
                    <li>Fixed a critical cross-platform bug by ensuring all storage paths use POSIX-compliant forward slashes.</li>
                    <li>Implemented a heuristic bounding box filter to discard small, noisy detections (e.g., faces, text) and improve the quality of results.</li>
                  </ul>
                </li>
              </ul>
              <h4>Next Steps:</h4>
              <p>
                The read-only foundation is complete. The next logical phase is to add interactivity to the Binder Review page, allowing users to manage the detected cards. This includes:
              </p>
              <ul className="list-disc pl-6">
                <li>Adding "Confirm" and "Delete" buttons to each detected card.</li>
                <li>Building the backend services and RLS policies for updating and deleting card records.</li>
                <li>Implementing a method for users to manually add cards that the AI may have missed.</li>
              </ul>
            </div>
          </div>
          {/* --- END UPDATE ENTRY --- */}
          
          {/* --- NEW UPDATE ENTRY --- */}
          <div className="log-entry">
            <div className="log-header">
              <h3 className="log-title">End-to-End Vision Pipeline & Architecture Overhaul</h3>
              <p className="log-date">June 10, 2025</p>
            </div>
            <div className="log-body">
              <p>
                This foundational update established the core architecture for the entire application, built out the full vision pipeline, and connected the frontend to the backend via a robust job queue.
              </p>
              <h4>Key Achievements:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Frontend Architecture Overhaul:</strong>
                  <ul className="list-disc pl-6">
                    <li>Implemented centralized Supabase clients, a `services` layer for API calls, and `zod` for schema validation.</li>
                    <li>Integrated TanStack Query (`react-query`) for all server state management, replacing manual fetching logic.</li>
                    <li>Added global user feedback with `react-hot-toast` and a global `ErrorBoundary` for stability.</li>
                  </ul>
                </li>
                <li>
                  <strong>Vision Pipeline Automation:</strong>
                  <ul className="list-disc pl-6">
                    <li>Designed and implemented a `jobs` table in Supabase to act as a processing queue, secured with Row Level Security policies.</li>
                    <li>Developed a production-ready Python worker (`production_worker.py`) that polls the database, downloads images, runs the full vision pipeline, and uploads the results.</li>
                    <li>Upgraded the job-locking mechanism to use a safe, scalable RPC function (`fetch_and_lock_job`) to prevent race conditions.</li>
                  </ul>
                </li>
                <li>
                  <strong>New Features & UI:</strong>
                  <ul className="list-disc pl-6">
                    <li>Created the `/upload` page with a type-safe form for submitting new binders.</li>
                    <li>Built the `/binders` page to display the status and results of processed binders, closing the user feedback loop.</li>
                  </ul>
                </li>
                <li>
                  <strong>Documentation Restructuring:</strong>
                  <ul className="list-disc pl-6">
                    <li>Established this "Handbook" as the central place for all engineering documentation, separate from the "CircuitDS" design system.</li>
                    <li>Migrated all relevant architecture and pipeline documents into this handbook.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          {/* --- END UPDATE ENTRY --- */}
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
      `}</style>
    </PageLayout>
  );
} 
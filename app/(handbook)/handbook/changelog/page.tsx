'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Tag from '@/components/ui/Tag';

const changelogEntries = [
  {
    date: '2025-01-01',
    version: '1.4.0',
    title: 'Blank Spaces in Digital Binders',
    tags: ['product', 'ux', 'feature'],
    description: 'Decided on hybrid approach for handling blank spaces from physical binders in digital views.',
    details: [
      'Analyzed JTBD: Balance physical authenticity with digital efficiency',
      'Pros of mirroring blanks: Mental model match, wishlist potential',
      'Cons: Wasted screen space, UX friction on mobile',
      'Recommendation: Default to optimized (remove blanks) with toggle for "Physical View"',
      'Implementation plan: Store positions in DB, add view toggle in binder component'
    ],
    impact: 'Improves UX flexibility while preserving option for 1:1 physical mapping. MVP: Optimized default, toggle in v1.1.',
    related: ['Product Discussion #1']
  },
  {
    date: 'January 2, 2025 (Late Night Session)',
    title: 'Smart Training System & CircuitDS Button Consistency',
    description: 'Revolutionized the training feedback system with categorized data collection and achieved full CircuitDS design system compliance across all buttons. Fixed Next.js 15 async cookies compatibility.',
    tags: ['Feature', 'UX', 'Design System', 'Training'],
    details: [
      'Replaced binary "add to training" with smart feedback: "🚫 Not a Card", "📚 Missing from DB", "❌ Wrong ID", and "✅ Correct".',
      'Implemented organized training data collection in `training_data/card_crops/{type}/` folders for better ML retraining.',
      'Achieved 100% CircuitDS Button component usage - replaced all custom button CSS with proper design system variants.',
      'Fixed Next.js 15 async cookies compatibility by updating `supabaseServer()` and all API route params.',
      'Resolved RLS permission issues by simplifying database queries and removing complex joins.',
      'Added comprehensive error logging and user feedback for training data collection.',
      'Successfully collected real "not a card" training examples (social media logos, reflective surfaces) for YOLO retraining.',
    ],
  },
  {
    date: 'July 10, 2025',
    title: 'Vision Pipeline Stability & Enrichment',
    description: 'Resolved a persistent and elusive database error (42P10) that was blocking card creation. Fully stabilized the end-to-end vision pipeline, enabling successful enrichment from the pokemontcg.io API.',
    tags: ['Bugfix', 'Database', 'Worker', 'API'],
    details: [
      'Diagnosed the root cause of the 42P10 "no unique constraint" error: the worker was attempting to upsert records with NULL values in the conflict key columns (`set_code`, `card_number`).',
      'Added a UNIQUE constraint to `cards(set_code, card_number)` to enforce data integrity and enable upserts.',
      'Corrected the `dequeue_and_start_job` function multiple times to fix alias-related SQL errors (42P01 and 42702).',
      'Patched the worker to safely handle enrichment data and prevent NULLs from being passed to the database.',
      'Confirmed the `pokemontcg.io` API integration is working, pulling official card images into the collection UI.',
    ],
  },
  {
    date: 'July 5, 2025 (Late Night Session)',
    title: 'The Great Migration & API Refactor',
    description: 'A deep-dive debugging session that fixed a series of cascading failures, from a corrupted database migration history to a broken rename API. The result is a fully functional, stable system with a modernized, useful handbook.',
    tags: ['Stability', 'Bugfix', 'Refactor', 'Handbook'],
    details: [
      'Manually repaired a corrupted Supabase migration history after the CLI failed repeatedly.',
      'Fixed a critical bug in the rename functionality caused by a frontend/backend data mismatch (`scan_title` vs `binder_title`).',
      'Implemented user-facing toast notifications for all major CRUD actions (rename, delete).',
      'Refactored the entire project handbook, deleting 9 outdated pages and creating a new, streamlined changelog and patterns directory.',
      'Diagnosed and fixed the final permission issue on the `command_queue` table by manually applying the RLS policy.',
      'Achieved a fully working end-to-end user flow for scanning, reviewing, and managing items.',
    ],
  },
  {
    date: 'July 5, 2025',
    title: 'Optimistic CRUD Pipeline & Handbook Refactor',
    description: 'Replaced slow, synchronous deletes with a modern, Factorio-style command queue pattern for instant UI feedback. Refactored the handbook into a streamlined changelog and patterns directory.',
    tags: ['Architecture', 'UX', 'Database'],
    details: [
      'Implemented soft deletes by adding a `deleted_at` column to `scan_uploads`.',
      'Created a `command_queue` table to handle asynchronous background tasks.',
      'Developed a Supabase Edge Function to process delete commands (hard delete, storage cleanup).',
      'Updated frontend to use optimistic UI for deletes, providing instant feedback and rollback on error.',
      'Refactored the project handbook, deleting outdated pages and creating a new changelog.',
    ],
  },
  {
    date: 'July 2-4, 2025',
    title: 'The Great Debugging & Refactoring Campaign',
    description: 'A massive effort to fix a completely broken system. Addressed dozens of bugs across the stack, from database migrations to frontend rendering, worker logic, and API endpoints.',
    tags: ['Bugfix', 'Refactor', 'Stability'],
    details: [
      'Repaired a corrupted Supabase migration history that prevented schema changes.',
      'Fixed the `local_worker.py` to correctly fetch and process jobs from the queue.',
      'Resolved multiple frontend/backend data mismatches (e.g., `binder_title` vs. `scan_title`).',
      'Implemented real-time polling on the scan review page for live updates.',
      'Added comprehensive toast notifications for user actions.',
    ],
  },
  {
    date: 'June 2025',
    title: 'Scan-to-Collection Workflow Implemented',
    description: 'Built the end-to-end user flow for processing a scanned image and adding the identified cards to a user\'s permanent collection.',
    tags: ['Feature', 'API', 'Worker'],
    details: [
      'Integrated a mock Pokemon TCG API into the Python worker for card identification.',
      'The worker now enriches detected cards with names, sets, and values.',
      'Created an `/api/collections` endpoint to add verified cards to the `user_cards` table.',
      'Updated the review page to display enriched card data and allow adding to collection.',
    ],
  },
  {
    date: 'Early June 2025',
    title: 'Fixed dequeue_and_start_job Function',
    description: 'Resolved a critical bug where the Python worker would hang because the database function returned the wrong data structure.',
    tags: ['Bugfix', 'Database', 'Worker'],
    details: [
      'Identified that `dequeue_and_start_job` was returning `job_type` instead of the expected `payload`.',
      'Updated the PostgreSQL function to return the correct `payload` containing the image `storage_path`.',
      'This fix unblocked the entire processing pipeline.',
    ],
  },
  {
    date: 'December 2024',
    title: '🏆 The Breakthrough Moment: Whole-Image Detection',
    description: 'The definitive solution that solved persistent card detection failures by abandoning artificial 3x3 tiling and running YOLO on complete binder images.',
    tags: ['Milestone', 'AI/ML', 'Vision Pipeline'],
    details: [
      'Identified the root cause of detection failures: a mismatch between the model (trained on whole cards) and the input (tiled fragments).',
      'Simplified the Python worker to use a single `model.predict()` call on the entire, resized image.',
      'Achieved near-perfect detection confidence (1.000, 0.999...) and eliminated threshold-tuning hell.',
      'This architectural change made the vision pipeline production-ready and reliable.',
    ],
  },
];

export default function ChangelogPage() {
  const copyToClipboard = async (entry: typeof changelogEntries[0]) => {
    const formattedText = `${entry.title}
${entry.date}

${entry.description}

Key Changes:
${entry.details.map(detail => `• ${detail}`).join('\n')}

Tags: ${entry.tags.join(', ')}`;

    try {
      await navigator.clipboard.writeText(formattedText);
      // Simple feedback - could enhance with toast notification
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button.textContent;
      button.textContent = '✅ Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = formattedText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <PageLayout
      title="📜 Project Changelog"
      description="A reverse-chronological log of major features, architectural changes, and bug fixes for Project Arceus."
    >
      <div className="changelog-feed">
        {changelogEntries.map((entry, index) => (
          <ContentSection key={index} title="" headingLevel={2}>
            <div className="changelog-entry">
              <div className="changelog-meta">
                <time className="changelog-date">{entry.date}</time>
                <div className="changelog-actions">
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(entry)}
                    title="Copy changelog entry to clipboard"
                  >
                    📋 Copy
                  </button>
                <div className="changelog-tags">
                    {entry.tags.map(tag => {
                      // Map tag text to CircuitDS variants
                      const variant = (() => {
                        const normalizedTag = tag.toLowerCase().split('/')[0];
                        switch (normalizedTag) {
                          case 'feature': return 'feature';
                          case 'ux': return 'success';
                          case 'design': return 'info';
                          case 'training': return 'warning';
                          case 'bugfix': return 'error';
                          case 'milestone': return 'warning';
                          case 'architecture': return 'info';
                          case 'database': return 'info';
                          case 'worker': return 'warning';
                          case 'api': return 'success';
                          case 'stability': return 'default';
                          case 'refactor': return 'info';
                          case 'ai': return 'feature';
                          case 'handbook': return 'default';
                          case 'product': return 'info';
                          default: return 'default';
                        }
                      })();
                      return (
                        <Tag key={tag} variant={variant} size="small">
                          {tag.toUpperCase()}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              </div>
              <h2 className="changelog-title">{entry.title}</h2>
              <p className="changelog-description">{entry.description}</p>
              {entry.details && (
                <ul className="changelog-details">
                  {entry.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </ContentSection>
        ))}
      </div>
      <style jsx>{`
        .changelog-feed {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-200);
        }
        .changelog-entry {
          padding: var(--sds-size-space-500);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
          background: var(--surface-background);
        }
        .changelog-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--sds-size-space-300);
        }
        .changelog-date {
          font-size: var(--font-size-75);
          color: var(--text-secondary);
          font-weight: 500;
        }
        .changelog-tags {
          display: flex;
          gap: var(--sds-size-space-150);
          flex-wrap: wrap;
        }
        
        .changelog-title {
          margin: 0 0 var(--sds-size-space-200) 0;
          font-size: var(--font-size-300);
        }
        .changelog-description {
          margin: 0 0 var(--sds-size-space-300) 0;
          color: var(--text-secondary);
        }
        .changelog-details {
          margin: 0;
          padding-left: var(--sds-size-space-400);
          font-size: var(--font-size-100);
          color: var(--text-primary);
          list-style-type: '✓   ';
        }
        .changelog-details li {
          padding-left: var(--sds-size-space-200);
          margin-bottom: var(--sds-size-space-100);
        }
      `}</style>
    </PageLayout>
  );
} 
'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

export default function OptimisticCrudPipelinePage() {
  return (
    <PageLayout
      title="⚡ Optimistic CRUD Pipeline: The Factorio Pattern"
      description="A modern, event-driven approach to CRUD operations that delivers instant UX while keeping the backend resilient and maintainable."
    >
      <ContentSection title="Why This Pattern?" headingLevel={2}>
        <p className="body-medium">
          Deleting or renaming a scan currently blocks the UI for <strong>4-5&nbsp;seconds</strong> while we synchronously:
        </p>
        <ul className="list-disc pl-6 body-medium space-y-1">
          <li>Remove the image from Supabase&nbsp;Storage</li>
          <li>Delete <code>job_queue</code> rows</li>
          <li>Delete the <code>scan_uploads</code> row</li>
        </ul>
        <p className="body-medium mt-4">
          That delay is network bound and won’t disappear in production. We need a design that provides <em>perceived</em> instant feedback while doing heavy work in the background – just like erasing a tweet on&nbsp;Twitter.
        </p>
      </ContentSection>

      <ContentSection title="Core Principles" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li><strong>Optimistic UI</strong> – mutate local state immediately, rollback on error.</li>
          <li><strong>Soft Deletes</strong> – never hard-delete in the request path; set <code>deleted_at</code>.</li>
          <li><strong>CQRS</strong> – write operations are <em>commands</em>; reads come from pre-filtered views.</li>
          <li><strong>Event-Driven</strong> – commands raise domain events handled by background workers.</li>
          <li><strong>Idempotency</strong> – every handler safe to run twice.</li>
          <li><strong>Observability</strong> – structured logs, metrics, DLQ for failed jobs.</li>
        </ul>
      </ContentSection>

      <ContentSection title="High-Level Flow" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-2">
          <li>User clicks <em>Delete Scan</em>.</li>
          <li>Frontend dispatches <code>optimisticDelete(scanId)</code> &rarr; item disappears.</li>
          <li>API <code>POST /api/commands/delete-scan</code> writes a row to <code>command_queue</code>.</li>
          <li>API returns <code>202 Accepted</code> with <code>commandId</code> in &lt;100&nbsp;ms.</li>
          <li>Worker (Node or Python) picks up <code>DeleteScanCommand</code>, executes:</li>
          <ul className="list-disc pl-6 mt-1 space-y-1">
            <li>Remove file from Storage</li>
            <li>Delete related <code>job_queue</code> rows</li>
            <li>Hard-delete <code>scan_uploads</code> row</li>
          </ul>
          <li>On success an <code>ScanDeletedEvent</code> is emitted (for metrics, cache purge).</li>
        </ol>
      </ContentSection>

      <ContentSection title="Database Changes" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li>Add <code>deleted_at TIMESTAMPTZ</code> & <code>version INT DEFAULT 0</code> to <code>scan_uploads</code>.</li>
          <li>Create <code>command_queue</code> table:
            <pre className="code-block mt-2 text-xs">id UUID PK, type TEXT, payload JSONB, created_at TIMESTAMPTZ DEFAULT now(), processed_at TIMESTAMPTZ</pre>
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="API Layer" headingLevel={2}>
        <p className="body-medium">
          We expose <code>/api/commands/*</code> endpoints that <em>only</em> insert into <code>command_queue</code>. They run on Vercel Edge or Next.js&nbsp;API, complete in under&nbsp;100&nbsp;ms, and never block on Supabase&nbsp;Storage.
        </p>
      </ContentSection>

      <ContentSection title="Background Processing" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li><strong>Preferred</strong>: Supabase Edge Function (TypeScript) subscribed to <code>command_queue</code>.</li>
          <li><strong>Fallback</strong>: Existing Python worker polls every few seconds.</li>
          <li>Each command handled in isolation and retried on failure.</li>
        </ul>
      </ContentSection>

      <ContentSection title="Frontend Integration" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li>React Query mutation with <code>onMutate</code> → optimistic removal.</li>
          <li>Use <code>onError</code> to rollback if command rejected.</li>
          <li>Poll or subscribe to <code>scans</code> view (excluding soft-deleted rows) for eventual consistency.</li>
        </ul>
      </ContentSection>

      <ContentSection title="Implementation Roadmap" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-2">
          <li><strong>D1:</strong> Add <code>deleted_at</code> column &amp; create <code>command_queue</code>.</li>
          <li><strong>D1:</strong> Refactor delete/rename API to enqueue commands.</li>
          <li><strong>D2:</strong> Build minimal Edge Function handler for <code>DeleteScanCommand</code>.</li>
          <li><strong>D2:</strong> Update React Query mutations to optimistic UI.</li>
          <li><strong>D3:</strong> Extend pattern to <em>Rename</em>, <em>Retry</em>, and other heavy ops.</li>
        </ol>
      </ContentSection>

      <ContentSection title="Reference Snippet" headingLevel={2}>
        <pre className="code-block body-small" style={{ whiteSpace: 'pre-wrap' }}>{`// deleteScan.ts (client)
await deleteScanMutation.mutateAsync(scanId);

// /api/commands/delete-scan (server)
export async function POST(req: NextRequest) {
  const { scanId } = await req.json();
  await supabase.from('command_queue').insert({
    type: 'DELETE_SCAN',
    payload: { scanId }
  });
  return NextResponse.json({ accepted: true }, { status: 202 });
}

// edge_function/delete_scan.ts
if (command.type === 'DELETE_SCAN') {
  const { scanId } = command.payload;
  // 1) Delete storage
  // 2) Purge job_queue rows
  // 3) Hard-delete scan_uploads
  // 4) Mark command processed
}
`}</pre>
      </ContentSection>
    </PageLayout>
  );
} 
'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

export default function VisionPipelinePRDPage() {
  return (
    <PageLayout
      title="🧾 Vision Pipeline V1 – PRD"
      description="Authoritative specification for the end-to-end image-to-collection pipeline (Shoot → Share → Review). Optimised for AI agents and new contributors to ramp up quickly."
    >
      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="1 · Why This Exists" headingLevel={2}>
        <p className="body-medium">
          Collectors want a <strong>one-tap</strong> way to add cards to their digital collection. The pipeline turns a raw
          phone photo into structured <code>user_cards</code> rows with minimal user effort and&nbsp;latency.
        </p>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="2 · User Flow (Happy Path)" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-2">
          <li>
            <strong>Upload</strong> – user clicks the <em>Process&nbsp;Scan</em> button in the web app, selects an image, and submits the form (<code>POST /api/scans</code>).
          </li>
          <li>
            <strong>Auto-crunch</strong> – the Python worker picks up the queued job, runs detection &amp; matching.
          </li>
          <li>
            <strong>Ping</strong> – Supabase Realtime notifies the front-end; badge appears within ≈10&nbsp;s.
          </li>
          <li>
            <strong>Review Modal</strong> – user confirms or edits predictions. “Accept All” handles 95&nbsp;% of cases.
          </li>
          <li>
            <strong>Binder Drop-zone</strong> – optional bulk attach to a binder (if any exist).
          </li>
          <li>
            <strong>Toast / Dopamine</strong> – “✓ 12 cards added · 1 min saved”. Analytics event fires.
          </li>
        </ol>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="3 · Technical Stack & Responsibilities" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li><strong>Supabase Storage</strong> – raw images (bucket: <code>scans</code>), card crops, summary images.</li>
          <li><strong>job_queue</strong> table + <code>dequeue_and_start_job()</code> RPC – single-row locking for workers.</li>
                      <li><strong>Python Worker</strong> (<code>worker/worker.py</code>) – detection, enrichment, persistence with CLIP-based identification.</li>
          <li><strong>Computer Vision</strong> – YOLOv8 (ultralytics) weights <code>pokemon_cards_trained.pt</code>.</li>
          <li><strong>OCR / LLM Assist</strong> – PaddleOCR or Tesseract (future); placeholder <code>mock_enrich_card()</code>.</li>
          <li><strong>External Card Data</strong> – PokémonTCG.io API for ground-truth metadata &amp; prices (<a href="https://pokemontcg.io/" target="_blank">link</a>).</li>
          <li><strong>Supabase Realtime</strong> – listeners on <code>scans</code> status transitions.</li>
          <li><strong>Next.js Front-end</strong> – Review UI modal, optimistic CRUD (Factorio Pattern).</li>
        </ul>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="4 · Data Model Touchpoints" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li><code>scan_uploads</code> – raw request; statuses: <em>pending | processing | failed | completed</em>.</li>
          <li><code>job_queue</code> (schema-owned) – async command runner (enum: <em>pending | processing | completed&nbsp;| failed</em>).</li>
          <li><code>scans</code> – user-visible processing entity (progress 0-100 %, summary image).</li>
          <li><code>card_detections</code> – one per bounding box (bbox, crop_url, guess_card_id, confidence).</li>
          <li><code>cards</code> – canonical catalogue; seed via PokémonTCG.io; upsert on miss.</li>
          <li><code>user_cards</code> – ownership; upsert on <code>(user_id, card_id)</code>.</li>
          <li><code>pipeline_review_items</code> – low-confidence items surfaced in Review UI.</li>
        </ul>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="5 · Pipeline Algorithm (Worker)" headingLevel={2}>
        <pre className="code-block body-small" style={{ whiteSpace: 'pre-wrap' }}>{`1. dequeue job → mark 'processing'
2. create row in scans (progress 10 %)
3. download original image
4. run YOLOv8 detection → top N boxes (confidence ≥ 0.25)
5. save crops + summary image to Storage (progress 50 %)
6. for each crop:
   a. enrich via PokémonTCG.io (TODO replace mock)
   b. upsert into cards → obtain card_id
   c. insert card_detections row
   d. upsert into user_cards
7. mark scans.status = 'ready' (progress 100 %)
8. update job + scan_uploads statuses → trigger Realtime event
9. write verbose JSON log to worker/output
`}</pre>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="6 · Known Gaps (as of V1)" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li><strong>RPC Mismatch</strong> – <code>dequeue_and_start_job</code> must return <code>scan_upload_id</code> + JSON <code>payload.storage_path</code>.</li>
          <li><strong>Worker Null-Safety</strong> – guard when <code>job.payload</code> is <code>null</code>.</li>
          <li><strong>Model Accuracy</strong> – retraining needed; current F1 ≈ 0.78.</li>
          <li><strong>OCR / LLM</strong> – placeholder <code>mock_enrich_card()</code>; replace with real API.</li>
          <li><strong>Review UI</strong> – Accept All + Binder Picker not implemented.</li>
        </ul>
      </ContentSection>

      {/* ---------------------------------------------------------------------------------- */}
      <ContentSection title="7 · Incremental Roadmap" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-2">
          <li>Fix RPC + payload, patch worker → restore green path.</li>
          <li>Add PokémonTCG.io fetch + caching.</li>
          <li>Retrain YOLO with ~2× dataset; push <code>pokemon_cards_trained_v2.pt</code>.</li>
          <li>Wire Review Modal + Accept All.</li>
          <li>Binder drop-zone bulk attach.</li>
          <li>Add metrics &amp; DLQ for failed jobs.</li>
          <li>Long-term: move heavy CPU to serverless GPU (Modal / RunPod).</li>
        </ol>
      </ContentSection>
    </PageLayout>
  );
} 
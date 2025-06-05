'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Link from 'next/link'; // Keep Link for potential internal links

// Helper component for rendering code blocks if not using a dedicated one
const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre
    style={{
      background: 'var(--surface-preview-background)',
      padding: 'var(--sds-size-space-400)',
      borderRadius: 'var(--sds-size-radius-100)',
      overflowX: 'auto',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-family-mono)',
      fontSize: 'var(--font-body-code)',
      border: '1px solid var(--border-subtle)'
    }}
  >
    <code>{children}</code>
  </pre>
);

const PythonCodeBlock = ({ children }: { children: React.ReactNode }) => (
    <CodeBlock>{children}</CodeBlock>
);

export default function VisionPipeline3x3SlicePage() {
  const preSlicePythonCode = `
# Simple Python script (Pillow / OpenCV):
h, w = img.shape
tile_h, tile_w = h//3, w//3
For r in 0-2:
    For c in 0-2:
        save img[r*tile_h:(r+1)*tile_h, c*tile_w:(c+1)*tile_w]
  `;

  return (
    <PageLayout
      title="Vision Pipeline: 3×3 Slice Card Detection"
      description="Detailed overview of the '3 × 3 Slice' strategy for detecting and processing Pokémon cards from binder page photos."
    >
      <ContentSection title="Goal" headingLevel={2}>
        <p className="body-medium">
          Turn a raw photo of an open binder page (nine Pokémon cards in a 3 × 3 grid) into nine clean, correctly labeled card crops that downstream logic can enrich with set / price data.
        </p>
      </ContentSection>

      <ContentSection title="1. Why Slice At All?" headingLevel={2}>
        <p className="body-medium">
The '3x3 slice' approach addresses several key challenges in processing binder photos:
        </p>
        <table className="w-full body-medium" style={{ marginTop: 'var(--sds-size-space-400)' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th className="p-2" style={{ borderBottom: '1px solid var(--border-default)', width: '50%' }}>Pain Point</th>
              <th className="p-2" style={{ borderBottom: '1px solid var(--border-default)', width: '50%' }}>Slice-Based Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Binder photos are rarely perfectly square-on—cards warp toward the edges, lighting is uneven.</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Breaking the image into 9 roughly even tiles localises distortion, letting the detector work on mostly-flat sub-frames.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>YOLOv8 (un-tuned) occasionally misses edge cards or merges 2 adjoining cards into one big box.</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Each tile only contains one card (in theory), so even sloppy boxes still isolate a single card.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2">Overlapping boxes across the full frame create dupe crops we have to de-bounce later.</td>
              <td className="p-2">Tile-scoped detection + a de-duplication pass keeps the box set minimal and clean.</td>
            </tr>
          </tbody>
        </table>
      </ContentSection>

      <ContentSection title="2. End-to-End Pipeline" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-4">
          <li>
            <strong>Ingest 📥</strong>
            <ul className="list-disc pl-6">
              <li>User drops photo or emails it in.</li>
              <li>Supabase Storage event triggers Edge Function.</li>
            </ul>
          </li>
          <li>
            <strong>Pre-slice 🔪</strong>
            <ul className="list-disc pl-6">
              <li>Simple Python script (Pillow / OpenCV):</li>
              <PythonCodeBlock>{preSlicePythonCode.trim()}</PythonCodeBlock>
            </ul>
          </li>
          <li>
            <strong>Detect per-tile 🤖</strong>
            <ul className="list-disc pl-6">
              <li>YOLOv8s (weights: <code>yolov8s.pt</code> for now)</li>
              <li>Params: conf=0.10, iou=0.4 (loose ⇒ favour recall)</li>
              <li>Expect <strong>≤1</strong> box per tile; keep the highest-confidence one.</li>
            </ul>
          </li>
          <li>
            <strong>Post-process 📏</strong>
            <ol className="list-alpha pl-6">
              <li>Re-project tile-relative boxes to global binder coords.</li>
              <li>Run NMS across all 9 boxes to kill stray dupes.</li>
              <li>Expand bbox 2–3 % outward to capture card borders.</li>
            </ol>
          </li>
          <li>
            <strong>Crop & Thumb ✂️</strong>
            <ul className="list-disc pl-6">
              <li>Save full-res crop + 300×420 px thumbnail.</li>
              <li>Store paths in <code>cards</code> table with <code>tile_index</code>, <code>image_id</code>, <code>user_id</code>.</li>
            </ul>
          </li>
          <li>
            <strong>Enrichment 🧠</strong>
            <ul className="list-disc pl-6">
              <li>Send crop → Pokémon-TCG API search (by hash & basic OCR title pass).</li>
              <li>Write back <code>set_code</code>, <code>collector_number</code>, <code>market_price</code>.</li>
            </ul>
          </li>
          <li>
            <strong>Review UI 🖥️</strong>
            <ul className="list-disc pl-6">
              <li>FE shows 3×3 grid; each cell has: ✅ Accept ✏️ Edit 🗑️ Discard</li>
              <li>Accept writes <code>status = "confirmed"</code>; edit opens modal to change lookup.</li>
            </ul>
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="3. Current Status" headingLevel={2}>
        <table className="w-full body-medium" style={{ marginTop: 'var(--sds-size-space-400)' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th className="p-2" style={{ borderBottom: '1px solid var(--border-default)', width: '30%' }}>Piece</th>
              <th className="p-2" style={{ borderBottom: '1px solid var(--border-default)', width: '20%' }}>State</th>
              <th className="p-2" style={{ borderBottom: '1px solid var(--border-default)', width: '50%' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Pre-slice script</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>✅ Working</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>~4 ms per 4K image on dev box.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>YOLO inference</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>✅ Functional</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Vanilla weights: ~80% hit-rate; no fine-tune yet.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Global-coord remap</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>✅ Done</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Uses simple tile_origin + box.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>De-dup pass</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>🟡 WIP</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Need to test against tilted photos.</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Supabase Edge trigger</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>✅ Fires</td>
              <td className="p-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Upload → process_image(image_id).</td>
            </tr>
            <tr style={{ verticalAlign: 'top' }}>
              <td className="p-2">FE review grid</td>
              <td className="p-2">🟡 Placeholder</td>
              <td className="p-2">Static mock wired to dummy data.</td>
            </tr>
          </tbody>
        </table>
      </ContentSection>

      <ContentSection title="4. Next 3 Engineering Moves" headingLevel={2}>
        <ol className="list-decimal pl-6 body-medium space-y-2">
          <li>Fine-tune YOLO on ~500 labelled binder tiles to push accuracy → 95 %.</li>
          <li>Add homography correction option for users who snap photos at 30-degree tilt (detect outer binder border → warp to rectangle before slicing).</li>
          <li>Wire real Review UI to the <code>cards</code> table so accept/edit writes back to DB.</li>
        </ol>
      </ContentSection>

      <ContentSection title="5. Open Questions for AI Assistance" headingLevel={2}>
        <p className="body-medium">
          Questions where AI (like Claude, or other future assistants) can help tackle:
        </p>
        <ul className="list-disc pl-6 body-medium space-y-2">
          <li>Faster de-dup logic? (Currently plain NMS; could leverage tile index + centroid hashing.)</li>
          <li>Light-weight perspective rectification that won't add huge latency in Edge Function.</li>
          <li>Scoring heuristic for "uniform box sizes" to auto-flag suspect detections before they hit the UI.</li>
        </ul>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-400)' }}>
          <em>Handing this context to an AI assistant should fully sync them on the 3 × 3 slice strategy—and make them ready to contribute code or critique.</em>
        </p>
      </ContentSection>

    </PageLayout>
  );
} 
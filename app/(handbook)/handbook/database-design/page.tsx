'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

export default function DatabaseDesignPage() {
  return (
    <PageLayout
      title="📚 Database Design & Searchability"
      description="Authoritative reference for core tables, relationships, and what fields are searchable (text and vector)."
    >
      <ContentSection title="Overview" headingLevel={2}>
        <p className="body-medium">
          Project Arceus stores canonical card data, user scans, YOLO detections, and CLIP embeddings in Supabase (Postgres).
          This page defines the entities, relationships, and which fields are used for search in the app and worker.
        </p>
      </ContentSection>

      <ContentSection title="Core Entities" headingLevel={2}>
        <div className="body-medium">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>cards</strong> — Canonical catalogue. Key columns: <code>id</code>, <code>name</code>, <code>set_code</code>, <code>card_number</code>, <code>rarity</code>, <code>image_url</code>, pricing/meta.
            </li>
            <li>
              <strong>card_embeddings</strong> — pgvector-backed CLIP embeddings. Columns: <code>card_id</code> → <code>embedding vector(512)</code>, <code>image_url</code>, <code>model_version</code>.
            </li>
            <li>
              <strong>scans</strong> / <strong>scan_uploads</strong> — Upload events and progress/status for binder photos.
            </li>
            <li>
              <strong>card_detections</strong> — YOLO detections and guessed IDs. Columns: <code>scan_id</code>, <code>bbox</code>, <code>crop_url</code>, <code>guess_card_id</code>, <code>confidence</code>.
            </li>
            <li>
              <strong>user_cards</strong> — Inventory rows per user. Columns: <code>user_id</code>, <code>card_id</code>, <code>quantity</code>, <code>condition</code>.
            </li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Text Search (Cards)" headingLevel={2}>
        <p className="body-medium">
          The UI uses a fast text search RPC over <code>cards</code> for manual correction and browsing.
        </p>
        <ul className="list-disc pl-6 body-medium space-y-1">
          <li><strong>RPC</strong>: <code>search_cards(search_term TEXT)</code></li>
          <li><strong>Searchable fields</strong>: <code>name</code>, <code>set_code</code>, <code>card_number</code></li>
          <li><strong>Ordering</strong>: exact-prefix matches first, then partial, then by <code>name</code> → <code>set_code</code> → <code>card_number</code></li>
          <li><strong>Limit</strong>: 20 results; query trimmed; min length 2</li>
        </ul>
        <div className="code-block body-small" style={{ whiteSpace: 'pre-wrap', marginTop: 'var(--sds-size-space-300)' }}>{`-- supabase/migrations/20250721000002_recreate_card_search_function.sql
CREATE OR REPLACE FUNCTION search_cards(search_term TEXT)
RETURNS TABLE (id UUID, name TEXT, set_code TEXT, card_number TEXT, image_url TEXT) AS $$
BEGIN
  IF search_term IS NULL OR length(trim(search_term)) < 2 THEN RETURN; END IF;
  RETURN QUERY
  SELECT c.id, c.name, c.set_code, c.card_number, c.image_url
  FROM cards c
  WHERE c.name ILIKE '%' || trim(search_term) || '%'
     OR c.set_code ILIKE '%' || trim(search_term) || '%'
     OR c.card_number ILIKE '%' || trim(search_term) || '%'
  ORDER BY CASE WHEN c.name ILIKE trim(search_term) || '%' THEN 1
                WHEN c.name ILIKE '%' || trim(search_term) || '%' THEN 2
                ELSE 3 END,
           c.name, c.set_code, c.card_number
  LIMIT 20;
END; $$ LANGUAGE plpgsql;`}</div>
        <p className="body-small" style={{ marginTop: 'var(--sds-size-space-200)'}}>
          Frontend hook: <code>hooks/useCardSearch.ts</code> → <code>/api/cards/search?q=…</code> (supports rarity aliases like <code>sir</code>, <code>sar</code>, etc.).
        </p>
      </ContentSection>

      <ContentSection title="Vector Search (CLIP)" headingLevel={2}>
        <p className="body-medium">
          The worker identifies cards via CLIP embeddings against <code>card_embeddings</code> using pgvector.
        </p>
        <ul className="list-disc pl-6 body-medium space-y-1">
          <li><strong>Table</strong>: <code>card_embeddings(card_id TEXT PRIMARY KEY, embedding vector(512))</code> with <code>ivfflat</code> index.</li>
          <li><strong>RPC</strong>: <code>search_similar_cards(query_embedding vector(512), similarity_threshold float, max_results int)</code> (returns distance; worker converts to similarity).</li>
          <li><strong>Worker</strong>: <code>worker/clip_lookup.py</code> uses <code>.rpc('search_similar_cards', ...)</code> to fetch best matches.</li>
        </ul>
        <div className="code-block body-small" style={{ whiteSpace: 'pre-wrap', marginTop: 'var(--sds-size-space-300)' }}>{`-- supabase/migrations/20250115000000_create_card_embeddings_table.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE card_embeddings (
  card_id TEXT PRIMARY KEY,
  embedding vector(512) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX card_embeddings_embedding_idx
ON card_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`}</div>
      </ContentSection>

      <ContentSection title="Search Use-Cases by Feature" headingLevel={2}>
        <div className="body-medium">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Scan Review – Correction Modal</strong>: UI text search to replace <code>guess_card_id</code> using <code>name</code>, <code>set_code</code>, <code>card_number</code>.
            </li>
            <li>
              <strong>Worker Identification</strong>: CLIP vector search; stores best-match <code>card_id</code> on <code>card_detections.guess_card_id</code> with similarity as confidence.
            </li>
            <li>
              <strong>Inventory</strong>: Read joins via <code>user_cards.card_id → cards</code>; not directly searchable yet in UI.
            </li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Field Reference – What Must Be Searchable" headingLevel={2}>
        <div className="body-medium">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Card text</strong>: <code>cards.name</code> (trigram index), <code>cards.set_code</code>, <code>cards.card_number</code></li>
            <li><strong>Card visuals</strong>: <code>card_embeddings.embedding</code> (pgvector cosine)</li>
            <li><strong>Optional filters</strong> (future): <code>rarity</code>, <code>types</code>, <code>hp</code>, <code>artist</code></li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="API & Hooks Touchpoints" headingLevel={2}>
        <div className="body-medium">
          <ul className="list-disc pl-6 space-y-1">
            <li><code>app/api/cards/search/route.ts</code> – local JSON card search (aliases for rarities).</li>
            <li><code>hooks/useCardSearch.ts</code> – debounced UI search hook.</li>
            <li><code>services/cards.ts</code> – joins <code>card_detections</code> ↔ <code>cards</code> for review UI.</li>
            <li><code>worker/clip_lookup.py</code> – CLIP embedding search via <code>search_similar_cards</code>.</li>
          </ul>
        </div>
      </ContentSection>

      <ContentSection title="Open Questions / Next" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium space-y-1">
          <li>Add rarity/type filters to text search RPC?</li>
          <li>Expose a server route that proxies <code>search_cards</code> for SSR and RLS isolation?</li>
          <li>Unify local JSON search vs DB RPC when catalogue is fully synced.</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
}












-- Phase 3 prep: helper functions for retrieval v2
CREATE EXTENSION IF NOT EXISTS vector;

-- Match top-K templates with optional set hint
CREATE OR REPLACE FUNCTION public.match_card_templates(
  qvec vector(768),
  match_count int,
  set_hint text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  card_id text,
  set_id text,
  score double precision
) LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT t.id,
         t.card_id,
         t.set_id,
         1 - (t.emb <=> qvec) AS score
  FROM public.card_templates t
  WHERE (set_hint IS NULL OR t.set_id = set_hint)
  ORDER BY t.emb <=> qvec
  LIMIT match_count
$$;

-- Fetch prototypes as arrays for client-side fusion
CREATE OR REPLACE FUNCTION public.get_card_prototypes(
  ids text[]
) RETURNS TABLE (
  card_id text,
  emb float4[]
) LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT p.card_id,
         (p.emb)::float4[] AS emb
  FROM public.card_prototypes p
  WHERE p.card_id = ANY(ids)
$$;

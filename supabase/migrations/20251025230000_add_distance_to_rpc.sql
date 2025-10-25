-- Add distance to match_card_templates RPC for debugging
CREATE OR REPLACE FUNCTION public.match_card_templates(
  qvec vector(768),
  match_count int,
  set_hint text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  card_id text,
  set_id text,
  dist double precision,
  score double precision
) LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT t.id,
         t.card_id,
         t.set_id,
         t.emb <=> qvec AS dist,
         1 - (t.emb <=> qvec) AS score
  FROM public.card_templates t
  WHERE (set_hint IS NULL OR t.set_id = set_hint)
  ORDER BY t.emb <=> qvec
  LIMIT match_count
$$;


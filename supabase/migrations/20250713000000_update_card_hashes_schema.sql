-- Drop old table if exists (it used uuid and FK that fails for api slugs)
DROP TABLE IF EXISTS public.card_hashes;

-- New schema keyed by Pokémon-TCG API slug (e.g., "sv5-195")
CREATE TABLE public.card_hashes (
    api_id text PRIMARY KEY,
    phash text NOT NULL
);

-- Optional: index for faster substring searches if ever needed
CREATE INDEX IF NOT EXISTS card_hashes_phash_idx ON public.card_hashes (phash); 
CREATE TABLE public.card_hashes (
    card_id uuid PRIMARY KEY REFERENCES public.cards(id) ON DELETE CASCADE,
    phash text NOT NULL
); 
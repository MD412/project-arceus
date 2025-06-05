-- Table to store uploaded binder pages
CREATE TABLE public.binder_page_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    upload_timestamp timestamptz DEFAULT now() NOT NULL,
    processing_status text DEFAULT 'pending'::text NOT NULL, -- e.g., pending, processing, review_pending, completed, failed
    error_message text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security for binder_page_uploads
ALTER TABLE public.binder_page_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own binder page uploads
CREATE POLICY "Users can insert their own binder page uploads"
ON public.binder_page_uploads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own binder page uploads
CREATE POLICY "Users can view their own binder page uploads"
ON public.binder_page_uploads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own binder page uploads (e.g., status by functions)
CREATE POLICY "Users can update their own binder page uploads"
ON public.binder_page_uploads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Table to store pipeline review items for each card in a binder page
CREATE TABLE public.pipeline_review_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    binder_page_upload_id uuid NOT NULL REFERENCES public.binder_page_uploads(id) ON DELETE CASCADE,
    tile_index smallint NOT NULL CHECK (tile_index >= 0 AND tile_index <= 8),
    user_cropped_image_storage_path text NOT NULL,
    pipeline_suggested_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL, -- If suggested card is deleted from main cards table
    status text DEFAULT 'pending_review'::text NOT NULL, -- e.g., pending_review, user_confirmed, user_edited_new_card_id, user_discarded
    confirmed_card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL, -- If confirmed card is deleted from main cards table
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_binder_tile UNIQUE (binder_page_upload_id, tile_index)
);

-- Enable Row Level Security for pipeline_review_items
ALTER TABLE public.pipeline_review_items ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for pipeline_review_items updated_at
CREATE TRIGGER on_pipeline_review_items_updated
BEFORE UPDATE ON public.pipeline_review_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Policy: Users can insert review items linked to their binder uploads (service role or advanced function might do this)
-- This policy might be too open if users can directly call insert. Typically a Supabase function (using service_role) would insert these.
-- For now, let's assume a secure function handles insertions.

-- Policy: Users can view review items linked to their binder uploads
CREATE POLICY "Users can view their own pipeline review items"
ON public.pipeline_review_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.binder_page_uploads bpu
    WHERE bpu.id = binder_page_upload_id AND bpu.user_id = auth.uid()
  )
);

-- Policy: Users can update their own pipeline review items (for status changes in Review UI)
CREATE POLICY "Users can update their own pipeline review items"
ON public.pipeline_review_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.binder_page_uploads bpu
    WHERE bpu.id = binder_page_upload_id AND bpu.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.binder_page_uploads bpu
    WHERE bpu.id = binder_page_upload_id AND bpu.user_id = auth.uid()
  )
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_binder_page_uploads_user_id ON public.binder_page_uploads(user_id);
CREATE INDEX idx_pipeline_review_items_binder_id ON public.pipeline_review_items(binder_page_upload_id);
CREATE INDEX idx_pipeline_review_items_status ON public.pipeline_review_items(status); 
-- Migration: Post-Deployment Fixes based on o3 feedback
-- Addresses performance, indexing, and FK action improvements

-- ✏️ Case-folding index for better text search performance
create index if not exists idx_cards_name_lower on cards using gin (lower(name) gin_trgm_ops);

-- ✏️ Add missing index for scan → detections joins
create index if not exists idx_detections_scan on card_detections(scan_id);

-- ✏️ Consider FK actions for user_cards.detection_id
-- If accidentally deleting a detection row would orphan inventory, set to null instead
alter table if exists user_cards 
  drop constraint if exists user_cards_detection_id_fkey;

alter table if exists user_cards
  add constraint user_cards_detection_id_fkey 
  foreign key (detection_id) references card_detections(id) on delete set null;

-- ✏️ Add service role policies for scans and user_cards if workers need unrestricted access
create policy "service can manage scans"
  on scans for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "service can manage user_cards"
  on user_cards for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- ✏️ Improve trigger to avoid pointless writes
create or replace function handle_updated_at()
returns trigger as $$
begin
  -- Only update if the updated_at field is NULL (on INSERT) or if other fields changed
  if TG_OP = 'INSERT' then
    if NEW.updated_at IS NULL then
      NEW.updated_at = now();
    end if;
  elsif TG_OP = 'UPDATE' then
    -- Only update timestamp if other fields actually changed
    if OLD.updated_at IS DISTINCT FROM NEW.updated_at then
      -- User is explicitly setting updated_at, don't override
      return NEW;
    else
      NEW.updated_at = now();
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- ✏️ Add GIN index for bbox if we'll query by bounding box later (e.g. retraining)
-- Note: This is optional - only create if you plan to query by spatial data
-- create index if not exists idx_detections_bbox on card_detections using gin (bbox);

-- Grant statement for any future tables (reminder for documentation)
-- Note: This is a reminder that new tables won't inherit these grants automatically
-- Consider using Supabase's "apply owner grants" setting or document this requirement

comment on table cards is 'Master catalog of all Pokemon cards (shared by all users)';
comment on table scans is 'Upload events per user with progress tracking';
comment on table card_detections is 'ML detection results with bounding boxes and confidence';
comment on table user_cards is 'Individual card ownership records - the key table for collections'; 
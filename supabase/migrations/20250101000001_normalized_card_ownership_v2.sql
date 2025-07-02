-- Migration: Normalized Card Ownership Architecture (v2)
-- Incorporates expert feedback for production-ready deployment

-- Enable UUID generation if not already enabled
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- For faster text search

-- Canonical catalogue of TCG cards (shared by everyone)
create table cards (
  id uuid primary key default gen_random_uuid(),
  tcgplayer_id int unique,
  pokemon_tcg_api_id text unique,
  name text not null,
  set_code text,
  set_name text,
  card_number text,
  rarity text,
  pokemon_name text,
  hp integer,
  types text[],
  artist text,
  image_urls jsonb default '{}',
  market_price numeric(12,4), -- ✏️ Increased precision for JPY/graded cards
  price_updated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- ✏️ Prevent duplicate cards in same set
  constraint uniq_set_num unique (set_code, card_number)
);

-- Add indexes for performance
create index idx_cards_name on cards (name);
create index idx_cards_set on cards (set_code);
create index idx_cards_tcgplayer on cards (tcgplayer_id);
create index idx_cards_pokemon_api on cards (pokemon_tcg_api_id);
-- ✏️ GIN index for fast fuzzy text search
create index idx_cards_name_trgm on cards using gin (name gin_trgm_ops);

-- One upload event per binder photo
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text,
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  progress numeric(5,2) default 0 check (progress >= 0 and progress <= 100), -- ✏️ Allow decimal progress
  storage_path text,
  summary_image_path text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Crops + detection metadata for debugging / retraining
create table card_detections (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id) on delete cascade not null,
  crop_url text not null,
  bbox int[], -- ✏️ Store as [x,y,w,h] array instead of JSONB for performance
  guess_card_id uuid references cards(id),
  confidence numeric check (confidence >= 0 and confidence <= 1),
  detection_method text default 'yolo_v8',
  tile_source char(2) check (tile_source ~ '^[ABC][123]$'), -- ✏️ Validate tile format
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- **Inventory rows that belong to a user**
-- This is the key table - each physical card instance owned by a user
create table user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  detection_id uuid references card_detections(id),
  card_id uuid references cards(id) not null,
  condition text default 'unknown' check (condition in ('mint', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged', 'unknown')),
  quantity int default 1 check (quantity > 0),
  estimated_value numeric(12,4), -- ✏️ Increased precision
  notes text,
  added_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ✅ Row-level security for scans
alter table scans enable row level security;
create policy "users can view own scans"
  on scans for select
  using ( auth.uid() = user_id );
create policy "users can insert own scans"
  on scans for insert
  with check ( auth.uid() = user_id );
create policy "users can update own scans"
  on scans for update
  using ( auth.uid() = user_id );
create policy "users can delete own scans"
  on scans for delete
  using ( auth.uid() = user_id );

-- ✅ Row-level security for detections (inherit from scan ownership)
alter table card_detections enable row level security;
create policy "users can view own detections"
  on card_detections for select
  using ( 
    exists (
      select 1 from scans 
      where scans.id = card_detections.scan_id 
      and scans.user_id = auth.uid()
    )
  );
create policy "service can manage detections"
  on card_detections for all
  using ( auth.jwt() ->> 'role' = 'service_role' );

-- ✅ Row-level security for user_cards (THE CRITICAL TABLE!)
alter table user_cards enable row level security;
create policy "users can view own cards"
  on user_cards for select
  using ( auth.uid() = user_id );
-- ✏️ Separate insert policy with WITH CHECK
create policy "users insert own cards"
  on user_cards for insert
  with check ( auth.uid() = user_id );
create policy "users update own cards"
  on user_cards for update
  using ( auth.uid() = user_id );
create policy "users delete own cards"
  on user_cards for delete
  using ( auth.uid() = user_id );

-- Helpful indexes for dashboard queries
create index idx_user_cards_user on user_cards (user_id);
create index idx_user_cards_card on user_cards (card_id);
create index idx_user_cards_detection on user_cards (detection_id);
create index idx_user_cards_user_card on user_cards (user_id, card_id); -- ✅ Composite for "do I own this?"

-- Add triggers for updated_at timestamps
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scans_updated_at
  before update on scans
  for each row execute function handle_updated_at();

create trigger user_cards_updated_at
  before update on user_cards
  for each row execute function handle_updated_at();

-- ✏️ Add trigger to card_detections for manual review updates
create trigger card_detections_updated_at
  before update on card_detections
  for each row execute function handle_updated_at();

-- Helper function to create a scan and return the ID
create or replace function create_scan_with_user(
  p_user_id uuid,
  p_title text,
  p_storage_path text
) returns uuid
language plpgsql
security definer
as $$
declare
  scan_id uuid;
begin
  insert into scans (user_id, title, storage_path)
  values (p_user_id, p_title, p_storage_path)
  returning id into scan_id;
  
  return scan_id;
end;
$$;

-- 🛑 FIXED: Proper privilege grid (not blanket grants to anon)
grant usage on schema public to anon, authenticated, service_role;

-- ✏️ Saner permissions: anon gets SELECT only
grant select on all tables in schema public to anon;
grant select on all sequences in schema public to anon;

-- ✏️ Authenticated users get full CRUD on their own data (RLS enforces)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ✏️ Service role gets everything (for workers)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Function permissions
grant execute on all functions in schema public to anon, authenticated, service_role; 
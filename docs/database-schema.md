# Project Arceus Database Schema Documentation

Generated: August 6, 2025

## Overview
This document maps out the complete database schema including tables, views, functions, and RLS policies.

## Tables

### 1. `scans`
Main table for storing scan uploads.
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- title: text
- status: text ('processing', 'ready', 'error')
- progress: numeric(5,2) (0-100)
- storage_path: text
- summary_image_path: text
- error_message: text
- created_at: timestamptz
- updated_at: timestamptz
```

### 2. `job_queue`
Background job processing queue.
```sql
- id: uuid (primary key)
- scan_upload_id: uuid
- status: text ('pending', 'processing', 'completed', 'failed', 'cancelled')
- job_type: text (default: 'process_scan_page')
- payload: jsonb
- run_at: timestamptz
- picked_at: timestamptz
- started_at: timestamptz
- completed_at: timestamptz
- retry_count: smallint
- error_message: text
- worker_id: text
- visibility_timeout_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### 3. `worker_health`
Worker heartbeat tracking.
```sql
- id: text (primary key)
- last_heartbeat: timestamptz
```

### 4. `cards`
Pokemon card catalog.
```sql
- id: text (primary key - card ID)
- name: text
- set_name: text
- collector_number: text
- rarity: text
- types: text[]
- hp: integer
- image_url: text
- data: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

### 5. `card_embeddings`
CLIP embeddings for visual card identification.
```sql
- card_id: text (primary key, references cards.id)
- embedding: vector(512)
- model_version: text
- image_url: text
- created_at: timestamptz
- updated_at: timestamptz
```

### 6. `detections`
Individual card detections from scans.
```sql
- id: uuid (primary key)
- scan_id: uuid (references scans.id)
- card_index: integer
- card_name: text
- card_id: text (references cards.id)
- cropped_image_path: text
- enrichment_success: boolean
- identification_confidence: float
- created_at: timestamptz
```

### 7. `user_cards`
User's card collection.
```sql
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- card_id: text (references cards.id)
- quantity: integer
- condition: text
- notes: text
- created_at: timestamptz
- updated_at: timestamptz
```

## Views

### 1. `scan_uploads`
Compatibility view for legacy code expecting old table name.
```sql
CREATE VIEW scan_uploads AS
SELECT
    id,
    user_id,
    title AS scan_title,
    status AS processing_status,
    progress,
    storage_path,
    summary_image_path,
    error_message,
    created_at,
    updated_at,
    jsonb_build_object(
        'summary_image_path', summary_image_path,
        'total_cards_detected', 0
    ) AS results,
    storage_path AS content_hash
FROM scans;
```

## Functions

### 1. `dequeue_and_start_job()`
Worker function to claim and start processing a job.
```sql
RETURNS TABLE(
    job_id uuid,
    scan_upload_id uuid,
    job_type text,
    payload jsonb
)
- Finds oldest pending job
- Sets status to 'processing'
- Sets visibility timeout (5 minutes)
- Returns job details
```

### 2. `finalize_job(p_job_id uuid, p_success boolean, p_error_message text)`
Mark job as completed or failed.
```sql
- Updates job status
- Sets completed_at timestamp
- Records error message if failed
- Updates scan status accordingly
```

### 3. `enqueue_scan_job(p_user_id uuid, p_scan_id uuid, p_storage_path text)`
Create a new scan processing job.
```sql
RETURNS uuid (job_id)
- Creates/updates scan record
- Creates job_queue entry
- Returns new job ID
```

### 4. `search_cards_by_embedding(query_embedding vector, similarity_threshold float, max_results int)`
CLIP-based visual card search.
```sql
RETURNS TABLE(
    card_id text,
    name text,
    set_name text,
    collector_number text,
    image_url text,
    similarity float
)
```

## Storage Buckets

### 1. `scans`
- Stores uploaded scan images
- Path format: `{user_id}/{scan_id}/{filename}`

### 2. `detections`
- Stores cropped card images
- Path format: `{scan_id}/{detection_id}.jpg`

## RLS Policies

### Database Tables
- `scans`: Users can only see/modify their own scans
- `detections`: Users can only see detections from their scans
- `user_cards`: Users can only see/modify their own collection
- `cards`: Public read access
- `card_embeddings`: Public read access

### Storage Buckets
- `scans`: INSERT/SELECT/UPDATE/DELETE for authenticated users on their own files
- `detections`: SELECT for authenticated users on their scan's detections

## Indexes
- `job_queue`: status, run_at (for dequeue queries)
- `card_embeddings`: vector index for similarity search
- `detections`: scan_id (for fetching scan results)
- `user_cards`: user_id, card_id (for collection queries)
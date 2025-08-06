# Project Arceus API Endpoints Documentation

Generated: August 6, 2025

## Overview
This document maps all API endpoints to their database operations and Supabase interactions.

## API Routes

### 1. Scans Management

#### `GET /api/scans`
Fetch user's scans list.
- **Database**: Query `scans` table
- **Auth**: Required (user context)
- **Operations**:
  - `supabase.from('scans').select('*').eq('user_id', userId)`
  - Orders by `created_at` descending

#### `POST /api/scans/bulk`
Bulk upload scan images (1-200 files).
- **Database**: Creates scan records and jobs
- **Auth**: Required (user context)
- **Operations**:
  1. Upload files to `scans` storage bucket
  2. Call RPC `enqueue_scan_job(userId, scanId, storagePath)` for each file
- **Storage Path**: `{userId}/{scanId}.jpg`

#### `GET /api/scans/{id}`
Get specific scan details.
- **Database**: Query `scans` table by ID
- **Auth**: Required (user must own scan)
- **Operations**:
  - `supabase.from('scans').select('*').eq('id', scanId).single()`

#### `GET /api/scans/{id}/detections`
Get card detections for a scan.
- **Database**: Query `detections` table
- **Auth**: Required (user must own scan)
- **Operations**:
  - `supabase.from('detections').select('*').eq('scan_id', scanId)`

#### `POST /api/scans/{id}/approve`
Approve detected cards and add to collection.
- **Database**: Updates `user_cards` table
- **Auth**: Required (user must own scan)
- **Operations**:
  - Upserts cards to user's collection
  - Updates quantities if cards already exist

#### `POST /api/scans/{id}/retry`
Retry processing a failed scan.
- **Database**: Updates `job_queue` status
- **Auth**: Required (user must own scan)
- **Operations**:
  - Resets job status to 'pending'
  - Clears error messages

#### `DELETE /api/scans/{id}`
Delete a scan (handled by command queue).
- **Database**: Creates delete command
- **Auth**: Required (user must own scan)
- **Operations**:
  - Enqueues delete command (see commands section)

#### `POST /api/scans/cleanup-failed`
Clean up failed scans older than 30 days.
- **Database**: Deletes old failed scans
- **Auth**: Service role only
- **Operations**:
  - Deletes from `scans` where status='error' and older than 30 days
  - Cascades to `detections` and `job_queue`

#### `POST /api/scans/fix-stuck`
Fix stuck processing jobs.
- **Database**: Updates stuck jobs
- **Auth**: Service role only
- **Operations**:
  - Updates jobs stuck in 'processing' > 1 hour
  - Resets to 'pending' status

### 2. Cards & Collection

#### `GET /api/cards/search`
Search cards by name.
- **Database**: Query `cards` table
- **Auth**: Not required
- **Operations**:
  - Full-text search on card names
  - Returns card details with images

#### `GET /api/user-cards`
Get user's card collection.
- **Database**: Query `user_cards` joined with `cards`
- **Auth**: Required
- **Operations**:
  - `supabase.from('user_cards').select('*, card:cards(*)')`
  - Filters by user_id

#### `POST /api/user-cards`
Add/update cards in collection.
- **Database**: Upsert `user_cards`
- **Auth**: Required
- **Operations**:
  - Upserts card with quantity and condition
  - Creates or updates existing entries

#### `DELETE /api/user-cards/{id}`
Remove card from collection.
- **Database**: Delete from `user_cards`
- **Auth**: Required
- **Operations**:
  - Deletes specific user_card entry

### 3. Collections (Future Feature)
#### `GET /api/collections`
Get user's collections/binders.
- **Status**: Placeholder endpoint
- **Returns**: Empty array (feature not implemented)

### 4. Commands (Async Operations)

#### `POST /api/commands/delete-scan`
Enqueue scan deletion command.
- **Database**: Command queue pattern
- **Auth**: Required
- **Pattern**: Optimistic CRUD Pipeline (Factorio Pattern)
- **Operations**:
  1. Validates user owns scan
  2. Creates command record
  3. Returns immediately (async processing)
  4. Background worker handles actual deletion

### 5. Training Data

#### `POST /api/training/feedback`
Submit ML training feedback.
- **Database**: Stores training data
- **Auth**: Required
- **Categories**:
  - 🚫 Not a Card
  - 📚 Missing from DB
  - ❌ Wrong ID
  - ✅ Correct (low confidence)
- **Storage**: Local filesystem in `training_data/`

#### `POST /api/training/upload`
Upload corrected training data.
- **Database**: Updates training datasets
- **Auth**: Required
- **Operations**:
  - Stores corrected card images
  - Links to correct card IDs

## Database Functions Used

### RPC Functions
1. `enqueue_scan_job(userId, scanId, storagePath)`
   - Creates scan record
   - Creates job_queue entry
   - Returns job ID

2. `dequeue_and_start_job()`
   - Used by worker, not API directly
   - Claims pending jobs

3. `finalize_job(jobId, success, errorMessage)`
   - Used by worker, not API directly
   - Marks jobs complete/failed

4. `search_cards_by_embedding(embedding, threshold, limit)`
   - Used by worker for CLIP search
   - Visual card identification

## Authentication Patterns

### User Context Required
- All `/api/scans/*` endpoints (except cleanup/fix)
- All `/api/user-cards/*` endpoints
- All `/api/commands/*` endpoints
- All `/api/training/*` endpoints

### Public Access
- `/api/cards/search` - Card catalog is public

### Service Role Only
- `/api/scans/cleanup-failed`
- `/api/scans/fix-stuck`

## Error Handling

### Common Status Codes
- `401`: Authentication required
- `403`: Forbidden (user doesn't own resource)
- `404`: Resource not found
- `413`: Payload too large (>200 files)
- `500`: Server error (often RLS violations)

### RLS Violations
When you see "new row violates row-level security policy":
1. Check user authentication
2. Verify resource ownership
3. Check RLS policies on tables/buckets

## Storage Buckets

### `scans` Bucket
- Path: `{userId}/{scanId}.jpg`
- RLS: Users can only access their own files
- Operations: INSERT, SELECT, UPDATE, DELETE

### `detections` Bucket
- Path: `{scanId}/{detectionId}.jpg`
- RLS: Users can see detections from their scans
- Operations: SELECT only (created by worker)
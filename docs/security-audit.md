# Security Audit Report

**Date:** 2024-05-29
**Auditor:** ChatGPT (gpt-5-codex)

## Executive Summary

This review identified multiple critical vulnerabilities that allow unauthenticated callers to perform privileged operations via Supabase service-role access. Attackers can read or modify any user's collection data, manipulate scan processing records, and download private card images without authentication. Immediate remediation is required to avoid data loss, account takeover, and abuse of background processing infrastructure.

## Methodology

* Manual source-code review of the `/app/api` routes and Supabase edge functions.
* Focus on authentication, authorization, and sensitive data handling.
* Severity classification: Critical (system compromise/data disclosure likely), High (major abuse vector), Medium (defense-in-depth issue), Low (minor hardening opportunity).

## Findings

### 1. Unauthenticated service-role endpoints expose full collection control (Critical)

The API routes below instantiate the Supabase service-role client (`supabaseAdmin`) and trust caller-supplied identifiers without verifying the caller's session. Because the service-role key bypasses RLS, any unauthenticated request can read or mutate arbitrary users' collections and detections:

* `POST /api/collections` accepts `{ userId, cards[] }` and inserts/updates `user_cards` rows for that user with service-role privileges.【F:app/api/collections/route.ts†L1-L89】
* `GET /api/collections` returns the full card list (including stored crop URLs) for any `user_id` query parameter.【F:app/api/collections/route.ts†L91-L172】
* `POST /api/user-cards` inserts `user_cards` rows for any `user_id` supplied in the body.【F:app/api/user-cards/route.ts†L1-L36】
* `PATCH /api/user-cards/[id]/replace` rewrites an existing `user_cards` record by ID, including creating new `cards` rows on demand.【F:app/api/user-cards/[id]/replace/route.ts†L1-L96】
* `PATCH /api/detections/[id]/correct` changes `card_detections.guess_card_id` without checking ownership.【F:app/api/detections/[id]/correct/route.ts†L1-L96】

Impact: Attackers can steal all card inventory data, corrupt collection records, or poison training data. Because these endpoints live under `/api`, they are callable from the public internet.

Recommendation: Require authenticated Supabase sessions (via `supabaseServer` and `auth.getUser()`), validate the user against the requested resource, and use the anon client whenever possible. Only elevate to service-role inside trusted server-side jobs, not public API handlers.

### 2. Service-role training endpoint leaks private scan imagery (Critical)

`POST /api/training/add-failure` uses the service-role client to fetch any `card_detections` row by ID, then downloads the associated crop image from Supabase Storage and writes it to disk without authenticating the caller.【F:app/api/training/add-failure/route.ts†L18-L190】 An attacker can iterate over detection IDs to exfiltrate all uploaded card crops or the original scan images.

Recommendation: Restrict this endpoint to authenticated users with ownership checks, or move the workflow to a trusted backend job. Never expose service-role storage access to unauthenticated callers.

### 3. Scan lifecycle commands trust forged headers (High)

Endpoints such as `POST /api/commands/delete-scan`, `POST /api/scans/[id]/retry`, and `POST /api/scans/[id]/approve` rely on caller-supplied IDs (header `x-user-id` or route params) while using the service-role client.【F:app/api/commands/delete-scan/route.ts†L1-L58】【F:app/api/scans/[id]/retry/route.ts†L1-L62】【F:app/api/scans/[id]/approve/route.ts†L1-L160】 With no session validation, anyone can soft-delete scans, requeue jobs, or approve detections for any user. This enables denial-of-service and mass data tampering.

Recommendation: Authenticate requests, derive the user ID from the session, and add explicit authorization checks before mutating scan records. Prefer stored procedures that enforce ownership server-side if service-role access is unavoidable.

### 4. Development test endpoint bypasses authentication with service-role key (High)

`POST /api/scans/bulk/test` is intended for development but only guards itself with `NODE_ENV !== 'production'`. When deployed to staging or if the environment variable is misconfigured, it lets unauthenticated callers upload arbitrary files and enqueue jobs for a hard-coded user ID using service-role privileges.【F:app/api/scans/bulk/test/route.ts†L1-L58】 This enables storage abuse and bogus job injection.

Recommendation: Remove the route from builds outside local development or require authenticated admin roles. Avoid using service-role keys in public HTTP handlers.

### 5. Supabase Edge function logs sensitive request data (Medium)

The `process-new-binder-upload` function logs every request header and the raw request body to console before validation.【F:supabase/functions/process-new-binder-upload/index.ts†L35-L148】 Storage webhook payloads can contain authorization metadata; logging them risks leaking tokens or personal data to shared logs.

Recommendation: Redact or remove verbose logging of headers and bodies, especially in production functions.

### 6. Local file writes use attacker-controlled filenames (Medium)

`POST /api/training/add-failure` builds filenames directly from `detection_id` (e.g., `card_crops/<type>/<detection_id>...`) before writing to disk.【F:app/api/training/add-failure/route.ts†L68-L118】 If an attacker exploits Finding #2 to hit this endpoint, they can supply detection IDs containing path separators to attempt directory traversal or overwrite existing training data.

Recommendation: Sanitize identifiers used in filesystem paths (allow only UUIDs) and store files in isolated storage, not the Next.js server's filesystem.

## Remediation Status (2025-10-16)

* ✅ Finding 1 addressed: collection and user-card routes now require authenticated Supabase sessions and enforce ownership checks before using the service-role client.【app/api/collections/route.ts:1】【app/api/user-cards/route.ts:1】【app/api/user-cards/[id]/replace/route.ts:1】
* ✅ Finding 2 addressed: the training feedback endpoint validates the caller, verifies scan ownership, and records metadata with user attribution before touching storage.【app/api/training/add-failure/route.ts:1】
* ✅ Finding 3 addressed: scan lifecycle endpoints now derive the user from the session, confirm resource ownership, and restrict service-role actions accordingly.【app/api/commands/delete-scan/route.ts:1】【app/api/scans/[id]/route.ts:1】【app/api/scans/[id]/retry/route.ts:1】【app/api/scans/[id]/approve/route.ts:1】
* ✅ Finding 4 addressed: the bulk test uploader requires an authenticated session and is completely disabled unless `ENABLE_BULK_TEST_ROUTE` is explicitly set to `true`.【app/api/scans/bulk/test/route.ts:1】

## Additional Recommendations

* Audit all remaining API routes for service-role usage and convert them to user-scoped clients where possible.
* Rotate the Supabase service-role key after patching to invalidate any leaked credentials.
* Add automated tests or middleware enforcing authentication on every `/api` route to prevent regressions.

## Conclusion

The most urgent task is eliminating unauthenticated access to service-role Supabase clients. Without fixes, attackers can fully compromise user data and background processing. Address the critical findings immediately, then tackle the high and medium severity items to harden the platform.

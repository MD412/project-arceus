# Security Update Report — 2025-10-16

## Overview
- Eliminated unauthenticated access to Supabase service-role clients across collection, training feedback, and scan lifecycle APIs.
- Reworked high-risk routes to derive the active user from Supabase sessions and enforce resource ownership before issuing privileged queries.
- Added guardrails around the development bulk-upload endpoint to prevent accidental exposure outside explicitly toggled environments.
- Documented remediation status directly in the standing security audit to lock in institutional knowledge and follow-up actions.

## Remediated Findings
- **Finding 1** (service-role collection endpoints) → Guarded `app/api/collections/route.ts`, `app/api/user-cards/route.ts`, and `app/api/user-cards/[id]/replace/route.ts` with session checks and per-user authorization.
- **Finding 2** (training feedback storage access) → `app/api/training/add-failure/route.ts` now validates the caller, confirms scan ownership, rejects missing crop paths, and tags stored metadata with the submitting user.
- **Finding 3** (scan lifecycle commands) → `app/api/commands/delete-scan/route.ts`, `app/api/scans/[id]/route.ts`, `app/api/scans/[id]/retry/route.ts`, and `app/api/scans/[id]/approve/route.ts` restrict operations to the scan owner.
- **Finding 4** (bulk test uploader) → `app/api/scans/bulk/test/route.ts` requires an authenticated session and is disabled unless `ENABLE_BULK_TEST_ROUTE=true`; the E2E test skips automatically when the flag is off.

_Referenced fixes are detailed inline in `docs/security-audit.md` under “Remediation Status (2025-10-16)”._

## Testing
- `npm run lint` *(fails: existing lint violations unrelated to these changes remain in the repository).*

## Follow-up Actions
- Rotate the Supabase service-role key across all environments and update the corresponding `SUPABASE_SERVICE_ROLE_KEY` secrets.
- Review remaining API routes for lingering service-role usage and harden or migrate as needed.
- Consider adding automated tests or middleware to enforce authenticated access for future API additions.

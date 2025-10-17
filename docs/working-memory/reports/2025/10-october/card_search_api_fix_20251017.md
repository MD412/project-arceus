# Card Search API Fix – October 17, 2025

**Owner:** Codex (GPT-5)  
**Status:** ✅ Completed  
**Related UI:** CardDetailModal, CardCorrectionModal search inputs

## Problem

- Search modals in collection and scan review flows were returning “Search failed, please try again.”  
- Server logs showed `column cards.image_url does not exist` and missing RPC (`search_cards`) errors.  
- Frontend `.toFixed()` call occasionally crashed when the API returned non-numeric `market_price` values.

## Resolution

- Rebuilt `app/api/cards/search/route.ts` to:
  - Use `supabaseAdmin()` and query `cards` directly (no reliance on deprecated `search_cards` RPC).
  - Sanitize queries, search across name/number/set fields, and limit to 30 results.
  - Normalize `market_price` values and flatten `image_urls` JSON into the expected `image_url` string.
- Hardened `components/ui/CardSearchInput.tsx` to guard against non-numeric `market_price` values before formatting.
- Updated `docs/working-memory/active_context.md` so ongoing work tracks the new “Monitor card search” follow-up.

## Follow-Ups

1. Instrument latency/error metrics for the direct Supabase query; confirm performance under real data volumes.
2. Consider consolidating duplicated search UI/logic once stability is confirmed.
3. Update any worker scripts still expecting `image_url` fields to rely on `image_urls.small` for consistency.

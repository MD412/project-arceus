#!/usr/bin/env python3
"""Diagnostic helper for Project Arceus.

Usage:
    python scripts/diagnose_scan.py <scan_id>

Given a scan UUID, this script outputs:
1. The raw scan_uploads row
2. The associated scans row (if the normalized pipeline created one)
3. All card_detections rows for that scan (count + first 5 samples)

It uses the Supabase service-role key so it can bypass RLS and see all rows.
Environment variables are automatically loaded from .env.local file.

README snippet:
    # Diagnose a scan
    python scripts/diagnose_scan.py 12345678-1234-1234-1234-123456789abc
    
    # If you get import errors, install dependencies:
    pip install python-dotenv supabase
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any, List

try:
    from dotenv import load_dotenv
    # Load environment variables from .env.local file
    load_dotenv(".env.local")
except ImportError:  # pragma: no cover
    print("💥  python-dotenv not installed. Run `pip install python-dotenv` in your environment.")
    print("    Or set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY manually.")

try:
    from supabase import create_client  # type: ignore
except ImportError:  # pragma: no cover
    print("💥  supabase-py not installed.  Run `pip install supabase` in your environment.")
    sys.exit(1)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_KEY:
    print("❌  Missing SUPABASE env vars.")
    print("    Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    print("    Or set them manually in your environment.")
    sys.exit(1)

if len(sys.argv) != 2:
    print("Usage: python scripts/diagnose_scan.py <scan_id>")
    sys.exit(1)

scan_id_arg = sys.argv[1]

supabase = create_client(SUPABASE_URL, SERVICE_KEY, options={"auth": {"persistSession": False}})


def pretty(title: str, payload: Any) -> None:
    print(f"\n=== {title} ===")
    print(json.dumps(payload, indent=2, default=str) if payload else "(none)")


# 1. scan_uploads row
upload_resp = supabase.from_("scan_uploads").select("*").eq("id", scan_id_arg).execute()
pretty("scan_uploads", upload_resp.data)

# Determine the normalized scan_id (if pipeline migrated)
normalized_scan_id: str | None = None
if upload_resp.data:
    first = upload_resp.data[0]
    results = first.get("results") or {}
    normalized_scan_id = results.get("scan_id")

# 2. scans row (normalized pipeline)
if normalized_scan_id:
    scans_resp = supabase.from_("scans").select("*").eq("id", normalized_scan_id).execute()
    pretty("scans", scans_resp.data)
else:
    print("\n(no associated scans row – legacy pipeline upload)")

# 3. card_detections rows
scan_id_for_detections = normalized_scan_id or scan_id_arg

# Count first to avoid huge prints
count_resp = (
    supabase.rpc("count_card_detections", {"p_scan_id": scan_id_for_detections})
    if False  # stored function may not exist; fall back
    else supabase.from_("card_detections").select("id", count="exact").eq("scan_id", scan_id_for_detections)
)

detections_count = count_resp.count if hasattr(count_resp, "count") else len(count_resp.data or [])
print(f"\nTotal detections: {detections_count}")

sample_resp = (
    supabase.from_("card_detections")
    .select("id,bbox,crop_url,guess_card_id,confidence")
    .eq("scan_id", scan_id_for_detections)
    .limit(5)
    .execute()
)
pretty("card_detections sample (first 5)", sample_resp.data)

print("\n✅  Diagnose complete.") 
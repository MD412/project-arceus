# Scan-Review Wizard – API Endpoint Reference

> Working document for the upcoming wizard rebuild. Keep this file in sync with any route or RPC changes.

## Legend
* `:id` ＝ UUID for a scan record  
* `:detectionId` ＝ UUID for a `card_detections` row

All endpoints are authenticated (Supabase JWT) and return JSON.

---

## 1. Scan Metadata
### GET `/api/scans/:id`
Returns the high-level scan record.
```jsonc
{
  "id": "uuid",
  "title": "Binder Page 1",
  "status": "processing" | "completed" | "rejected",
  "progress": 37.5,
  "storage_path": "scans/user1/…/original.jpg",
  "summary_image_path": "card-crops/…/summary.jpg",
  "created_at": "2025-07-24T12:34:56Z"
}
```

---

## 2. Detections
### GET `/api/scans/:id/detections`
Returns all detections for the scan with a shallow join to the cards table.
```jsonc
[
  {
    "id": "uuid",
    "guess_card_id": "uuid | null",
    "confidence": 0.82,
    "bbox": [x, y, w, h],
    "crop_url": "card-crops/…/crop_0.jpg",
    "cards": {
      "id": "uuid",
      "name": "Charizard ex",
      "set_code": "sv1",
      "card_number": "003",
      "image_url": "…"
    }
  },
  { … }
]
```

### PATCH `/api/card-detections/:detectionId`
```jsonc
// request body
{ "guess_card_id": "uuid" }
```
Purpose: update a single detection after user correction. Success → `200 OK`.

---

## 3. Bulk Actions
### POST `/api/scans/:id/approve`
Soft-approves the entire scan. Server inserts `DELETE_SCAN` (or similar) into `command_queue` for background processing and returns:
```jsonc
{ "accepted": true, "commandId": "uuid" }
```

### POST `/api/scans/:id/reject`
Marks the scan as `rejected`. Same shape response.

---

## 4. Card Search
### GET `/api/cards/search?q=searchTerm`
Local JSON search service. Returns up to 20 results with IDs already translated to DB UUIDs (via translation service).

```jsonc
[
  {
    "id": "uuid",          // DB-compatible
    "display_name": "Charizard ex – SV #3",
    "image_thumbnail": "…"
  }
]
```

---

## 5. Helper RPC (database)
### `SELECT translate_card_id('base1-4') AS uuid;`
Proposed Postgres function that converts legacy set-code IDs to the cards table UUID.

---

## Error Model
All endpoints respond with standard error envelope:
```jsonc
{ "error": { "message": "…", "code": "XYZ" } }
```

---

_Last updated: 2025-07-25_
# Fonea × Assistant Integration Contract (Phase 0)

**Canonical types:** `Platform`, `Song` (English).

**CSV schema (English):**  
`title,artist,featuring,album,year,producer,platforms,liked,toAdd,comments`.

---

## Feedback payload

```json
{ "liked": ["id"], "disliked": ["id"], "add": ["id"], "comments": "optional" }

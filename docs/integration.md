Fonea × Assistant Integration Contract (Phase 0)

Canonical types: Platform, Song (English).

CSV schema (English): title,artist,featuring,album,year,producer,platforms,liked,toAdd,comments.

Feedback payload:

{ "liked": ["id"], "disliked": ["id"], "add": ["id"], "comments": "optional" }

Session model (string sessionId).

Assistant rules:
Always 20 proposals per round.
Keep toAdd, remove disliked, prioritize liked, refill with new.
Post JSON in canonical English Song.

Bridge API (minimal):
POST /sessions → { sessionId }
POST /sessions/{id}/tracks with { source: "assistant"|"app", tracks: Song[], note?: string }
GET /sessions/{id}/tracks → { assistantTracks, appTracks }
POST /sessions/{id}/feedback → feedback JSON
GET /sessions/{id}/feedback → { latest: {...} }

Auth: Authorization: Bearer <BRIDGE_API_KEY>
CORS allow Fonea origin.
Versioning header: X-Fonea-Bridge-Version: 1.

#!/usr/bin/env bash
# scripts/create_fonea_phase3_issues_existing_labels.sh
# usage:
#   DRY_RUN=1 ./scripts/create_fonea_phase3_issues_existing_labels.sh   # preview
#   ./scripts/create_fonea_phase3_issues_existing_labels.sh             # create

set -euo pipefail

REPO="joakirrin/music-curator"
DRY="${DRY_RUN:-0}"

create() {
  local title="$1"; shift
  local body="$1"; shift
  local labels="$1"; shift

  if [[ "$DRY" == "1" ]]; then
    echo "DRY → $title"
    echo "      labels: $labels"
    return
  fi

  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
}

# ---------------- Phase 3 (Spotify OAuth, Previews, Graphs) ----------------
create "3.0.1 Spotify OAuth (PKCE) + token storage" \
"Goal: user signs in and we can call Web API.
AC:
- PKCE flow; handle refresh/expiry
- Secure token storage; logout
- Error UX (expired/denied scopes)
Scopes: user-read-email, playlist-modify-public, playlist-modify-private" \
"phase:3,priority-high,type-task,status-not-started"

create "3.0.2 Create Playlist from Keep" \
"Goal: 1 click → playlist on user account.
AC:
- Map 'keep' songs to URIs
- POST create + add tracks
- Success toast with link
- Error handling (rate limits, invalid URIs)" \
"phase:3,priority-high,type-task,status-not-started"

create "3.0.3 Inline Previews (30s) with fallback" \
"Goal: preview in app without new window.
AC:
- Use preview_url if available
- Fallback: Web Playback SDK or open-in-Spotify
- Compact player UI; mute/volume" \
"phase:3,priority-high,type-task,status-not-started"

create "3.0.4 Import Existing Spotify Playlist" \
"Goal: seed rounds from an existing list.
AC:
- Fetch playlist tracks (+ basic metadata)
- De-dup + round assignment policy
- UX: pick playlist modal" \
"phase:3,priority-medium,type-task,status-not-started"

create "3.1.1 Fetch & Cache Audio Features" \
"Goal: store energy/valence/tempo/etc.
AC:
- Batch fetch audio-features
- Persist locally (cache key: track id + version)
- Background refresh + spinner" \
"phase:3,priority-medium,type-task,status-not-started"

create "3.1.2 Charts: Energy×Valence, BPM Histogram, Year Dist." \
"Goal: quick insights view.
AC:
- Recharts components
- Empty/error states
- Works on any loaded set" \
"phase:3,priority-medium,type-task,status-not-started"

# ---------------- Phase 4 (ChatGPT loop) ----------------
create "4.0.1 ChatGPT API client + token meter" \
"Goal: send feedback/replacement prompts from app.
AC:
- API key handling (env)
- Token estimate + user confirmation
- Rate-limit + error UX" \
"phase-4-playlist,priority-high,type-task,status-not-started"

create "4.0.2 One-click Send & Auto-Import JSON" \
"Goal: close the loop.
AC:
- Send prompt → wait → parse JSON
- Schema validation; diff preview
- Rollback on parse/validation fail" \
"phase-4-playlist,priority-high,type-task,status-not-started"

create "4.1.1 Embedded Companion Chat Pane" \
"Goal: on-page GPT with current round context.
AC:
- Side panel with messages
- Quick actions (More like this, Softer, etc.)
- Output enforces our JSON schema" \
"phase-4-playlist,priority-medium,type-task,status-not-started"

# ---------------- Phase 5 (Secondary platforms) ----------------
create "5.0.1 Export Playlist to YouTube" \
"Goal: same 'Create playlist' UX for YT.
AC:
- Data API v3 auth
- Track search/match policy
- Progress + mismatch report" \
"phase-5-polish,priority-low,type-task,status-not-started"

create "5.0.2 Export Playlist to Apple Music" \
"Goal: parity with YouTube export.
AC:
- MusicKit JS auth
- Track search/match policy
- Progress + mismatch report" \
"phase-5-polish,priority-low,type-task,status-not-started"

echo "✅ Done. Repo: $REPO"

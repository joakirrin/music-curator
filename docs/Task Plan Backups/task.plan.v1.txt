#!/usr/bin/env bash

#############################################################################
# Fonea Music Curator - GitHub Issues Automation Script
# 
# macOS/M1 Compatible Version
# - Uses #!/usr/bin/env bash shebang
# - Plain variables instead of associative arrays
# - Uses gh api for issue creation with sed for JSON parsing
# - Works on macOS bash 3.2+ without GNU tools
#
# Usage: ./create-issues.sh
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO="joakirrin/music-curator"
OWNER="joakirrin"

#############################################################################
# Helper Functions
#############################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if gh is installed and authenticated
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gh is installed
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI not installed. Install from https://cli.github.com"
        exit 1
    fi
    log_success "GitHub CLI installed"
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "Not authenticated. Run: gh auth login"
        exit 1
    fi
    log_success "GitHub authenticated"
    
    # Check if we can access the repo
    if ! gh repo view "$REPO" &> /dev/null; then
        log_error "Cannot access repository: $REPO"
        exit 1
    fi
    log_success "Repository accessible: $REPO"
    
    echo ""
}

# Create an issue and store the issue number
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local issue_key="$4"
    
    log_info "Creating: $title"
    
    # Build labels array for gh api
    local label_flags=""
    IFS=',' read -ra LABELS <<< "$labels"
    for label in "${LABELS[@]}"; do
        label_flags="$label_flags -f labels[]=\"$label\""
    done
    
    # Create the issue using gh api
    local json
    json=$(eval "gh api -X POST repos/$REPO/issues -f title=\"\$title\" -f body=\"\$body\" $label_flags 2>&1")
    
    # Extract issue number from JSON response using sed
    local issue_num
    issue_num=$(printf "%s" "$json" | sed -n 's/.*"number":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1)
    
    if [ -z "$issue_num" ]; then
        log_error "Failed to create issue: $title"
        log_error "Response: $json"
        return 1
    fi
    
    # Store issue number as plain variable
    eval "$issue_key=$issue_num"
    log_success "Created issue #$issue_num: $title"
    
    return 0
}

#############################################################################
# Phase 1: Foundation & Core Workflow
#############################################################################

create_phase_1() {
    echo ""
    log_info "=========================================="
    log_info "PHASE 1: Foundation & Core Workflow"
    log_info "=========================================="
    echo ""
    
    # Epic
    create_issue \
        "[Phase 1] Foundation & Core Workflow" \
        "# Phase 1: Foundation & Core Workflow

Goal: Set up data model, ChatGPT import flow, and improve song review UI for curation workflow.

## Subtasks
- [ ] Task 1: Enhance Data Model for ChatGPT Integration
- [ ] Task 2: Build ChatGPT Import Flow
- [ ] Task 3: Improve Song Review UI

## Timeline
Estimated: 2-3 weeks

## Success Criteria
- All core data models are set up
- ChatGPT integration flow is working
- Song review UI is user-friendly" \
        "phase-1-foundation,type-epic" \
        "PHASE_1_EPIC"
    
    # Task 1
    create_issue \
        "[Phase 1] Enhance Data Model for ChatGPT Integration" \
        "## Description
Add new fields to the Song type to support ChatGPT integration, including source tracking, review rounds, feedback status, playlist references, and Spotify metadata.

## Files to Modify
- \`src/types/song.ts\`
- \`src/utils/fileHandlers.ts\`
- \`src/utils/demoData.ts\`

## Subtasks
- [ ] Add new fields to \`Song\` type
- [ ] Create \`Playlist\` type definition
- [ ] Create \`RecommendationRound\` type definition
- [ ] Update \`normalizeSong()\` function in \`fileHandlers.ts\`
- [ ] Update demo data with new fields
- [ ] Test CSV/JSON import with new fields
- [ ] Ensure backward compatibility

## TypeScript Schema
\`\`\`typescript
// New Song fields to add:
source?: 'chatgpt' | 'manual' | 'spotify';
round?: number;
feedback?: 'keep' | 'skip' | 'pending';
playlistId?: string;
spotifyUri?: string;
previewUrl?: string;
addedAt?: string;
\`\`\`

## Acceptance Criteria
- [ ] All new fields are properly typed
- [ ] Types are exported from main types file
- [ ] Existing songs don't break with new fields
- [ ] Demo data includes new fields
- [ ] Unit tests pass for data import/export

## Dependencies
- None (this is foundational)" \
        "phase-1-foundation,priority-critical,status-not-started,type-task" \
        "TASK_1"
    
    # Task 2
    create_issue \
        "[Phase 1] Build ChatGPT Import Flow" \
        "## Description
Create a UI component and workflow to import song recommendations from ChatGPT. Includes parsing JSON format, auto-assigning round numbers, and displaying imported songs.

## Files to Create
- \`src/components/ImportChatGPTModal.tsx\`

## Files to Modify
- \`src/components/Toolbar.tsx\` (add import button)
- \`src/App.tsx\` (handle modal state)
- \`src/components/FilterBar.tsx\` (add round filter)

## Subtasks
- [ ] Create \`ImportChatGPTModal\` component
- [ ] Add \"Import from ChatGPT\" button to Toolbar
- [ ] Implement JSON parsing for ChatGPT format
- [ ] Auto-assign round numbers to imported songs
- [ ] Add timestamp on import (addedAt)
- [ ] Show success/error notifications
- [ ] Create \"Latest Round\" filter view
- [ ] Handle edge cases (invalid JSON, missing fields)

## Expected JSON Format from ChatGPT
\`\`\`json
{
  \"round\": 1,
  \"recommendations\": [
    {
      \"title\": \"Song Name\",
      \"artist\": \"Artist Name\",
      \"album\": \"Album Name\",
      \"year\": \"2024\",
      \"spotifyUri\": \"spotify:track:...\",
      \"reason\": \"Why this was recommended\"
    }
  ]
}
\`\`\`

## Acceptance Criteria
- [ ] Modal opens when \"Import from ChatGPT\" is clicked
- [ ] JSON can be pasted into a text area
- [ ] Songs are parsed and imported correctly
- [ ] Round numbers are auto-assigned
- [ ] Success notification shown on import
- [ ] Error messages guide user on failures
- [ ] Latest imported round is visible in filters

## Dependencies
- Blocked by: #${TASK_1}" \
        "phase-1-foundation,priority-critical,status-not-started,type-task" \
        "TASK_2"
    
    # Task 3
    create_issue \
        "[Phase 1] Improve Song Review UI" \
        "## Description
Enhance the song list interface with quick action buttons, keyboard shortcuts, and visual feedback for the review workflow. Makes it faster and easier to curate songs.

## Files to Modify
- \`src/components/SongRow.tsx\` (add keep/skip buttons)
- \`src/components/FilterBar.tsx\` (add review mode, progress)
- \`src/App.tsx\` (manage feedback state)

## Subtasks
- [ ] Add Keep/Skip quick action buttons to SongRow
- [ ] Implement keyboard shortcuts (K=Keep, S=Skip)
- [ ] Show progress counter (e.g., \"5/20 reviewed\")
- [ ] Add visual indicators for feedback status (pending/keep/skip)
- [ ] Create \"Review Mode\" toggle for current round
- [ ] Add batch actions component (Keep All, Skip All, Reset)
- [ ] Highlight unreviewed songs
- [ ] Test on mobile devices

## UI Components Needed
- Keep button: Green checkmark icon + tooltip
- Skip button: Red X icon + tooltip
- Status indicator: Yellow dot (pending), Green checkmark (keep), Red X (skip)
- Progress bar at top of list
- Review mode toggle in FilterBar

## Acceptance Criteria
- [ ] Keep/Skip buttons are visible on each song row
- [ ] Keyboard shortcuts work (K and S)
- [ ] Progress counter updates in real-time
- [ ] Visual indicators are clear and consistent
- [ ] Review mode filters to current round only
- [ ] Batch actions update multiple songs
- [ ] Unreviewed songs are clearly highlighted
- [ ] Mobile layout is responsive

## Dependencies
- Blocked by: #${TASK_1}
- Blocked by: #${TASK_2}" \
        "phase-1-foundation,priority-high,status-not-started,type-task" \
        "TASK_3"
}

#############################################################################
# Phase 2: Spotify Integration
#############################################################################

create_phase_2() {
    echo ""
    log_info "=========================================="
    log_info "PHASE 2: Spotify Integration"
    log_info "=========================================="
    echo ""
    
    # Epic
    create_issue \
        "[Phase 2] Spotify Integration" \
        "# Phase 2: Spotify Integration

Goal: Integrate Spotify Web API for song previews and user authentication.

## Subtasks
- [ ] Task 4: Spotify Web Playback SDK - Free Preview
- [ ] Task 5: Spotify Authentication (Optional)

## Timeline
Estimated: 1-2 weeks

## Success Criteria
- Song previews play in the app
- Optional authentication allows full-track playback
- Spotify search works for finding songs" \
        "phase-2-spotify,type-epic" \
        "PHASE_2_EPIC"
    
    # Task 4
    create_issue \
        "[Phase 2] Spotify Web Playback SDK - Free Preview" \
        "## Description
Integrate Spotify Web API for searching songs, fetching 30-second previews, and displaying album art. Create a floating player component for playback without requiring user authentication.

## Files to Create
- \`src/services/spotify.ts\` (API wrapper)
- \`src/components/SpotifyPlayer.tsx\` (player UI)
- \`src/hooks/useSpotify.ts\` (custom hook)

## Subtasks
- [ ] Register Spotify Developer App and get Client ID
- [ ] Create \`spotify.ts\` service with API wrapper
- [ ] Create \`SpotifyPlayer\` component (floating/PiP layout)
- [ ] Implement song search functionality
- [ ] Fetch 30-second preview URLs
- [ ] Add play/pause/skip controls
- [ ] Display album art & metadata
- [ ] Handle \"no preview available\" case
- [ ] Make player mobile responsive
- [ ] Add error handling for API rate limits

## Environment Variables Needed
\`\`\`
VITE_SPOTIFY_CLIENT_ID=...
\`\`\`

## Spotify API Endpoints
- Search: \`https://api.spotify.com/v1/search\`
- Track details: \`https://api.spotify.com/v1/tracks/{id}\`
- Track preview: Returned in search/track details response

## Acceptance Criteria
- [ ] Client ID is securely stored in environment variables
- [ ] Search returns relevant Spotify tracks
- [ ] Preview URLs are fetched and playable
- [ ] Player controls work (play, pause, volume)
- [ ] Album art displays correctly
- [ ] Graceful handling when preview unavailable
- [ ] Rate limiting handled properly
- [ ] Mobile layout is responsive

## Dependencies
- Blocked by: #${TASK_1}" \
        "phase-2-spotify,priority-critical,status-not-started,type-task" \
        "TASK_4"
    
    # Task 5
    create_issue \
        "[Phase 2] Spotify Authentication (Optional)" \
        "## Description
Implement OAuth 2.0 PKCE authentication flow to enable full-track playback, user playlist management, and the ability to create playlists directly from the app.

## Files to Create
- \`src/components/SpotifyAuth.tsx\`

## Files to Modify
- \`src/services/spotify.ts\` (add auth methods)
- \`src/components/Header.tsx\` (add login button)

## Subtasks
- [ ] Implement OAuth 2.0 PKCE flow
- [ ] Create login/logout UI components
- [ ] Store access tokens securely (no localStorage)
- [ ] Implement token refresh logic
- [ ] Enable full-track playback via Web Playback SDK
- [ ] Fetch user's existing playlists
- [ ] Add \"Connected to Spotify\" indicator
- [ ] Handle auth errors gracefully
- [ ] Test token expiration flow

## Spotify OAuth Scopes Needed
\`\`\`
streaming
user-read-email
user-read-private
playlist-modify-public
playlist-modify-private
\`\`\`

## Acceptance Criteria
- [ ] OAuth login flow completes successfully
- [ ] Access tokens are stored securely
- [ ] Tokens refresh before expiration
- [ ] Full-track playback works when authenticated
- [ ] User playlists are fetched and accessible
- [ ] \"Connected to Spotify\" indicator shows status
- [ ] Logout clears credentials
- [ ] Graceful handling of permission denials

## Dependencies
- Blocked by: #${TASK_4}" \
        "phase-2-spotify,priority-medium,status-not-started,type-task" \
        "TASK_5"
}

#############################################################################
# Phase 3: Feedback Loop
#############################################################################

create_phase_3() {
    echo ""
    log_info "=========================================="
    log_info "PHASE 3: Feedback Loop"
    log_info "=========================================="
    echo ""
    
    # Epic
    create_issue \
        "[Phase 3] Feedback Loop" \
        "# Phase 3: Feedback Loop

Goal: Enable users to export feedback and manage recommendation rounds.

## Subtasks
- [ ] Task 6: Export Feedback for ChatGPT
- [ ] Task 7: Round Management System

## Timeline
Estimated: 1 week

## Success Criteria
- Users can export feedback to use with ChatGPT
- Recommendation rounds can be tracked and compared" \
        "phase-3-feedback,type-epic" \
        "PHASE_3_EPIC"
    
    # Task 6
    create_issue \
        "[Phase 3] Export Feedback for ChatGPT" \
        "## Description
Create functionality to export user feedback (kept/skipped songs) as JSON/CSV with extracted preferences and a ChatGPT prompt template for the next round of recommendations.

## Files to Create
- \`src/components/ExportFeedback.tsx\`
- \`src/utils/feedbackExport.ts\`

## Subtasks
- [ ] Create \"Export Feedback\" button in UI
- [ ] Generate JSON with kept songs and reasons
- [ ] Generate JSON with skipped songs
- [ ] Extract user preferences from feedback
- [ ] Generate CSV export format
- [ ] Implement copy-to-clipboard functionality
- [ ] Implement download-as-file option
- [ ] Include ChatGPT prompt template in export
- [ ] Show export success notification
- [ ] Handle empty feedback case

## Export JSON Format
\`\`\`json
{
  \"round\": 1,
  \"kept\": [
    {
      \"title\": \"Song Name\",
      \"artist\": \"Artist Name\",
      \"reason\": \"User feedback if available\"
    }
  ],
  \"skipped\": [
    {
      \"title\": \"Song Name\",
      \"artist\": \"Artist Name\"
    }
  ],
  \"preferences\": {
    \"liked_genres\": [],
    \"liked_artists\": [],
    \"avoided_genres\": []
  },
  \"prompt\": \"Based on this feedback, recommend 20 more songs...\"
}
\`\`\`

## Acceptance Criteria
- [ ] Kept songs include all metadata
- [ ] Skipped songs are tracked
- [ ] Preferences are extracted from feedback
- [ ] Copy-to-clipboard works reliably
- [ ] Download creates a valid JSON file
- [ ] ChatGPT prompt is included and helpful
- [ ] Success/error notifications show
- [ ] Handles edge cases (no feedback, no songs)

## Dependencies
- Blocked by: #${TASK_3}" \
        "phase-3-feedback,priority-critical,status-not-started,type-task" \
        "TASK_6"
    
    # Task 7
    create_issue \
        "[Phase 3] Round Management System" \
        "## Description
Create tools to view, filter, compare, and manage recommendation rounds. Helps users track their curation history and see progress over time.

## Files to Create
- \`src/components/RoundManager.tsx\`
- \`src/components/RoundComparison.tsx\`

## Subtasks
- [ ] Create rounds list view
- [ ] Implement filter by round number
- [ ] Create side-by-side round comparison view
- [ ] Track feedback stats per round (kept/skipped %)
- [ ] Implement archive functionality for old rounds
- [ ] Create timeline visualization
- [ ] Show round metadata (date, count, feedback stats)
- [ ] Export round data

## Features
- **Rounds List:** View all recommendation rounds with stats
- **Round Comparison:** Compare feedback across multiple rounds
- **Timeline:** Visual timeline of rounds over time
- **Stats:** Show kept/skipped ratios, preferences evolution
- **Archive:** Move old rounds to archive view

## Acceptance Criteria
- [ ] All rounds are listed with metadata
- [ ] Can filter songs by specific round
- [ ] Side-by-side comparison shows differences
- [ ] Stats accurately reflect feedback
- [ ] Archive/restore functionality works
- [ ] Timeline is visually clear
- [ ] Mobile layout is responsive

## Dependencies
- Blocked by: #${TASK_2}
- Blocked by: #${TASK_6}" \
        "phase-3-feedback,priority-medium,status-not-started,type-task" \
        "TASK_7"
}

#############################################################################
# Phase 4: Playlist Creation
#############################################################################

create_phase_4() {
    echo ""
    log_info "=========================================="
    log_info "PHASE 4: Playlist Creation"
    log_info "=========================================="
    echo ""
    
    # Epic
    create_issue \
        "[Phase 4] Playlist Creation" \
        "# Phase 4: Playlist Creation

Goal: Enable users to create playlists on Spotify and manage them within the app.

## Subtasks
- [ ] Task 8: Create Spotify Playlist
- [ ] Task 9: Playlist Management

## Timeline
Estimated: 1-2 weeks

## Success Criteria
- Users can create Spotify playlists from kept songs
- Playlists can be saved and managed locally
- Playlists sync with Spotify" \
        "phase-4-playlist,type-epic" \
        "PHASE_4_EPIC"
    
    # Task 8
    create_issue \
        "[Phase 4] Create Spotify Playlist" \
        "## Description
Implement functionality to create Spotify playlists from kept/reviewed songs. Includes playlist naming, optional description, and handling of duplicates.

## Files to Create
- \`src/components/CreatePlaylistModal.tsx\`
- \`src/services/spotifyPlaylist.ts\`

## Subtasks
- [ ] Create \"Create Playlist\" button in UI
- [ ] Create playlist name input modal
- [ ] Add optional description input
- [ ] Call Spotify API to create playlist (user's account)
- [ ] Implement batch track addition to playlist
- [ ] Handle duplicate songs in playlist
- [ ] Implement error handling (network, permissions)
- [ ] Show success notification with playlist link
- [ ] Save playlist metadata locally
- [ ] Test with various song counts

## Spotify API Endpoints
- Create playlist: \`POST /v1/users/{user_id}/playlists\`
- Add tracks: \`POST /v1/playlists/{playlist_id}/tracks\`

## Acceptance Criteria
- [ ] Modal opens when \"Create Playlist\" is clicked
- [ ] User can enter playlist name and description
- [ ] Playlist is created on user's Spotify account
- [ ] Songs are added to playlist correctly
- [ ] Duplicates are handled (skip or merge)
- [ ] Success notification includes Spotify link
- [ ] Error messages are helpful
- [ ] Playlist metadata is saved locally

## Dependencies
- Blocked by: #${TASK_5}
- Blocked by: #${TASK_3}" \
        "phase-4-playlist,priority-critical,status-not-started,type-task" \
        "TASK_8"
    
    # Task 9
    create_issue \
        "[Phase 4] Playlist Management" \
        "## Description
Create comprehensive playlist management features including saving, editing, deleting, and re-curating playlists. Sync status with Spotify.

## Files to Create
- \`src/components/PlaylistManager.tsx\`
- \`src/components/PlaylistDetail.tsx\`

## Files to Modify
- \`src/App.tsx\` (add new routes/views)

## Subtasks
- [ ] Save playlists in local storage (or Supabase)
- [ ] Create \"My Playlists\" view
- [ ] List all saved playlists with metadata
- [ ] Create playlist detail/edit view
- [ ] Implement add/remove songs from playlists
- [ ] Create \"Re-curate\" option (export for ChatGPT)
- [ ] Implement delete/archive functionality
- [ ] Sync playlists status with Spotify
- [ ] Show playlist stats (song count, duration)
- [ ] Handle conflicts if playlist modified on Spotify

## Features
- **Playlists List:** View all created playlists
- **Playlist Detail:** View songs, edit metadata
- **Add/Remove:** Manage playlist contents
- **Re-curate:** Export playlist for another round
- **Delete/Archive:** Remove or archive playlists
- **Sync Status:** Show if in sync with Spotify

## Acceptance Criteria
- [ ] All playlists are saved and retrievable
- [ ] \"My Playlists\" view displays all playlists
- [ ] Can edit playlist name/description
- [ ] Songs can be added/removed
- [ ] Re-curate option generates proper export
- [ ] Delete removes from app and Spotify
- [ ] Sync status accurately reflects reality
- [ ] Mobile layout is responsive

## Dependencies
- Blocked by: #${TASK_8}" \
        "phase-4-playlist,priority-high,status-not-started,type-task" \
        "TASK_9"
}

#############################################################################
# Phase 5: Polish & Advanced Features
#############################################################################

create_phase_5() {
    echo ""
    log_info "=========================================="
    log_info "PHASE 5: Polish & Advanced Features"
    log_info "=========================================="
    echo ""
    
    # Epic
    create_issue \
        "[Phase 5] Polish & Advanced Features" \
        "# Phase 5: Polish & Advanced Features

Goal: Advanced features, backend integration, and polish for production.

## Subtasks
- [ ] Task 10: Supabase Backend Integration
- [ ] Task 11: Advanced Curation Tools

## Timeline
Estimated: 2-3 weeks

## Success Criteria
- Backend infrastructure is ready
- Advanced features enhance curation capabilities" \
        "phase-5-polish,type-epic" \
        "PHASE_5_EPIC"
    
    # Task 10
    create_issue \
        "[Phase 5] Supabase Backend Integration" \
        "## Description
Set up Supabase as the backend database for persistent data storage, user authentication, and real-time sync across devices.

## Files to Create
- \`src/services/supabase.ts\`
- Database migration scripts

## Subtasks
- [ ] Set up Supabase project and tables
- [ ] Design database schema (users, songs, playlists, rounds)
- [ ] Implement user authentication
- [ ] Migrate localStorage data to Supabase
- [ ] Implement real-time sync across devices
- [ ] Create data migration scripts
- [ ] Add offline support (sync when online)
- [ ] Set up proper RLS (Row-Level Security)
- [ ] Test data consistency
- [ ] Set up backups

## Database Tables Needed
- \`users\` - User profiles
- \`songs\` - Song catalog
- \`playlists\` - User playlists
- \`recommendation_rounds\` - Round metadata

## Acceptance Criteria
- [ ] Supabase project is set up
- [ ] All tables are created with proper schema
- [ ] User authentication works
- [ ] Data syncs in real-time
- [ ] Existing users' data can migrate
- [ ] Offline mode works
- [ ] RLS policies are secure
- [ ] Backups are configured

## Dependencies
- All Phase 1-4 tasks should be complete

## Resources
- [Supabase Documentation](https://supabase.com/docs)" \
        "phase-5-polish,priority-low,status-not-started,type-task" \
        "TASK_10"
    
    # Task 11
    create_issue \
        "[Phase 5] Advanced Curation Tools" \
        "## Description
Implement advanced features to enhance the curation experience, including smart filtering, analytics, and export to other platforms.

## Subtasks
- [ ] Implement smart filters (BPM, genre, mood)
- [ ] Create duplicate song detection
- [ ] Build playlist analytics dashboard
- [ ] Add export to Apple Music
- [ ] Add export to YouTube Music
- [ ] Implement collaborative playlists
- [ ] Add playlist sharing via link
- [ ] Create playlist recommendations
- [ ] Build mood/vibe detection
- [ ] Add playlist cover art generation

## Features
- **Smart Filters:** Filter by BPM range, genre, mood/vibe
- **Duplicate Detection:** Find and merge duplicate songs
- **Analytics Dashboard:** Stats on playlists, curation patterns
- **Multi-Platform Export:** Export to Apple Music, YouTube Music
- **Collaborative:** Share and allow friends to edit playlists
- **Sharing:** Generate shareable links with preview
- **Recommendations:** AI suggestions for similar songs
- **Cover Art:** Auto-generate or custom playlist covers

## Acceptance Criteria
- [ ] Smart filters work and narrow results
- [ ] Duplicates are detected and manageable
- [ ] Analytics dashboard loads quickly
- [ ] Export to multiple platforms works
- [ ] Collaborative features are secure
- [ ] Sharing links work and show previews
- [ ] Recommendations are relevant
- [ ] Cover art generation is working

## Dependencies
- Phase 1-4 should be mostly complete

## Notes
- Low priority, implement based on user feedback
- Consider using ML for recommendations
- Collaborative features require careful UX" \
        "phase-5-polish,priority-low,status-not-started,type-task" \
        "TASK_11"
}

#############################################################################
# Main Execution
#############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  Fonea Music Curator - GitHub Issues Automation Script     ║"
    echo "║  Creating 5 Epics + 11 Tasks = 16 Total Issues             ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    
    create_phase_1
    create_phase_2
    create_phase_3
    create_phase_4
    create_phase_5
    
    echo ""
    log_info "=========================================="
    log_info "✨ ALL ISSUES CREATED SUCCESSFULLY! ✨"
    log_info "=========================================="
    echo ""
    
    echo "Created Issue Numbers:"
    echo "────────────────────────────────────────"
    echo "Phase 1 Epic: #${PHASE_1_EPIC}"
    echo "  Task 1: #${TASK_1}"
    echo "  Task 2: #${TASK_2}"
    echo "  Task 3: #${TASK_3}"
    echo ""
    echo "Phase 2 Epic: #${PHASE_2_EPIC}"
    echo "  Task 4: #${TASK_4}"
    echo "  Task 5: #${TASK_5}"
    echo ""
    echo "Phase 3 Epic: #${PHASE_3_EPIC}"
    echo "  Task 6: #${TASK_6}"
    echo "  Task 7: #${TASK_7}"
    echo ""
    echo "Phase 4 Epic: #${PHASE_4_EPIC}"
    echo "  Task 8: #${TASK_8}"
    echo "  Task 9: #${TASK_9}"
    echo ""
    echo "Phase 5 Epic: #${PHASE_5_EPIC}"
    echo "  Task 10: #${TASK_10}"
    echo "  Task 11: #${TASK_11}"
    echo "────────────────────────────────────────"
    echo ""
    
    log_success "Visit your repository to see all issues:"
    log_success "https://github.com/$REPO/issues"
    echo ""
}

main "$@"

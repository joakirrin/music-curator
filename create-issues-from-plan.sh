#!/usr/bin/env bash
set -euo pipefail

PLAN_FILE="${1:-docs/project-plan.md}"
REPO="${REPO:-}"

if [[ -z "${REPO}" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    origin_url="$(git config --get remote.origin.url || true)"
    if [[ "$origin_url" =~ github.com[:/]+([^/]+)/([^/.]+) ]]; then
      OWNER="${BASH_REMATCH[1]}"
      NAME="${BASH_REMATCH[2]}"
      REPO="${OWNER}/${NAME}"
    fi
  fi
fi

if [[ -z "${REPO}" ]]; then
  echo 'ERROR: Set REPO="owner/name" or run inside a git repo with a GitHub remote.'
  exit 1
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "ERROR: Plan not found at: $PLAN_FILE"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) not found. Install from https://cli.github.com"
  exit 1
fi

echo "Using repo: $REPO"
echo "Using plan: $PLAN_FILE"
echo ""

ensure_label () {
  local name="$1"
  local color="${2:-cccccc}"
  local desc="${3:-}"
  # Try to create; if it already exists, ignore error
  gh label create "$name" --repo "$REPO" --color "$color" ${desc:+--description "$desc"} >/dev/null 2>&1 || true
}

create_epic_issue () {
  local title="$1"
  local body="$2"
  local phase_label="$3"
  ensure_label "type-epic" "5319e7" "Epic (Phase)"
  ensure_label "$phase_label" "ededed" "Phase label"
  echo "Creating EPIC: $title"
  gh issue create --repo "$REPO" \
    --title "$title" \
    --label "type-epic" \
    --label "$phase_label" \
    --body "$body" >/dev/null
}

create_task_issue () {
  local title="$1"
  local body="$2"
  local phase_label="$3"
  ensure_label "type-task" "0e8a16" "Task"
  ensure_label "$phase_label" "ededed" "Phase label"
  echo "  Creating TASK: $title"
  gh issue create --repo "$REPO" \
    --title "$title" \
    --label "type-task" \
    --label "$phase_label" \
    --body "$body" >/dev/null
}

# ------------------ Pass 1: EPICS (## Phase ...) ----------------------------
current_phase_title=""
current_phase_label=""
phase_body=""

while IFS='' read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == "## Phase "* ]]; then
    # flush previous
    if [[ -n "$current_phase_title" ]]; then
      create_epic_issue "$current_phase_title" "$phase_body" "$current_phase_label"
    fi
    current_phase_title="${line#\#\# }"              # e.g., "Phase 1 – Foundation & Core Workflow"
    phase_body="$line"$'\n'
    # derive label like phase-1 or phase-4-5
    phase_num="$(printf "%s" "$current_phase_title" | sed -n 's/.*Phase[[:space:]]\([0-9][0-9]*\(\.[0-9]\)\?\).*/\1/p')"
    current_phase_label="phase-${phase_num//./-}"
    continue
  fi

  # accumulate body only if we are inside a phase
  if [[ -n "$current_phase_title" ]]; then
    phase_body+="$line"$'\n'
  fi
done < "$PLAN_FILE"

if [[ -n "$current_phase_title" ]]; then
  create_epic_issue "$current_phase_title" "$phase_body" "$current_phase_label"
fi

# ------------------ Pass 2: TASKS (### Task ... under current phase) --------
current_phase_label=""
in_task=0
task_title=""
task_body=""

while IFS='' read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == "## Phase "* ]]; then
    phase_title="${line#\#\# }"
    phase_num="$(printf "%s" "$phase_title" | sed -n 's/.*Phase[[:space:]]\([0-9][0-9]*\(\.[0-9]\)\?\).*/\1/p')"
    current_phase_label="phase-${phase_num//./-}"
    continue
  fi

  if [[ "$line" == "### Task "* ]]; then
    # flush previous task
    if [[ $in_task -eq 1 && -n "$task_title" ]]; then
      create_task_issue "$task_title" "$task_body" "$current_phase_label"
    fi
    in_task=1
    task_title="${line#\#\#\# }"
    task_body="$line"$'\n'
    continue
  fi

  if [[ $in_task -eq 1 ]]; then
    task_body+="$line"$'\n'
  fi
done < "$PLAN_FILE"

if [[ $in_task -eq 1 && -n "$task_title" ]]; then
  create_task_issue "$task_title" "$task_body" "$current_phase_label"
fi

echo "All issues created from $PLAN_FILE."

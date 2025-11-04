#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-claude_task_plan.txt}"
REPO="${REPO:-}"

if [[ -z "${REPO}" ]]; then
  echo 'ERROR: set REPO="owner/name" (e.g., joakirrin/music-curator)'
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) not found. Install from https://cli.github.com"
  exit 1
fi

echo "Exporting epics from $REPO → $OUT"
: > "$OUT"

# List all open epics (label: type-epic), newest first
while IFS=$'\t' read -r num title; do
  echo "  • #$num $title"
  gh issue view "$num" --repo "$REPO" \
    --json title,body,url \
    --jq '"### " + .title + "\nURL: " + .url + "\n\n" + .body + "\n\n---\n"' \
    >> "$OUT"
done < <(gh issue list --repo "$REPO" \
       --label "type-epic" --state open --limit 200 \
       --json number,title --jq '.[] | [.number, .title] | @tsv')

echo "Done. Wrote $(wc -c < "$OUT") bytes to $OUT"

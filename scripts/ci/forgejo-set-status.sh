#!/usr/bin/env bash
# Set a Forgejo commit status for a SHA (used to report the mirrored GitHub
# workflow result back onto the Forgejo commit).
#
# Usage:
#   forgejo-set-status.sh <sha> <state> <context> <target_url> <description>
#
#   <state> is one of: pending | success | error | failure | warning
#
# Required env (for a real request):
#   FORGEJO_TOKEN   token with repository write access
#   GITHUB_SERVER_URL + GITHUB_REPOSITORY
#                   provided by Forgejo Actions; FORGEJO_REPO="owner/name"
#                   overrides GITHUB_REPOSITORY
#
# Optional env:
#   FORGEJO_STATUS_DRY_RUN=1  print the payload and exit 0 without any network
#                             call (no token required)
#
# Exit codes: 0 = status accepted, 1 = API rejected the status (response body
# printed), 2 = usage/env error.

set -euo pipefail

USAGE="usage: forgejo-set-status.sh <sha> <state> <context> <target_url> <description>"

if [ "$#" -ne 5 ]; then
  printf '%s\n' "$USAGE" >&2
  exit 2
fi

SHA=$1
STATE=$2
CONTEXT=$3
TARGET_URL=$4
DESCRIPTION=$5

case "$STATE" in
  pending | success | error | failure | warning) ;;
  *)
    printf 'error: invalid state "%s" (expected pending|success|error|failure|warning)\n' "$STATE" >&2
    exit 2
    ;;
esac

REPO="${FORGEJO_REPO:-${GITHUB_REPOSITORY:-}}"
SERVER="${GITHUB_SERVER_URL:-}"

command -v jq >/dev/null 2>&1 || {
  printf 'error: jq is required\n' >&2
  exit 2
}

PAYLOAD=$(jq -n \
  --arg state "$STATE" \
  --arg context "$CONTEXT" \
  --arg target_url "$TARGET_URL" \
  --arg description "$DESCRIPTION" \
  '{state: $state, context: $context, target_url: $target_url, description: $description}')

if [ "${FORGEJO_STATUS_DRY_RUN:-}" = "1" ]; then
  printf 'POST %s/api/v1/repos/%s/statuses/%s\n' "${SERVER:-<GITHUB_SERVER_URL>}" "${REPO:-<GITHUB_REPOSITORY>}" "$SHA"
  printf '%s\n' "$PAYLOAD"
  exit 0
fi

if [ -z "$REPO" ]; then
  printf 'error: FORGEJO_REPO or GITHUB_REPOSITORY is required\n' >&2
  exit 2
fi
if [ -z "$SERVER" ]; then
  printf 'error: GITHUB_SERVER_URL is required\n' >&2
  exit 2
fi
if [ -z "${FORGEJO_TOKEN:-}" ]; then
  printf 'error: FORGEJO_TOKEN is required\n' >&2
  exit 2
fi

RESPONSE_FILE=$(mktemp)
trap 'rm -f "$RESPONSE_FILE"' EXIT

# `-q` disables ~/.curlrc so a user config (e.g. `--continue-at -`) cannot
# break the POST on a developer machine.
HTTP_CODE=$(curl -q -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST \
  -H "Authorization: token $FORGEJO_TOKEN" \
  -H 'Content-Type: application/json' \
  --data "$PAYLOAD" \
  "$SERVER/api/v1/repos/$REPO/statuses/$SHA" || true)

if [ "${HTTP_CODE:0:1}" != "2" ]; then
  printf 'error: status update failed (HTTP %s)\n' "${HTTP_CODE:-none}" >&2
  cat "$RESPONSE_FILE" >&2
  exit 1
fi

printf 'set %s status for %s on %s (HTTP %s)\n' "$CONTEXT" "$SHA" "$REPO" "$HTTP_CODE"

#!/usr/bin/env bash
# Create (or verify) the Forgejo -> GitHub push mirror for this repository.
#
# The mirror makes every Forgejo push — branches and tags — sync to
# github.com/<GITHUB_REPO>, so the `.github/workflows/*` executors live on the
# GitHub default branch and the Forgejo CI orchestration can dispatch them.
# Idempotent: an existing mirror (remote_name "github-mirror" or an address
# pointing at github.com/<GITHUB_REPO>) is left untouched.
#
# Usage:
#   FORGEJO_TOKEN=... GITHUB_MIRROR_TOKEN=... scripts/ci/setup-github-mirror.sh
#
# Required env:
#   FORGEJO_TOKEN       Forgejo token with repository admin scope
#   GITHUB_MIRROR_TOKEN GitHub PAT with Contents write on GITHUB_REPO
#
# Optional env:
#   FORGEJO_URL         Forgejo base URL (default https://git.lightnode.ru)
#   FORGEJO_REPO        Forgejo "owner/name" (default Slovo_Propovedi/slovo-propovedi-mobile)
#   GITHUB_REPO         GitHub "owner/name" (default Slovo-Propovedi/slovo-propovedi-mobile)
#   MIRROR_INTERVAL     push mirror interval (default 8m0s)
#   SETUP_MIRROR_DRY_RUN=1  print the planned calls (token redacted), touch no network, exit 0
#
# Repo-parameterized on purpose: the same script configures the mirror for the
# other 4 repositories (docs, landing, backend, ...) by overriding FORGEJO_REPO
# and GITHUB_REPO.
#
# Exit codes: 0 = configured/already present, 1 = API error (response body
# printed), 2 = usage/env error.
#
# Secrets are never printed: no shell tracing, the POST body is written to a
# private temp file, and only the (redacted) request is shown in dry-run.

set -euo pipefail
set +x # never trace the tokens

FORGEJO_URL="${FORGEJO_URL:-https://git.lightnode.ru}"
FORGEJO_URL="${FORGEJO_URL%/}"
FORGEJO_REPO="${FORGEJO_REPO:-Slovo_Propovedi/slovo-propovedi-mobile}"
GITHUB_REPO="${GITHUB_REPO:-Slovo-Propovedi/slovo-propovedi-mobile}"
MIRROR_INTERVAL="${MIRROR_INTERVAL:-8m0s}"

MIRROR_NAME="github-mirror"
# GitHub accepts any non-empty username when authenticating a PAT.
MIRROR_USERNAME="x-access-token"
REMOTE_ADDRESS="https://github.com/$GITHUB_REPO.git"

MIRRORS_URL="$FORGEJO_URL/api/v1/repos/$FORGEJO_REPO/push_mirrors"

die_usage() {
  printf 'error: %s\n' "$*" >&2
  exit 2
}

log() { printf '%s\n' "$*" >&2; }

command -v jq >/dev/null 2>&1 || die_usage "jq is required"

build_request() { # <password> -> JSON body on stdout
  jq -n \
    --arg interval "$MIRROR_INTERVAL" \
    --arg remote_address "$REMOTE_ADDRESS" \
    --arg remote_username "$MIRROR_USERNAME" \
    --arg remote_password "$1" \
    --arg remote_name "$MIRROR_NAME" \
    '{
      interval: $interval,
      remote_address: $remote_address,
      remote_username: $remote_username,
      remote_password: $remote_password,
      sync_on_commit: true,
      remote_name: $remote_name
    }'
}

if [ "${SETUP_MIRROR_DRY_RUN:-}" = "1" ]; then
  log "[dry-run] GET $MIRRORS_URL"
  log "[dry-run] if no mirror named '$MIRROR_NAME' points at $REMOTE_ADDRESS:"
  log "[dry-run] POST $MIRRORS_URL"
  build_request '<redacted>' >&2
  exit 0
fi

[ -n "${FORGEJO_TOKEN:-}" ] || die_usage "FORGEJO_TOKEN is required"
[ -n "${GITHUB_MIRROR_TOKEN:-}" ] || die_usage "GITHUB_MIRROR_TOKEN is required"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
LIST_FILE="$WORK_DIR/push_mirrors.json"
REQUEST_FILE="$WORK_DIR/request.json"
RESPONSE_FILE="$WORK_DIR/response.json"

# `-q` disables ~/.curlrc so a user config (e.g. `--continue-at -`) cannot break
# the request on a developer machine.
HTTP_CODE=$(curl -q -sS -o "$LIST_FILE" -w '%{http_code}' \
  -H "Authorization: token $FORGEJO_TOKEN" \
  "$MIRRORS_URL" || true)

if [ "${HTTP_CODE:0:1}" != "2" ]; then
  printf 'error: could not list push mirrors (HTTP %s)\n' "${HTTP_CODE:-none}" >&2
  cat "$LIST_FILE" >&2 || true
  exit 1
fi

EXISTING=$(jq -r --arg name "$MIRROR_NAME" --arg addr "github.com/$GITHUB_REPO" '
  [ .[]? | select((.remote_name // "") == $name or ((.remote_address // "") | contains($addr))) ]
  | length
' "$LIST_FILE")

if [ "$EXISTING" -gt 0 ]; then
  log "Push mirror already configured on $FORGEJO_REPO — nothing to do"
else
  build_request "$GITHUB_MIRROR_TOKEN" > "$REQUEST_FILE"

  HTTP_CODE=$(curl -q -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST \
    -H "Authorization: token $FORGEJO_TOKEN" \
    -H 'Content-Type: application/json' \
    --data @"$REQUEST_FILE" \
    "$MIRRORS_URL" || true)

  if [ "${HTTP_CODE:0:1}" != "2" ]; then
    printf 'error: could not create push mirror (HTTP %s)\n' "${HTTP_CODE:-none}" >&2
    cat "$RESPONSE_FILE" >&2 || true
    exit 1
  fi

  log "Created push mirror '$MIRROR_NAME' on $FORGEJO_REPO"
fi

printf 'push mirror: %s -> %s\nowner/repo: %s\ninterval: %s\nsync_on_commit: true\n' \
  "$MIRROR_NAME" "$REMOTE_ADDRESS" "$FORGEJO_REPO" "$MIRROR_INTERVAL"

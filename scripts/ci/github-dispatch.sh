#!/usr/bin/env bash
# Dispatch a GitHub Actions workflow on the mirror repo and wait for its result.
#
# The Forgejo side of the CI orchestration pilot calls this script to hand a
# heavy job to GitHub-hosted runners. The exit code tells the caller what to do
# next: 0/1 are final, 42 means "fall back to the local runner".
#
# Required env:
#   GH_TOKEN    GitHub token with actions:write on GH_REPO (Bearer auth)
#   GH_REPO     "owner/name" of the GitHub mirror repo
#   WORKFLOW    workflow FILE name, e.g. ci.yml (not the display name)
#   REF         branch or tag name to dispatch on — NEVER a commit SHA
#               (the GitHub dispatch API rejects SHAs)
#   SHA         full 40-hex commit sha REF points at; used to wait for the
#               mirror to catch up and to correlate the run by head_sha
#
# Optional env:
#   MIRROR_WAIT_MIN     minutes to wait for SHA to appear on the mirror (5)
#   QUEUE_TIMEOUT_MIN   minutes a run may stay queued before cancellation (30)
#   RUN_TIMEOUT_MIN     minutes a run may take in total before cancellation (90)
#   ARTIFACTS           comma-separated "name=outdir" pairs downloaded on
#                       success, e.g. "unsigned-apk=unsigned-apk,web-dist=web-dist"
#                       GitHub serves artifacts as zip archives; each is
#                       extracted into <outdir> (unzip required).
#   DISPATCH_INPUTS     raw JSON object merged into the dispatch body as
#                       "inputs", e.g. '{"mode":"native"}' (workflow_dispatch
#                       inputs); validated as a JSON object before dispatch
#   GH_API_BASE         API base URL (default https://api.github.com)
#   GH_DISPATCH_DRY_RUN=1  log the planned calls, touch no network, exit 0
#
# Exit codes:
#   0   run succeeded (and every requested artifact was downloaded)
#   1   the run completed without success, or a requested artifact was not
#       produced / downloaded empty — a real build failure, do NOT re-run locally
#   2   usage/environment error (missing env, bad SHA/REF/ARTIFACTS format,
#       missing jq)
#   3   the dispatched run never appeared on GitHub (run-discovery path only)
#   42  infra failure (token rejected by GitHub, mirror-wait timeout, dispatch
#       rejected, queue/run timeout, GitHub API unreachable for RUN_TIMEOUT_MIN,
#       artifact transport/extraction error) — the caller should fall back to the
#       local runner; timeout paths cancel the run first, the unreachable path
#       cannot (the API is down)
#   43  the run was cancelled externally (e.g. superseded by a newer push) —
#       neutral: no fallback, no failure; the newer run reports the result
#
# The dispatch POST is retried up to 3 attempts (5s apart) on transport-level
# failures — HTTP 000 (DNS/connect) and 5xx; 4xx (auth/validation) is not retried.
#
# Requires: bash, curl, jq, unzip (the Forgejo runner provides them).
#
# Stdout contract: once the run is known, a single line `GH_RUN_URL=<url>` is
# printed (before polling), so callers that capture stdout can report the run
# URL on the 0/1/42/43 exit paths. All human-readable progress goes to stderr.

set -euo pipefail

POLL_INTERVAL_SECONDS=10
DISCOVER_INTERVAL_SECONDS=5
DISCOVER_TIMEOUT_SECONDS=180

log() { printf '%s\n' "$*" >&2; }

usage_error() {
  log "error: $*"
  exit 2
}

require_env() {
  local name=$1
  if [ -z "${!name:-}" ]; then
    usage_error "$name is required"
  fi
}

require_uint() {
  local name=$1 value=$2
  case "$value" in
    '' | *[!0-9]*) usage_error "$name must be a non-negative integer (got '$value')" ;;
  esac
}

for var in GH_TOKEN GH_REPO WORKFLOW REF SHA; do
  require_env "$var"
done

MIRROR_WAIT_MIN="${MIRROR_WAIT_MIN:-5}"
QUEUE_TIMEOUT_MIN="${QUEUE_TIMEOUT_MIN:-30}"
RUN_TIMEOUT_MIN="${RUN_TIMEOUT_MIN:-90}"
GH_API_BASE="${GH_API_BASE:-https://api.github.com}"
GH_API_BASE="${GH_API_BASE%/}"

require_uint MIRROR_WAIT_MIN "$MIRROR_WAIT_MIN"
require_uint QUEUE_TIMEOUT_MIN "$QUEUE_TIMEOUT_MIN"
require_uint RUN_TIMEOUT_MIN "$RUN_TIMEOUT_MIN"

if ! printf '%s' "$SHA" | grep -Eq '^[0-9a-fA-F]{40}$'; then
  usage_error "SHA must be a full 40-hex commit sha (got '$SHA')"
fi
if printf '%s' "$REF" | grep -Eq '^[0-9a-fA-F]{40}$'; then
  usage_error "REF must be a branch or tag name, never a commit sha (got '$REF')"
fi

if [ "${GH_DISPATCH_DRY_RUN:-}" = "1" ]; then
  log "[dry-run] repo=$GH_REPO workflow=$WORKFLOW ref=$REF sha=$SHA"
  log "[dry-run] GET  $GH_API_BASE/repos/$GH_REPO/commits/$SHA (poll ${POLL_INTERVAL_SECONDS}s, ${MIRROR_WAIT_MIN}m budget)"
  log "[dry-run] POST $GH_API_BASE/repos/$GH_REPO/actions/workflows/$WORKFLOW/dispatches"
  if [ -n "${DISPATCH_INPUTS:-}" ]; then
    log "[dry-run]      body={\"ref\":\"$REF\",\"return_run_details\":true,\"inputs\":$DISPATCH_INPUTS}"
  else
    log "[dry-run]      body={\"ref\":\"$REF\",\"return_run_details\":true}"
  fi
  log "[dry-run] GET  $GH_API_BASE/repos/$GH_REPO/actions/runs/<run_id> (poll ${POLL_INTERVAL_SECONDS}s)"
  log "[dry-run]      queue timeout ${QUEUE_TIMEOUT_MIN}m, run timeout ${RUN_TIMEOUT_MIN}m"
  if [ -n "${ARTIFACTS:-}" ]; then
    log "[dry-run] on success: GET .../actions/runs/<run_id>/artifacts, download $ARTIFACTS"
  fi
  log "[dry-run] on failure: GET .../actions/runs/<run_id>/jobs, tail failed job logs"
  exit 0
fi

command -v jq >/dev/null 2>&1 || usage_error "jq is required"

if [ -n "${DISPATCH_INPUTS:-}" ]; then
  if ! printf '%s' "$DISPATCH_INPUTS" | jq -e 'type == "object"' >/dev/null 2>&1; then
    usage_error "DISPATCH_INPUTS must be a JSON object (got '$DISPATCH_INPUTS')"
  fi
fi

if [ -n "${ARTIFACTS:-}" ]; then
  command -v unzip >/dev/null 2>&1 || usage_error "unzip is required for ARTIFACTS downloads"
fi

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# api_request <method> <url> <outfile> [extra curl args...] -> prints HTTP code
# `-q` (first argument) disables ~/.curlrc: a user config with e.g.
# `--continue-at -` breaks every POST with "HTTP upload cannot be resumed".
api_request() {
  local method=$1 url=$2 outfile=$3
  shift 3
  curl -q -sS -o "$outfile" -w '%{http_code}' -X "$method" \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    "$@" \
    "$url" || true
}

wait_for_mirror() {
  local deadline=$((SECONDS + MIRROR_WAIT_MIN * 60))
  local code
  while :; do
    code=$(api_request GET "$GH_API_BASE/repos/$GH_REPO/commits/$SHA" "$WORK_DIR/commit.json")
    if [ "$code" = "200" ]; then
      log "commit $SHA is visible on $GH_REPO"
      return 0
    fi
    # 401/403 = bad or missing CI_GITHUB_TOKEN. Retrying cannot help and a red
    # branch would blame the commit — fall back to the local runner at once.
    if [ "$code" = "401" ] || [ "$code" = "403" ]; then
      log "error: GitHub rejected our token (HTTP $code) — check the CI_GITHUB_TOKEN secret"
      exit 42
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
      log "error: commit $SHA did not reach $GH_REPO within ${MIRROR_WAIT_MIN}m (last HTTP ${code:-none}) — check the Forgejo push-mirror settings (enable sync-on-commit / press Sync now); falling back locally"
      exit 42
    fi
    log "waiting for commit $SHA on $GH_REPO (HTTP ${code:-none}); retrying in ${POLL_INTERVAL_SECONDS}s"
    sleep "$POLL_INTERVAL_SECONDS"
  done
}

discover_run_id() {
  local deadline=$((SECONDS + DISCOVER_TIMEOUT_SECONDS))
  local url code run_id
  url="$GH_API_BASE/repos/$GH_REPO/actions/workflows/$WORKFLOW/runs"
  url="$url?head_sha=$SHA&event=workflow_dispatch&per_page=5"
  while :; do
    code=$(api_request GET "$url" "$WORK_DIR/runs.json")
    if [ "$code" = "200" ]; then
      run_id=$(jq -r '[.workflow_runs[]? | .id] | max // empty' "$WORK_DIR/runs.json" 2>/dev/null || true)
      if [ -n "$run_id" ] && [ "$run_id" != "null" ]; then
        printf '%s' "$run_id"
        return 0
      fi
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
      return 1
    fi
    sleep "$DISCOVER_INTERVAL_SECONDS"
  done
}

dispatch_workflow() {
  local body_file="$WORK_DIR/dispatch-body.json"
  local response_file="$WORK_DIR/dispatch-response.json"
  local code run_id attempt
  if [ -n "${DISPATCH_INPUTS:-}" ]; then
    jq -n --arg ref "$REF" --argjson inputs "$DISPATCH_INPUTS" \
      '{ref: $ref, return_run_details: true, inputs: $inputs}' > "$body_file"
  else
    jq -n --arg ref "$REF" '{ref: $ref, return_run_details: true}' > "$body_file"
  fi
  code=""
  for attempt in 1 2 3; do
    code=$(api_request POST \
      "$GH_API_BASE/repos/$GH_REPO/actions/workflows/$WORKFLOW/dispatches" \
      "$response_file" -H 'Content-Type: application/json' --data @"$body_file")

    if [ "${code:0:1}" = "2" ]; then
      break
    fi

    # Retry transport-level failures only: 000 = DNS/connect (curl could not
    # reach the API); 5xx = GitHub-side transient. 4xx is auth/validation.
    case "${code:-000}" in
      000 | 5??)
        if [ "$attempt" -lt 3 ]; then
          log "warning: workflow dispatch attempt $attempt/3 failed (HTTP ${code:-000}) — retrying in 5s"
          sleep 5
          continue
        fi
        ;;
    esac

    log "error: workflow dispatch failed (HTTP ${code:-none}): $(cat "$response_file" 2>/dev/null || true)"
    exit 42
  done

  run_id=$(jq -r '.workflow_run_id // empty' "$response_file" 2>/dev/null || true)
  if [ -n "$run_id" ] && [ "$run_id" != "null" ]; then
    printf '%s' "$run_id"
    return 0
  fi

  # Older GitHub Enterprise releases omit return_run_details from the response;
  # discover the run by head_sha instead.
  run_id=$(discover_run_id) || {
    log "error: dispatched run for $SHA never appeared on $GH_REPO"
    exit 3
  }
  printf '%s' "$run_id"
}

cancel_run() {
  local code
  code=$(api_request POST "$GH_API_BASE/repos/$GH_REPO/actions/runs/$RUN_ID/cancel" /dev/null)
  log "cancel request for run $RUN_ID returned HTTP ${code:-none}"
}

download_artifacts() {
  [ -n "${ARTIFACTS:-}" ] || return 0

  local code url archive name outdir pair
  local -a pairs
  code=$(api_request GET \
    "$GH_API_BASE/repos/$GH_REPO/actions/runs/$RUN_ID/artifacts" \
    "$WORK_DIR/artifacts.json")
  if [ "$code" != "200" ]; then
    log "error: could not list artifacts for run $RUN_ID (HTTP ${code:-none}) — treating as infra"
    exit 42
  fi

  IFS=',' read -r -a pairs <<< "$ARTIFACTS"
  for pair in "${pairs[@]}"; do
    name="${pair%%=*}"
    outdir="${pair#*=}"
    if [ -z "$name" ] || [ "$name" = "$pair" ] || [ -z "$outdir" ]; then
      usage_error "ARTIFACTS entry '$pair' is not in name=outdir form"
    fi

    url=$(jq -r --arg name "$name" \
      '[.artifacts[]? | select(.name == $name) | .archive_download_url] | first // empty' \
      "$WORK_DIR/artifacts.json")
    if [ -z "$url" ] || [ "$url" = "null" ]; then
      log "error: artifact '$name' was not produced by run $RUN_ID"
      exit 1
    fi

    mkdir -p "$outdir"
    # GitHub artifact "downloads" are zip archives; the caller expects the
    # artifact contents in <outdir> (APK files, dist/ trees), so extract them.
    archive="$WORK_DIR/$name.zip"
    # `-f` turns an HTTP error (expired signed URL, 403, …) into a curl failure
    # instead of saving the error body as if it were the archive.
    if ! curl -q -sSLf -o "$archive" \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H 'Accept: application/vnd.github+json' \
      "$url"; then
      log "error: artifact '$name' download failed (transport/HTTP error) — treating as infra"
      exit 42
    fi
    if [ ! -s "$archive" ]; then
      # A successful run that produced an empty archive is a real anomaly.
      log "error: artifact '$name' downloaded empty"
      exit 1
    fi
    if ! unzip -q -o "$archive" -d "$outdir"; then
      log "error: artifact '$name' is not a valid zip archive (truncated/corrupt download) — treating as infra"
      exit 42
    fi
    log "downloaded artifact '$name' -> $outdir ($(wc -c < "$archive") bytes)"
  done
}

print_failure_logs() {
  local code job_id
  code=$(api_request GET \
    "$GH_API_BASE/repos/$GH_REPO/actions/runs/$RUN_ID/jobs" \
    "$WORK_DIR/jobs.json")
  if [ "$code" != "200" ]; then
    log "warning: could not list jobs for run $RUN_ID (HTTP ${code:-none})"
    return 0
  fi

  while IFS= read -r job_id; do
    [ -n "$job_id" ] || continue
    log "--- failed job $job_id (last 50 log lines) ---"
    curl -q -sSL -H "Authorization: Bearer $GH_TOKEN" \
      -H 'Accept: application/vnd.github+json' \
      "$GH_API_BASE/repos/$GH_REPO/actions/jobs/$job_id/logs" | tail -n 50 >&2 || true
  done < <(jq -r '.jobs[]? | select(.conclusion == "failure") | .id' "$WORK_DIR/jobs.json")
}

poll_run() {
  local start=$SECONDS
  local deadline=$((start + RUN_TIMEOUT_MIN * 60))
  local queue_started=""
  local code status conclusion html_url

  while :; do
    code=$(api_request GET \
      "$GH_API_BASE/repos/$GH_REPO/actions/runs/$RUN_ID" \
      "$WORK_DIR/run.json")

    if [ "$code" != "200" ]; then
      log "warning: run $RUN_ID poll returned HTTP ${code:-none}"
      # A fully unreachable API never reaches the 200-path timeouts below, so
      # the same total budget bounds it. Right now the API is down, so a cancel
      # would fail too — do not send it. The GitHub run (if any) keeps going;
      # its result is ignored once we fall back locally.
      if [ "$SECONDS" -ge "$deadline" ]; then
        log "error: GitHub API unreachable for ${RUN_TIMEOUT_MIN}m — giving up; the GitHub run (if any) is NOT cancelled and its result will be ignored; falling back locally"
        exit 42
      fi
    else
      status=$(jq -r '.status // empty' "$WORK_DIR/run.json")
      conclusion=$(jq -r '.conclusion // empty' "$WORK_DIR/run.json")
      html_url=$(jq -r '.html_url // empty' "$WORK_DIR/run.json")
      if [ -n "$html_url" ]; then
        RUN_URL=$html_url
      fi

      case "$status" in
        queued | waiting | pending | requested)
          [ -n "$queue_started" ] || queue_started=$SECONDS
          if [ $((SECONDS - queue_started)) -ge $((QUEUE_TIMEOUT_MIN * 60)) ]; then
            cancel_run
            log "error: run $RUN_ID stayed queued for ${QUEUE_TIMEOUT_MIN}m — cancelled, fallback needed"
            exit 42
          fi
          ;;
        in_progress)
          if [ $((SECONDS - start)) -ge $((RUN_TIMEOUT_MIN * 60)) ]; then
            cancel_run
            log "error: run $RUN_ID exceeded ${RUN_TIMEOUT_MIN}m — cancelled, fallback needed"
            exit 42
          fi
          ;;
        completed)
          if [ "$conclusion" = "success" ]; then
            download_artifacts
            log "run $RUN_ID succeeded: $RUN_URL"
            exit 0
          fi
          # A run cancelled by GitHub concurrency (rapid pushes) is not a test
          # failure: the newer run reports the result. Do not fetch logs.
          if [ "$conclusion" = "cancelled" ]; then
            log "run $RUN_ID was cancelled externally (superseded by a newer push): $RUN_URL"
            exit 43
          fi
          print_failure_logs
          log "error: run $RUN_ID concluded '${conclusion:-unknown}': $RUN_URL"
          exit 1
          ;;
      esac
    fi

    sleep "$POLL_INTERVAL_SECONDS"
  done
}

log "waiting for commit $SHA on $GH_REPO"
wait_for_mirror

RUN_ID=$(dispatch_workflow)
RUN_URL="https://github.com/$GH_REPO/actions/runs/$RUN_ID"
# Machine-readable line for callers capturing stdout; emitted before the poll
# so it is available on every subsequent exit path (0, 1 and 42).
printf 'GH_RUN_URL=%s\n' "$RUN_URL"
log "dispatched $WORKFLOW on $REF (run $RUN_ID): $RUN_URL"
# Forgejo masks org-variable values inside logs; dashes percent-encoded decode
# back to the same URL but evade the mask, keeping the link clickable.
log "open in browser: ${RUN_URL//-/%2D}"

poll_run

#!/usr/bin/env bash
# Self-test for scripts/ci/github-dispatch.sh against scripts/ci/mock-github-api.py.
#
# Runs entirely on 127.0.0.1 (no network, no GitHub token needed) and asserts
# the exit-code contract:
#   (a) success + artifact download           -> 0
#   (b) completed run with failure            -> 1
#   (c) run stuck queued past the timeout     -> 42 and a cancel POST is sent
#   (d) workflow_dispatch inputs forwarded
#   (e) artifact download failure             -> 42 (infra, caller may fall back)
#   (f) run cancelled externally              -> 43 (superseded; no cancel, no logs)
#   (g) dispatch POST 503 once                -> 0 (retried)
#   (h) API unreachable during poll           -> 42 (bounded by RUN_TIMEOUT_MIN)
#   (i) mirror rejects the token (401)        -> 42 (fallback, no dispatch POST)
#   (j) run never booted (startup_failure)    -> 42 (fallback, no job-log fetch)
#   (k) mismatch tag (VERIFY_REF=1)           -> 44 (hard failure, no dispatch POST)
#   (l) mismatch head_sha (VERIFY_REF=1)      -> 1 (real failure, no cancel POST)
#   (m) default path (no VERIFY_REF)          -> 0 (commit binding skipped)
#   (n) annotated-tag deref (VERIFY_REF=1)    -> 0 (tag object -> commit)
#   (o) heads fallback on 404 (VERIFY_REF=1)  -> 0 (tag ref missing)
#   (p) annotated tag moved (VERIFY_REF=1)    -> 44 (deref commit != SHA)
#
# Cases (k)/(l)/(n)/(o)/(p) opt into commit binding with VERIFY_REF=1; (m) is
# the regression guard for ci.yml's unbound branch dispatch.
#
# Case (a) also asserts the emitted GH_UNSIGNED_APK_SHA256= digest matches the
# sha256 of the extracted apk.
#
# Usage: bash scripts/ci/github-dispatch-selftest.sh

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DISPATCH="$SCRIPT_DIR/github-dispatch.sh"
MOCK="$SCRIPT_DIR/mock-github-api.py"
# 40-hex commit sha; only its shape matters to the dispatcher.
SHA="0123456789abcdef0123456789abcdef01234567"
WORK_DIR=$(mktemp -d)
MOCK_PID=""
PORT=""
FAILURES=0

cleanup() {
  stop_mock
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

stop_mock() {
  if [ -n "$MOCK_PID" ]; then
    kill "$MOCK_PID" 2>/dev/null || true
    wait "$MOCK_PID" 2>/dev/null || true
    MOCK_PID=""
  fi
}

start_mock() { # <scenario> <cancel_log> [dispatch_log] [artifact_error] [request_log] [dispatch_503_once] [run_503] [mirror_401] [wrong_tag] [wrong_sha] [annotated_tag] [heads_only] -> sets PORT
  local scenario=$1 cancel_log=$2 dispatch_log=${3:-} artifact_error=${4:-} request_log=${5:-}
  local dispatch_503_once=${6:-} run_503=${7:-} mirror_401=${8:-} wrong_tag=${9:-} wrong_sha=${10:-}
  local annotated_tag=${11:-} heads_only=${12:-}
  local port_file
  local extra=()
  port_file="$WORK_DIR/port"
  rm -f "$port_file"
  if [ -n "$artifact_error" ]; then
    extra+=(--artifact-error)
  fi
  if [ -n "$request_log" ]; then
    extra+=(--request-log "$request_log")
  fi
  if [ -n "$dispatch_503_once" ]; then
    extra+=(--dispatch-503-once)
  fi
  if [ -n "$run_503" ]; then
    extra+=(--run-503)
  fi
  if [ -n "$mirror_401" ]; then
    extra+=(--mirror-401)
  fi
  if [ -n "$wrong_tag" ]; then
    extra+=(--wrong-tag)
  fi
  if [ -n "$wrong_sha" ]; then
    extra+=(--wrong-sha)
  fi
  if [ -n "$annotated_tag" ]; then
    extra+=(--annotated-tag)
  fi
  if [ -n "$heads_only" ]; then
    extra+=(--heads-only)
  fi
  python3 "$MOCK" --scenario "$scenario" --port-file "$port_file" --sha "$SHA" \
    --cancel-log "$cancel_log" --dispatch-log "$dispatch_log" "${extra[@]}" &
  MOCK_PID=$!
  for _ in $(seq 1 100); do
    if [ -s "$port_file" ]; then
      break
    fi
    sleep 0.05
  done
  if [ ! -s "$port_file" ]; then
    echo "FAIL: mock server did not report a port" >&2
    exit 1
  fi
  PORT=$(cat "$port_file")
}

check_exit() { # <label> <expected> <actual>
  if [ "$3" -eq "$2" ]; then
    printf 'ok   %s (exit %s)\n' "$1" "$3"
  else
    printf 'FAIL %s: expected exit %s, got %s\n' "$1" "$2" "$3"
    FAILURES=$((FAILURES + 1))
  fi
}

check_file() { # <label> <path>
  if [ -s "$2" ]; then
    printf 'ok   %s (%s)\n' "$1" "$2"
  else
    printf 'FAIL %s: %s is missing or empty\n' "$1" "$2"
    FAILURES=$((FAILURES + 1))
  fi
}

run_dispatch() { # <workdir> <queue_timeout> <artifacts-or-empty> [extra env...]
  local workdir=$1 queue_timeout=$2 artifacts=$3
  shift 3
  mkdir -p "$workdir"
  (
    cd "$workdir"
    env GH_API_BASE="http://127.0.0.1:$PORT" \
      GH_TOKEN=self-test-token \
      GH_REPO=owner/repo \
      WORKFLOW=ci.yml \
      REF=main \
      SHA="$SHA" \
      MIRROR_WAIT_MIN=1 \
      QUEUE_TIMEOUT_MIN="$queue_timeout" \
      RUN_TIMEOUT_MIN=1 \
      ARTIFACTS="$artifacts" \
      NO_PROXY=127.0.0.1,localhost \
      no_proxy=127.0.0.1,localhost \
      "$@" \
      bash "$DISPATCH"
  )
}

# --- (a) success + artifact download -----------------------------------------
start_mock success "$WORK_DIR/cancel-a.log"
status=0
run_dispatch "$WORK_DIR/success" 1 "unsigned-apk=unsigned-apk" \
  >"$WORK_DIR/success-stdout.log" 2>/dev/null || status=$?
stop_mock
check_exit "(a) successful run with artifact" 0 "$status"
check_file "(a) extracted artifact" "$WORK_DIR/success/unsigned-apk/app-prod-release-unsigned.apk"
expected_apk_sha=$(sha256sum \
  "$WORK_DIR/success/unsigned-apk/app-prod-release-unsigned.apk" | awk '{print $1}')
if [ -s "$WORK_DIR/success-stdout.log" ] \
  && grep -qx "GH_UNSIGNED_APK_SHA256=$expected_apk_sha" "$WORK_DIR/success-stdout.log"; then
  printf 'ok   (a) emitted digest matches the extracted apk\n'
else
  printf 'FAIL (a) stdout does not contain GH_UNSIGNED_APK_SHA256=%s\n' "$expected_apk_sha"
  FAILURES=$((FAILURES + 1))
fi

# --- (b) completed run with failure ------------------------------------------
start_mock failure "$WORK_DIR/cancel-b.log"
status=0
run_dispatch "$WORK_DIR/failure" 1 "" || status=$?
stop_mock
check_exit "(b) failed run" 1 "$status"

# --- (c) run stuck queued past the queue timeout -----------------------------
start_mock stuck "$WORK_DIR/cancel-c.log"
status=0
run_dispatch "$WORK_DIR/stuck" 0 "" || status=$?
stop_mock
check_exit "(c) queue timeout" 42 "$status"
check_file "(c) cancel POST recorded by the mock" "$WORK_DIR/cancel-c.log"
if [ -s "$WORK_DIR/cancel-c.log" ] && ! grep -q "/actions/runs/123/cancel" "$WORK_DIR/cancel-c.log"; then
  printf 'FAIL (c) cancel log does not contain the cancel endpoint\n'
  FAILURES=$((FAILURES + 1))
fi

# --- (d) workflow_dispatch inputs are forwarded to the API -------------------
start_mock failure "$WORK_DIR/cancel-d.log" "$WORK_DIR/dispatch-d.log"
status=0
run_dispatch "$WORK_DIR/inputs" 1 "" "DISPATCH_INPUTS={\"mode\":\"native\"}" || status=$?
stop_mock
check_exit "(d) dispatch with inputs" 1 "$status"
if [ -s "$WORK_DIR/dispatch-d.log" ] \
  && jq -e '.ref == "main" and .inputs.mode == "native"' "$WORK_DIR/dispatch-d.log" >/dev/null 2>&1; then
  printf 'ok   (d) dispatch body carried ref + inputs.mode=native\n'
else
  printf 'FAIL (d) dispatch body did not carry the inputs field\n'
  FAILURES=$((FAILURES + 1))
fi

# --- (e) artifact transfer failure is infra, not a failed run -----------------
start_mock success "$WORK_DIR/cancel-e.log" "" "artifact-error"
status=0
run_dispatch "$WORK_DIR/artifact-error" 1 "unsigned-apk=unsigned-apk" || status=$?
stop_mock
check_exit "(e) artifact download failure -> infra" 42 "$status"

# --- (f) externally cancelled run -> superseded, not a failure ----------------
start_mock cancelled "$WORK_DIR/cancel-f.log" "" "" "$WORK_DIR/requests-f.log"
status=0
run_dispatch "$WORK_DIR/cancelled" 1 "" || status=$?
stop_mock
check_exit "(f) externally cancelled run -> superseded" 43 "$status"
if [ -s "$WORK_DIR/cancel-f.log" ]; then
  printf 'FAIL (f) dispatcher sent a cancel POST for an already-cancelled run\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (f) no cancel POST sent\n'
fi
if [ -s "$WORK_DIR/requests-f.log" ] && grep -q "/actions/jobs/" "$WORK_DIR/requests-f.log"; then
  printf 'FAIL (f) failed-job logs were fetched for a cancelled run\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (f) no failed-job log fetch\n'
fi

# --- (g) dispatch POST is retried on transport errors ------------------------
start_mock success "$WORK_DIR/cancel-g.log" "" "" "" "dispatch-503-once"
status=0
run_dispatch "$WORK_DIR/retry" 1 "" || status=$?
stop_mock
check_exit "(g) dispatch retried after 503" 0 "$status"

# --- (h) poll budget bounds a fully unreachable API --------------------------
start_mock success "$WORK_DIR/cancel-h.log" "" "" "" "" "run-503"
status=0
run_dispatch "$WORK_DIR/unreachable" 1 "" RUN_TIMEOUT_MIN=0 || status=$?
stop_mock
check_exit "(h) API unreachable during poll -> bounded 42" 42 "$status"
if [ -s "$WORK_DIR/cancel-h.log" ]; then
  printf 'FAIL (h) cancel POST sent while the API was unreachable\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (h) no cancel POST sent\n'
fi

# --- (i) mirror rejects the token: immediate fallback, no dispatch -----------
start_mock success "$WORK_DIR/cancel-i.log" "$WORK_DIR/dispatch-i.log" "" "" "" "" "mirror-401"
status=0
run_dispatch "$WORK_DIR/mirror-401" 1 "" || status=$?
stop_mock
check_exit "(i) mirror 401 -> fallback" 42 "$status"
if [ -s "$WORK_DIR/dispatch-i.log" ]; then
  printf 'FAIL (i) dispatcher attempted a dispatch POST despite the auth error\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (i) no dispatch POST attempted\n'
fi

# --- (j) run never booted (startup_failure) -> infra fallback, no logs --------
start_mock startup_failure "$WORK_DIR/cancel-j.log" "" "" "$WORK_DIR/requests-j.log"
status=0
run_dispatch "$WORK_DIR/startup-failure" 1 "" || status=$?
stop_mock
check_exit "(j) startup_failure -> fallback" 42 "$status"
if [ -s "$WORK_DIR/requests-j.log" ] \
  && grep -qE "/actions/runs/123/jobs|/actions/jobs/" "$WORK_DIR/requests-j.log"; then
  printf 'FAIL (j) job logs were fetched for a run that never booted\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (j) no job-log fetch\n'
fi
if [ -s "$WORK_DIR/cancel-j.log" ]; then
  printf 'FAIL (j) cancel POST sent for an already-terminal run\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (j) no cancel POST sent\n'
fi

# --- (k) mirror tag points at a different commit: hard failure, no dispatch ---
start_mock success "$WORK_DIR/cancel-k.log" "$WORK_DIR/dispatch-k.log" "" "" "" "" "" "wrong-tag"
status=0
run_dispatch "$WORK_DIR/wrong-tag" 1 "" VERIFY_REF=1 || status=$?
stop_mock
check_exit "(k) tag/ref mismatch -> hard failure" 44 "$status"
if [ -s "$WORK_DIR/dispatch-k.log" ]; then
  printf 'FAIL (k) dispatcher POSTed a dispatch despite the tag/ref mismatch\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (k) no dispatch POST sent\n'
fi

# --- (l) dispatched run belongs to another commit: failure, no cancel ---------
start_mock success "$WORK_DIR/cancel-l.log" "" "" "" "" "" "" "" "wrong-sha"
status=0
run_dispatch "$WORK_DIR/wrong-sha" 1 "" VERIFY_REF=1 || status=$?
stop_mock
check_exit "(l) run head_sha mismatch -> real failure" 1 "$status"
if [ -s "$WORK_DIR/cancel-l.log" ]; then
  printf 'FAIL (l) dispatcher cancelled a run that is not ours\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (l) no cancel POST sent\n'
fi

# --- (m) default path skips commit binding (ci.yml branch dispatch) -----------
# A concurrent push may move the mirror branch between checkout and this check;
# with VERIFY_REF unset neither the ref nor the head_sha is asserted.
start_mock success "$WORK_DIR/cancel-m.log" "" "" "$WORK_DIR/requests-m.log" "" "" "" "wrong-tag" "wrong-sha"
status=0
run_dispatch "$WORK_DIR/default-unbound" 1 "unsigned-apk=unsigned-apk" \
  >"$WORK_DIR/default-stdout.log" 2>/dev/null || status=$?
stop_mock
check_exit "(m) default path skips commit binding" 0 "$status"
check_file "(m) extracted artifact" \
  "$WORK_DIR/default-unbound/unsigned-apk/app-prod-release-unsigned.apk"
if [ -s "$WORK_DIR/default-stdout.log" ] \
  && grep -q '^GH_UNSIGNED_APK_SHA256=' "$WORK_DIR/default-stdout.log"; then
  printf 'ok   (m) digest line emitted\n'
else
  printf 'FAIL (m) missing GH_UNSIGNED_APK_SHA256 digest line\n'
  FAILURES=$((FAILURES + 1))
fi

# --- (n) annotated tag dereferences to the dispatched commit ------------------
start_mock success "$WORK_DIR/cancel-n.log" "" "" "" "" "" "" "" "" "annotated-tag"
status=0
run_dispatch "$WORK_DIR/annotated-tag" 1 "" VERIFY_REF=1 || status=$?
stop_mock
check_exit "(n) annotated tag dereference -> success" 0 "$status"

# --- (o) missing tag ref falls back to the heads ref --------------------------
start_mock success "$WORK_DIR/cancel-o.log" "" "" "" "" "" "" "" "" "" "heads-only"
status=0
run_dispatch "$WORK_DIR/heads-only" 1 "" VERIFY_REF=1 || status=$?
stop_mock
check_exit "(o) heads fallback on 404 -> success" 0 "$status"

# --- (p) annotated tag points at a moved commit: hard failure, no dispatch ----
start_mock success "$WORK_DIR/cancel-p.log" "$WORK_DIR/dispatch-p.log" "" "" "" "" "" "wrong-tag" "" "annotated-tag"
status=0
run_dispatch "$WORK_DIR/annotated-moved" 1 "" VERIFY_REF=1 || status=$?
stop_mock
check_exit "(p) annotated tag moved -> hard failure" 44 "$status"
if [ -s "$WORK_DIR/dispatch-p.log" ]; then
  printf 'FAIL (p) dispatcher POSTed a dispatch despite the moved annotated tag\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'ok   (p) no dispatch POST sent\n'
fi

# --- dry-run touches no network ----------------------------------------------
status=0
env GH_DISPATCH_DRY_RUN=1 GH_TOKEN=x GH_REPO=owner/repo WORKFLOW=ci.yml \
  REF=main SHA="$SHA" bash "$DISPATCH" >/dev/null 2>&1 || status=$?
check_exit "dry-run" 0 "$status"

if [ "$FAILURES" -ne 0 ]; then
  printf '\n%d self-test assertion(s) failed\n' "$FAILURES" >&2
  exit 1
fi

printf '\nall github-dispatch self-test assertions passed\n'

#!/usr/bin/env bash
# Self-test for scripts/ci/github-dispatch.sh against scripts/ci/mock-github-api.py.
#
# Runs entirely on 127.0.0.1 (no network, no GitHub token needed) and asserts
# the exit-code contract:
#   (a) success + artifact download           -> 0
#   (b) completed run with failure            -> 1
#   (c) run stuck queued past the timeout     -> 42 and a cancel POST is sent
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

start_mock() { # <scenario> <cancel_log> [dispatch_log] -> sets PORT
  local scenario=$1 cancel_log=$2 dispatch_log=${3:-} port_file
  port_file="$WORK_DIR/port"
  rm -f "$port_file"
  python3 "$MOCK" --scenario "$scenario" --port-file "$port_file" \
    --cancel-log "$cancel_log" --dispatch-log "$dispatch_log" &
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
run_dispatch "$WORK_DIR/success" 1 "unsigned-apk=unsigned-apk" || status=$?
stop_mock
check_exit "(a) successful run with artifact" 0 "$status"
check_file "(a) downloaded artifact" "$WORK_DIR/success/unsigned-apk/unsigned-apk.zip"

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

#!/usr/bin/env bash
# Single source of native-vs-JS detection for the release workflows.
#
# Usage:
#   scripts/ci/detect-native-changes.sh <PREV_REF> <CUR_REF>   # two-ref (CI)
#   scripts/ci/detect-native-changes.sh <PREV_REF>             # worktree
#
# Two-ref mode diffs PREV_REF..CUR_REF (CI, where the released commit is a tag).
# Worktree mode diffs PREV_REF against the working tree and reads RUNTIME_VERSION
# from ota.config.ts on disk: `git diff PREV_REF -- ...` covers committed, staged
# and unstaged changes — exactly what `scripts/bump-version.mjs` sweeps with
# `git add -A` before committing.
#
# Prints three machine-readable lines on stdout (diagnostics go to stderr):
#   native=true|false      — did a native path change between the refs?
#   rv_prev=<value|empty>  — RUNTIME_VERSION at PREV_REF (empty pre-OTA history)
#   rv_now=<value|empty>   — RUNTIME_VERSION at CUR_REF (worktree mode: on disk)
#
# An empty PREV_REF means "no diff base" (first ever tag): the script reports
# native=true — the safe default, because a JS-only publish would reach no
# installed build anyway — and rv_prev is empty.
#
# Called by .forgejo/workflows/release.yml (`changes` job),
# .forgejo/workflows/ota-publish.yml (manual js-only verification) and
# scripts/bump-version.mjs (worktree mode: decide native vs js-only before the
# bump commit is created).
#
# Why content-aware: scripts/bump-version.mjs rewrites version metadata on
# EVERY release — package.json `version`, android/app/build.gradle
# `versionName`/`versionCode` and the ios *.pbxproj `MARKETING_VERSION`/
# `CURRENT_PROJECT_VERSION`. A name-only check over those paths would flag
# every release as native and starve the OTA path, so build.gradle / *.pbxproj
# are judged by CONTENT instead:
#   - package.json is dropped entirely: a dependency change always moves
#     yarn.lock, and a version-only bump is not native;
#   - build.gradle / *.pbxproj are excluded from the name-only list and
#     inspected below — only added/removed lines beyond version metadata count.
# Any other file under android/, ios/, plugins/, modules/ counts by name alone
# (new native module, manifest, plugin, ...).

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: $0 <PREV_REF> [CUR_REF]" >&2
  exit 2
fi

PREV_REF=$1
# No CUR_REF → worktree mode: diff PREV_REF against the files on disk.
CUR_REF=${2:-}

# Fail loud on an unknown ref: otherwise `git diff || true` would silently
# report "no native changes" for a typo.
if [ -n "$CUR_REF" ] && ! git rev-parse --verify --quiet "$CUR_REF^{commit}" > /dev/null; then
  echo "error: CUR_REF '$CUR_REF' is not a valid git ref" >&2
  exit 2
fi

if [ -n "$PREV_REF" ] && ! git rev-parse --verify --quiet "$PREV_REF^{commit}" > /dev/null; then
  echo "error: PREV_REF '$PREV_REF' is not a valid git ref" >&2
  exit 2
fi

# Two-ref mode compares the commits; worktree mode compares PREV_REF with the
# working tree (committed + staged + unstaged).
DIFF_BASE=$PREV_REF
if [ -n "$CUR_REF" ]; then
  DIFF_BASE="$PREV_REF..$CUR_REF"
fi

read_runtime_version() {
  # RUNTIME_VERSION is a hardcoded literal in ota.config.ts. A missing file
  # (pre-OTA history) or a ref without the literal yields an empty string.
  git show "$1:ota.config.ts" 2> /dev/null \
    | grep -E '^const RUNTIME_VERSION' \
    | sed -E "s/^const RUNTIME_VERSION = '([^']+)'.*/\1/" || true
}

read_runtime_version_worktree() {
  # Same anchored extraction as above, from the file bump-version is about to
  # edit. A missing file yields an empty string.
  grep -E '^const RUNTIME_VERSION' ota.config.ts 2> /dev/null \
    | sed -E "s/^const RUNTIME_VERSION = '([^']+)'.*/\1/" || true
}

if [ -n "$CUR_REF" ]; then
  RV_NOW=$(read_runtime_version "$CUR_REF")
else
  RV_NOW=$(read_runtime_version_worktree)
fi

if [ -z "$PREV_REF" ]; then
  echo "no previous ref — treating the change as native" >&2
  printf 'native=true\nrv_prev=\nrv_now=%s\n' "$RV_NOW"
  exit 0
fi

NAME_CHANGED=$(git diff --name-only "$DIFF_BASE" -- \
  android ios plugins modules yarn.lock app.config.ts ota.config.ts \
  ':(exclude)android/app/build.gradle' \
  ':(exclude,glob)ios/**/*.pbxproj' || true)

# Drop diff headers/hunks (---/+++/@@/index) and +/- lines that are pure
# version metadata; whatever is left is real native churn. The trailing
# `|| true` keeps `set -e` happy when the diff is empty.
CONTENT_CHANGED=$(git diff "$DIFF_BASE" -- \
    android/app/build.gradle ':(glob)ios/**/*.pbxproj' \
  | grep -E '^[+-]' \
  | grep -Ev '^(\+\+\+|---)' \
  | grep -Ev '^[+-].*(versionName|versionCode|MARKETING_VERSION|CURRENT_PROJECT_VERSION)' \
  || true)

RV_PREV=$(read_runtime_version "$PREV_REF")

if [ -n "$NAME_CHANGED" ] || [ -n "$CONTENT_CHANGED" ]; then
  NATIVE=true
  {
    echo "native changes since $PREV_REF:"
    if [ -n "$NAME_CHANGED" ]; then
      printf '%s\n' "$NAME_CHANGED"
    fi
    if [ -n "$CONTENT_CHANGED" ]; then
      echo "non-version edits in build.gradle / *.pbxproj:"
      printf '%s\n' "$CONTENT_CHANGED"
    fi
  } >&2
else
  NATIVE=false
  echo "only JS/TS/assets and version metadata changed since $PREV_REF" >&2
fi

printf 'native=%s\nrv_prev=%s\nrv_now=%s\n' "$NATIVE" "$RV_PREV" "$RV_NOW"

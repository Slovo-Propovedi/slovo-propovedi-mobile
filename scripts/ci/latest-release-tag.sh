#!/usr/bin/env bash
# Single source of "latest release tag" selection for the release workflows
# and scripts/bump-version.mjs.
#
# Usage:
#   scripts/ci/latest-release-tag.sh                # newest release tag
#   scripts/ci/latest-release-tag.sh <EXCLUDE_TAG>  # ... except EXCLUDE_TAG
#                                                     (release.yml excludes
#                                                     the tag being released)
#
# Prints the tag name on stdout; prints nothing (exit 0) when no tag matches —
# every caller already treats an empty baseline as its safe path (skip, block,
# bootstrap-native, detect's native default).
#
# Why version sort, not tagger date: bulk re-tags (mirror history rewrites)
# give annotated tags identical tagger dates — the creatordate tie between
# v0.33.1 and v0.34.0 picked the wrong baseline and false-blocked a JS-only
# OTA publish (2026-11-13). Version sort is a pure function of ref names.
#
# Called by .forgejo/workflows/{release,ota-publish,xprem-cleanup}.yml and
# scripts/bump-version.mjs.

set -euo pipefail

if [ "$#" -gt 1 ]; then
  echo "usage: $0 [EXCLUDE_TAG]" >&2
  exit 2
fi

EXCLUDE=${1:-}

TAGS=$(git tag --sort=-v:refname)
if [ -n "$EXCLUDE" ]; then
  # grep exits 1 when the exclusion empties the list (first ever tag being
  # released) — that is a valid empty result, not an error. (`-F`: EXCLUDE is a
  # literal tag name, never a pattern; rc=2 from a broken pattern class then
  # cannot arise — the only surviving non-zero exit is rc=1 `no lines left`,
  # which is the valid empty result).
  TAGS=$(printf '%s' "$TAGS" | grep -F -x -v -- "$EXCLUDE" || true)
fi

printf '%s' "$TAGS" | sed -n '1p'

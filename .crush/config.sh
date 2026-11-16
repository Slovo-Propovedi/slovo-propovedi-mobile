#!/usr/bin/env bash
# THIN BASE config — never edited by tooling, never mutated at runtime.
# Deliberately contains NO model wiring: the two model slots (large/small)
# are owned exclusively by profiles in .crush/profiles/*.sh. Sourced by the
# root .crushrc shim. See README.md.

# --- Base (profile-independent wiring) ---

# Context files (the opencode "instructions" equivalent).
option context-path .crush/tools/philosophy.md
option context-path .crush/tools/workflows.md

# MCP servers, same set the OpenCode base config used.
mcp add context7 --type http --url https://mcp.context7.com/mcp
mcp add gh_grep --type http --url https://mcp.grep.app

# Read-only tools never prompt; everything else keeps the normal
# permission flow. Mirrors the opencode base's read-only friendliness.
permissions allow view ls grep glob

# --- Profile selection ---
# Precedence: $CRUSH_PROFILE env override > .crush/active-profile state file.
# With neither, no profile applies and Crush uses its standard models —
# same semantics as OpenCode ("последний профиль или стандартные модели").

CRUSH_PROFILES_DIR=".crush/profiles"
CRUSH_ACTIVE_PROFILE_FILE=".crush/active-profile"

crush_profile_name=""
if [[ -n "${CRUSH_PROFILE:-}" ]]; then
  crush_profile_name="$CRUSH_PROFILE"
elif [[ -s "$CRUSH_ACTIVE_PROFILE_FILE" ]]; then
  crush_profile_name="$(head -n 1 "$CRUSH_ACTIVE_PROFILE_FILE" | tr -d '[:space:]')"
fi

if [[ -n "$crush_profile_name" ]]; then
  crush_profile_file="$CRUSH_PROFILES_DIR/$crush_profile_name.sh"
  if [[ -f "$crush_profile_file" ]]; then
    source "$crush_profile_file"
  else
    echo "crushrc: unknown profile '$crush_profile_name' (no $crush_profile_file)" >&2
    echo "crushrc: run ./.crush/tools/profile.sh to list available profiles" >&2
  fi
fi

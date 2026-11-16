#!/usr/bin/env bash
# Switch the active Crush model profile (.crush/profiles/*.sh).
#
# Usage:
#   ./.crush/tools/profile.sh            list profiles + active one
#   ./.crush/tools/profile.sh <name>     switch profile
#
# The choice is persisted to .crush/active-profile and applied by
# .crushrc (via .crush/config.sh) on the NEXT crush start — crushrc runs
# at load time, so a running session keeps its current models. To switch
# models mid-session without a restart, use the model picker (ctrl+l).
set -eu

profiles_dir=".crush/profiles"
state_file=".crush/active-profile"
default_hint="standard models (no profile)"

current=""
if [[ -s "$state_file" ]]; then
  current="$(head -n 1 "$state_file" | tr -d '[:space:]')"
fi
if [[ -n "${CRUSH_PROFILE:-}" ]]; then
  current="$CRUSH_PROFILE [env override]"
fi

describe_profile() {
  local name="$1" large="" small=""
  large="$(grep -m1 '^model large ' "$profiles_dir/$name.sh" | sed 's/^model large  *//')"
  small="$(grep -m1 '^model small ' "$profiles_dir/$name.sh" | sed 's/^model small  *//')"
  echo "  large: $large"
  echo "  small: $small"
}

if [[ $# -eq 0 ]]; then
  echo "Crush profiles ($profiles_dir) — active: ${current:-<none, $default_hint>}"
  echo
  for f in "$profiles_dir"/*.sh; do
    name="$(basename "$f" .sh)"
    marker=" "
    [[ "$name" == "$current" ]] && marker="*"
    echo "$marker $name"
    describe_profile "$name"
  done
  echo
  echo "Switch:  ./.crush/tools/profile.sh <name>"
  echo "Switch (one run only): CRUSH_PROFILE=<name> crush"
  exit 0
fi

name="$1"
if [[ ! -f "$profiles_dir/$name.sh" ]]; then
  echo "error: unknown profile '$name' — no $profiles_dir/$name.sh" >&2
  echo "available profiles:" >&2
  for f in "$profiles_dir"/*.sh; do
    echo "  $(basename "$f" .sh)" >&2
  done
  exit 1
fi

printf '%s\n' "$name" > "$state_file"
echo "Active profile: $name"
describe_profile "$name"
echo
echo "Applies on the next crush start (config loads at startup)."
echo "Mid-session: switch models manually with the picker (ctrl+l) using the refs above."

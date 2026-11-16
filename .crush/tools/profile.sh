#!/usr/bin/env bash
# Switch the active Crush model profile.
#
# Usage:
#   ./profile.sh                       list profiles + active one
#   ./profile.sh <name>                switch profile
#   ./profile.sh --global [name]       force global scope
#   ./profile.sh --project [name]      force project scope
#
# Scope: auto-detects — project (.crush/profiles in cwd) when present,
# otherwise global (~/.config/crush). The choice is persisted to an
# active-profile state file AND synced into the model-picker state JSON
# (models.large/small), because the picker state overrides crushrc
# model wiring at startup. Applies on the next crush start — crushrc
# and state load at startup, and a running TUI may rewrite the state on
# exit, so restart crush right after switching. Mid-session, switch
# models manually with the picker (ctrl+l).
set -eu

mode="${CRUSH_PROFILE_SCOPE:-auto}"
if [[ "${1:-}" == "--global" || "${1:-}" == "--project" ]]; then
  mode="${1#--}"
  shift
fi

if [[ "$mode" == "auto" ]]; then
  if [[ -d ".crush/profiles" ]]; then mode="project"; else mode="global"; fi
fi

if [[ "$mode" == "project" ]]; then
  profiles_dir=".crush/profiles"
  state_file=".crush/active-profile"
  scope_label="project"
else
  crush_config_dir="${CRUSH_CONFIG_DIR:-$HOME/.config/crush}"
  profiles_dir="$crush_config_dir/profiles"
  state_file="$crush_config_dir/active-profile"
  scope_label="global"
fi

describe_profile() {
  local name="$1" large="" small=""
  large="$(grep -m1 '^model large ' "$profiles_dir/$name.sh" | sed 's/^model large  *//')"
  small="$(grep -m1 '^model small ' "$profiles_dir/$name.sh" | sed 's/^model small  *//')"
  echo "  large: $large"
  echo "  small: $small"
}

current=""
if [[ -s "$state_file" ]]; then
  current="$(head -n 1 "$state_file" | tr -d '[:space:]')"
fi
if [[ -n "${CRUSH_PROFILE:-}" ]]; then
  current="$CRUSH_PROFILE [env override]"
fi

if [[ $# -eq 0 ]]; then
  echo "Crush profiles ($scope_label, $profiles_dir) — active: ${current:-<none, standard models>}"
  echo
  for f in "$profiles_dir"/*.sh; do
    name="$(basename "$f" .sh)"
    marker=" "
    [[ "$name" == "$current" ]] && marker="*"
    echo "$marker $name"
    describe_profile "$name"
  done
  echo
  echo "Switch:  $0 <name>"
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
echo "Active profile ($scope_label): $name"
describe_profile "$name"

# Sync the model-picker state JSON: it overrides crushrc model wiring at
# startup, so without this the profile would not fully apply.
state_json="${CRUSH_GLOBAL_DATA:-$HOME/.local/share/crush}/crush.json"
if [[ -f "$state_json" ]] && command -v jq >/dev/null 2>&1; then
  large_ref="$(grep -m1 '^model large ' "$profiles_dir/$name.sh" | awk '{print $3}')"
  small_ref="$(grep -m1 '^model small ' "$profiles_dir/$name.sh" | awk '{print $3}')"
  tmp="$(mktemp)"
  if jq --arg lp "${large_ref%%/*}" --arg lm "${large_ref#*/}" \
       --arg sp "${small_ref%%/*}" --arg sm "${small_ref#*/}" \
       '.models.large.provider = $lp | .models.large.model = $lm
      | .models.small.provider = $sp | .models.small.model = $sm' \
       "$state_json" > "$tmp"; then
    mv "$tmp" "$state_json"
    echo "  picker state synced: $state_json"
  else
    rm -f "$tmp"
    echo "  warning: failed to sync picker state $state_json" >&2
  fi
else
  echo "  (picker state $state_json not found or jq missing — crushrc will apply the profile if no picker state exists)"
fi

echo
echo "Applies on the next crush start — restart crush now (a running TUI"
echo "may rewrite the picker state on exit)."
echo "Mid-session: switch models manually with the picker (ctrl+l) using the refs above."

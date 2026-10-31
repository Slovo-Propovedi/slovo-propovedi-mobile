#!/bin/sh
# Verifies .claude mirrors are byte-identical to .opencode sources (skills + commands).
# Canonical copies live in slovo-propovedi-mobile; edit there first, then re-propagate.
set -e
fail=0
check_pair() {
  src="$1"; dst="$2"
  if [ ! -f "$dst" ]; then echo "MISSING mirror: $dst"; fail=1; return; fi
  if ! cmp -s "$src" "$dst"; then echo "DIFFERS: $dst"; fail=1; fi
}
for f in .opencode/skills/*/SKILL.md; do
  check_pair "$f" ".claude/skills/${f#.opencode/skills/}"
done
for f in .claude/skills/*/SKILL.md; do
  [ -f "$f" ] || continue
  src=".opencode/skills/${f#.claude/skills/}"
  [ -f "$src" ] || { echo "ORPHAN (no .opencode source): $f"; fail=1; }
done
for f in .opencode/commands/*.md; do
  check_pair "$f" ".claude/commands/${f#.opencode/commands/}"
done
for f in .claude/commands/*.md; do
  [ -f "$f" ] || continue
  src=".opencode/commands/${f#.claude/commands/}"
  [ -f "$src" ] || { echo "ORPHAN (no .opencode source): $f"; fail=1; }
done
if [ "$fail" -ne 0 ]; then echo "skills sync check FAILED"; exit 1; fi
echo "skills sync OK"

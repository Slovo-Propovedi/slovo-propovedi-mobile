#!/usr/bin/env bash
# Compute the Android SDK cache key from the installed package directories.
#
# Extracted from the "Compute Android SDK cache key" step of
# .forgejo/workflows/ci.yml. The key is a digest of the top-level package
# directories, so it changes only when the build installed something new.
#
# The key is written to $GITHUB_OUTPUT (step output `key`) when running under
# Actions; stdout otherwise.
#
# Env:
#   ANDROID_SDK_ROOT  SDK directory (default /opt/android-sdk)
#   RUNNER_OS         runner OS label used in the key (default Linux)
#
# Exits 0 without a key when the SDK is absent or empty — the caller must then
# skip the cache save.

set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-/opt/android-sdk}"

# A missing SDK (setup failed early) yields no key and no save.
cd "$SDK_ROOT" 2>/dev/null || exit 0

dirs=()
for dir in build-tools platforms ndk cmake cmdline-tools; do
  # ndk/cmake are installed by gradle only when needed
  [ -d "$dir" ] && dirs+=("$dir")
done
[ "${#dirs[@]}" -gt 0 ] || exit 0

digest=$(find "${dirs[@]}" -mindepth 1 -maxdepth 1 | sort | sha256sum | cut -c1-16)
key="${RUNNER_OS:-Linux}-android-sdk-v2-$digest"

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "key=$key" >> "$GITHUB_OUTPUT"
else
  echo "key=$key"
fi

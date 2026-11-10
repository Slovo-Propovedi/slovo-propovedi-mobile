#!/usr/bin/env bash
# Install the Android SDK command-line tools and the packages CI needs.
#
# Extracted from the "Setup Android SDK" step of .forgejo/workflows/ci.yml so the
# same logic is shared by the Forgejo workflow and the GitHub-hosted composite
# actions. Idempotent: a cache-restored SDK skips the download/install.
#
# Required env:
#   ANDROID_SDK_ROOT      target SDK directory (e.g. /opt/android-sdk)
#   ANDROID_SDK_PACKAGES  space-separated sdkmanager package list, e.g.
#                         "platform-tools build-tools;36.0.0 platforms;android-37.0"
#
# Supports one extra behavior over the inline workflow step: when the SDK
# parent directory is not writable (GitHub-hosted runners create /opt as root),
# it escalates to `sudo install -d` + `sudo chown` instead of failing.

set -euo pipefail

: "${ANDROID_SDK_ROOT:?ANDROID_SDK_ROOT is required}"
: "${ANDROID_SDK_PACKAGES:?ANDROID_SDK_PACKAGES is required}"

ensure_sdk_root() {
  if mkdir -p "$ANDROID_SDK_ROOT" 2>/dev/null && [ -w "$ANDROID_SDK_ROOT" ]; then
    return 0
  fi

  # Parent not writable or an existing directory owned by another user: use
  # passwordless sudo (GitHub-hosted runners) and hand the directory back to
  # the current user. The Forgejo runner can already write /opt, so this branch
  # never runs there.
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    echo "Creating $ANDROID_SDK_ROOT with sudo (not writable by $(id -u))" >&2
    sudo install -d "$ANDROID_SDK_ROOT"
    sudo chown "$(id -u):$(id -g)" "$ANDROID_SDK_ROOT"
    return 0
  fi

  echo "::error::$ANDROID_SDK_ROOT is not writable and passwordless sudo is unavailable" >&2
  exit 1
}

ensure_sdk_root

mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
# Skip download/unzip/mv when the SDK was restored from cache; `mv` would
# otherwise fail because cmdline-tools/latest already exists.
[ -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ] || (
  curl -q -sSL -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -q cmdline-tools.zip -d "$ANDROID_SDK_ROOT/cmdline-tools"
  mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm cmdline-tools.zip
)

echo "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin" >> "$GITHUB_PATH"
echo "$ANDROID_SDK_ROOT/platform-tools" >> "$GITHUB_PATH"
echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT" >> "$GITHUB_ENV"
echo "ANDROID_HOME=$ANDROID_SDK_ROOT" >> "$GITHUB_ENV"

# `yes` never exits on its own — it gets SIGPIPE once sdkmanager stops reading,
# and CI steps run with `bash -o pipefail`, so that expected SIGPIPE (141)
# would otherwise fail this script even though sdkmanager itself succeeds.
yes | "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null || true
# shellcheck disable=SC2086 # word splitting of the package list is intended
# Output kept (no-op when restored) so a slow cold download is visible.
"$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" $ANDROID_SDK_PACKAGES

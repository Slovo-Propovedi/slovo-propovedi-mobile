# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-07

### Fixed

- Remove mock sermons from listen page

## [0.2.0] - 2026-08-07

### Fixed

- Add section mappers for updated API schemas
- Replace local openapi docs with remote link in orval

## [Unreleased]

### Added

- GPL-3.0-or-later license with App Store Additional Permission
  (Apple App Store + Google Play Store distribution).
- REUSE compliance (SPDX metadata across all files).
- `THIRD-PARTY-LICENSES.md` + `THIRD-PARTY-LICENSES-DISCLAIMER.md`.
- `ADDITIONAL-PERMISSIONS.md` (VLC-style Section 7 exception).
- `AUTHORS` file.
- `CONTRIBUTING.md` with DCO signoff workflow.
- `.forgejo/workflows/dco.yml` CI for DCO enforcement.
- `SECURITY.md` vulnerability reporting policy.
- User-configurable server URL setting (Settings screen) — removes
  vendor lock-in and F-Droid TetheredNet anti-feature.
- Reset-to-default link in server URL settings UI.
- `docs/BUILD-LOCAL.md` local build instructions (no proprietary
  EAS required).
- `fdroid/metadata/ru.slovopropovedi.yml` F-Droid
  build recipe.

### Changed

- License: MIT → GPL-3.0-or-later (strong copyleft).
- `package.json` license field: "MIT" → "GPL-3.0-or-later".
- `app.json` license field: "MIT" → "GPL-3.0-or-later".
- `src/shared/config/license.ts` LICENSE_NAME → "GPL-3.0-or-later".
- `app.json`: removed stale EAS OTA config (`updates.url`,
  `runtimeVersion`, `extra.eas.projectId`).
- `eas.json`: `appVersionSource: "remote"` → `"local"` (decouple
  from EAS Cloud).
- `README.md`: added License + FLOSS section, replaced
  "Build for Production (EAS)" with local-build-first approach,
  reconciled OTA section.
- `AGENTS.md`: corrected stale Expo SDK version (55 → 57).
- `LICENSE`: prepended Copyright (C) 2026 Slovo.Propovedi preamble
  - App Store exception reference.

### Deprecated

- `yarn update-app` script (OTA disabled; script still exists for
  EAS users but is documented as non-functional without
  reconfiguration).

### Removed

- YouTube video preview feature entirely (was dead code, never
  integrated):
  - `src/shared/api/youtube.ts` (contained leaked API key — see
    Security).
  - `src/shared/lib/youtube/getYoutubeVideoData.ts` + test.
  - `src/shared/lib/youtube/index.ts` (barrel).
  - `src/shared/ui/youtube-preview/YoutubePreview.tsx` + test.
  - `src/shared/ui/youtube-preview/assets/youtube-logo-png-2069.png`.
- 14 tests removed (473 → 459).
- `docs/OTA-STRATEGY.md` (expo-updates fully removed; OTA updates
  permanently disabled, app distributed via F-Droid and direct
  APK).

### Security

- Removed leaked YouTube Data API v3 key from source
  (`src/shared/api/youtube.ts:3` had hardcoded
  `MY_YOUTUBE_API_KEY = 'AIzaSyAu1Xlv...'`).
  **Note**: key remains in git history; rotation in Google Cloud
  Console is mandatory.
- Removed `firebase-messaging`, `installreferrer`, `ShortcutBadger`
  from F-Droid builds (via prebuild sed patches) — no proprietary
  Google dependencies in distributed APK.

[0.2.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.2.1
[0.2.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.2.0

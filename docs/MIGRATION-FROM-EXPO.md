# Migration from Expo SDK

> **Status**: Planning document. No active migration. The project
> remains on Expo SDK 57.

## Why This Document Exists

Expo SDK is MIT-licensed and fully FLOSS. The current Expo-based
setup is acceptable for the project's FLOSS goals. This document
exists as a **contingency plan** and reference for future
maintainers, should the project ever decide to eject from Expo SDK.

## Current State

- Expo SDK 57.0.8 (MIT)
- React Native 0.86.0 (MIT)
- Local builds supported (see [BUILD-LOCAL.md](./BUILD-LOCAL.md))
- EAS Cloud is optional, not required
- No proprietary dependencies in distributed APK

## Ejection Triggers

Consider ejecting from Expo SDK if any of the following occur:

- Expo SDK adopts a non-FLOSS license.
- Expo CLI becomes proprietary.
- Expo SDK forces dependency on non-FLOSS services.
- F-Droid reproducibility requirements become incompatible with Expo.
- App needs native modules incompatible with Expo autolinking.

## Migration Path

Replacement table for each Expo module currently in use:

| Expo Module | Replacement | License | Difficulty | Notes |
|-------------|-------------|---------|------------|-------|
| `expo` (CLI) | React Native CLI (`@react-native-community/cli`) | MIT | Medium | RN CLI is the standard alternative |
| `expo-router` | React Navigation (`@react-navigation/native` + `@react-navigation/native-stack`) | MIT | Hard | Requires rewriting routing; Expo Router is built on React Navigation so concepts map directly |
| `expo-audio` | `react-native-track-player` | Apache-2.0 | Medium | Mature, GPL-compatible; similar API to expo-audio |
| `expo-notifications` | UnifiedPush (`@ungerik/unified-push` or community port) | Apache-2.0 | Medium | Push without Google FCM; currently only local notifications used so removal may suffice |
| `expo-asset` | `react-native-asset` | MIT | Easy | Drop-in replacement |
| `expo-file-system` | `react-native-fs` | MIT | Easy | Similar API |
| `expo-clipboard` | `@react-native-clipboard/clipboard` | MIT | Easy | Drop-in |
| `expo-linear-gradient` | `react-native-linear-gradient` | MIT | Easy | Drop-in |
| `expo-blur` | `@react-native-community/blur` | MIT | Easy | Drop-in |
| `expo-checkbox` | `@react-native-community/checkbox` | MIT | Easy | Drop-in |
| `expo-constants` | `react-native-config` | MIT | Easy | Config via `.env` files |
| `expo-device` | `react-native-device-info` | MIT | Easy | Drop-in |
| `expo-intent-launcher` | `react-native-intent-launcher` | MIT | Easy | Drop-in |
| `expo-status-bar` | React Native's `StatusBar` | MIT | Easy | Built into RN core |
| `expo-task-manager` | `react-native-background-actions` | MIT | Medium | Different API; check use case |
| `expo-linking` | React Native's `Linking` | MIT | Easy | Built into RN core |
| `@expo/vector-icons` | `react-native-vector-icons` | MIT | Easy | Drop-in |

## Build System Changes

Ejecting from Expo SDK requires replacing the Expo build pipeline
with direct native project configuration:

- Replace `app.json` + `app.config.js` with direct native project
  configuration.
- Replace Expo autolinking with React Native CLI autolinking.
- Manual native module installation (no more `expo install`).
- No more Expo Go for development — use simulator/device directly.
- CI/CD pipelines must be updated to build without Expo tooling.

## YouTube API Key History Exposure

A YouTube Data API v3 key was leaked in git history at
`src/shared/api/youtube.ts:3`
(`MY_YOUTUBE_API_KEY = 'AIzaSyAu1Xlv...'`).

The key was removed from the working tree during the FLOSS migration
(see [CHANGELOG.md](../CHANGELOG.md)), but **remains in past commits**.

### Recommendations

- **Rotate the key** in Google Cloud Console (mandatory).
- **Key purging** (optional): use
  `git filter-repo --invert-paths --path src/shared/api/youtube.ts`
  to remove the file from history. This **breaks history** and
  requires a force-push; affects all contributors.
- **Alternative**: rely on rotation only — once the key is
  invalidated in Google Cloud Console, leaking it has no impact.
- Document this for any future maintainer who clones the repo
  and finds the key in history.

## Estimated Migration Effort

2–4 weeks for a single developer familiar with both Expo and vanilla
React Native. Most modules have drop-in replacements. The hard parts
are:

1. `expo-router` → React Navigation (routing rewrite).
2. Build system setup (native project configuration, CI/CD).

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [Local Build Instructions](./BUILD-LOCAL.md)

---

> Licenses accurate as of 2026-07. Re-verify before initiating migration —
> license terms and project availability may change.

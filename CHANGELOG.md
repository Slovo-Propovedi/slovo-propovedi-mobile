# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.18.0] - 2026-09-04

### Added

- Split share screen into collapsible landing/release links
- Cap the layout to a centered column on desktop
- Offline audio cache, PWA, and build tooling

### Changed

- Pass id-only params instead of full JSON in listen URLs

### Fixed

- Restore back navigation on sub-screens after a page reloadr
- Themed scrollbars, drop the phantom horizontal scrollbar
- Render conditional text via ternaries, not &&
- Drop expo-notifications from the web bundle graph
- Mirror web player state into the shared atoms
- Guard native-only APIs to stop startup crashes

## [0.17.0] - 2026-08-31

### Added

- Redesign continue button as round glowing play/pause (#72)

### Fixed

- Update fsd visualize
- Suppress repeat taps in usePlayNewSermon (#74)
- Update store and README screenshots to current app UI
- Suppress error dialog on background caching network failure (#73)
- Bound queue sheet list frame to screen and guarantee scroll clearance (issue #69)
- Remove obsolete @gorhom/bottom-sheet epsilon patch (issue #48)
- Rework queue sheet gestures and guarantee scroll for short playlists (issue #69)
- Auto-save position every 10s and mark completion on auto-advance (#65)

## [0.16.0] - 2026-08-29

### Added

- Fallback update download to GitHub Releases and mirror releases in CI (closes #68)
- Repeat-aware tap hints and worklets scheduleOnRN migration (#67)
- Scrollable playlist title in playlist list via MarqueeText (#66)
- Add continue listening button to listen screen (#47)
- Open dropdown menus above the button with flip below near screen top (#64)
- Collapsible next-sermon plate in fullscreen player (#57)
- Auto-scroll playlist sheet to current sermon (#48)

### Fixed

- Always-active prev/next with repeat-aware boundary behavior (#67)
- Resume from new position after seek on pause and smooth scrubbing
- Remove first-open dropdown flash and pin menu anchoring with tests (#64)
- Anchor dropdown menus to their trigger buttons (#64)
- Compute next-sermon title reveal height instead of onLayout measurement (#57)
- Avoid maxHeight measurement feedback loop in next-sermon plate (#57)

## [0.15.0] - 2026-08-26

### Added

- Add playback speed control in fullscreen player menu (#62)

## [0.14.3] - 2026-08-25

### Fixed

- Prevent mini-player stretching after app update (#63)
- Restore listening position on track switch via buttons and auto-advance (#46)
- Add .agtents to steiger ignore
- Restore mini-player after long background on Android (#61)
- Prevent track restart after background auto-advance on app open (#60)

## [0.14.2] - 2026-08-24

### Changed

- Eliminate Metro require cycles and ban shared re-exports via higher layers

### Fixed

- Downgrade package for correct running tests
- Fix require cycle in listening-history entity
- Update packages
- Enlarge splash image to ~1/3 screen width (#54)
- Configure splash screen via expo-splash-screen plugin (#54)

## [0.14.1] - 2026-08-24

### Fixed

- Keep media session alive across track switch for background auto-advance (#50)
- Lift tab bar above 3-button navigation using safe-area insets
- Prevent tab bar label wrapping and derive mini-player offset from measured tab bar height
- Retry playlist track downloads on network switch (#49)

## [0.14.0] - 2026-08-24

### Added

- Show update dialog immediately instead of green banner (#55)
- Add 'Share app' screen in 'More' tab (#52)

### Fixed

- Survive native build phase on 4GB runner
- Newline-safe append of kotlin.strategy to gradle.properties
- Prevent release build OOM on 4GB runner
- Module-resolver must not rewrite imports from node_modules

## [0.13.0] - 2026-08-22

### Added

- In-app update flow with permission gate, fix apk cleanup race
- Add russian mapping for native install errors
- Add local apk-installer expo module wrapping PackageInstaller

## [0.12.0] - 2026-08-22

### Added

- Add "Обновить" action button to update push notification

## [0.11.1] - 2026-08-22

### Fixed

- Sanitize lock screen artwork URI to prevent fatal crash
- Add startup crash guard to break restore crash loops
- Cap Metro node heap to prevent release build OOM

## [0.11.0] - 2026-08-22

### Added

- Add global error dialog with reportError imperative API

### Changed

- Make artwork nullable across domain and UI

### Fixed

- Rename dev build to «Dev Слово.Проповеди»
- Null-safe getEntrySermon across history consumers
- Harden auto-advance for Issue #45 — artwork, ordering, crash guards

## [0.10.0] - 2026-08-22

### Added

- Add in-app APK self-update dialog (closes #44)

## [0.9.0] - 2026-08-20

### Added

- Play from history in original playlist with full queue
- Add listening history screen with progress and clear-all
- Show listening progress in sermon lists
- Resume playback from listening history and track progress
- Add listening history entity with local progress persistence

### Changed

- Migrate themed to theme and tighten barrel exports
- Add @x/player cross-import entry point
- Replace hand-rolled validation with Zod schema
- Read player state imperatively in usePlaySermon to stop position-tick re-renders
- Native equalizer animation, atom write guards, stable renderItem
- Split live progress snapshot from catalog writes
- Move slice components into ui folders, one component per file

### Fixed

- Allow backward position saving in progress tracking
- Restore background audio playback and media notification after long inactivity
- Strip playlists on merge and skip writes while paused

## [0.8.1] - 2026-08-18

### Fixed

- Narrow per-track progress subscription to fix crash and re-render storms
- Reset status listeners before replacing audio to prevent stale events
- Adopt in-flight background caching on sermon switch to keep progress visible
- Emit throttled download progress with atomic .part files and single-flight
- Show play/pause during download, move progress to bar and mini-player line

## [0.8.0] - 2026-08-18

### Added

- Resolve playlist list from section id for instant opening
- Cache covers via expo-image with lazy viewport loading

## [0.7.0] - 2026-08-17

### Added

- Fallback app icon artwork for missing covers
- Search suggestions with distinct values
- Support chapter/verse ranges and lists from API 0.15.1

### Fixed

- Render text duplicate only when it doesn't fit
- Uptade generated schemas

## [0.6.0] - 2026-08-14

### Added

- Sermon search on Listen tab with online-first cache
- Generic AsyncStorage cache with zod validation

### Fixed

- Remove msw
- Update schemas and add faker stubs
- Update schemas

## [0.5.0] - 2026-08-13

### Added

- Display sermon bible reference and author across the app

### Changed

- Use generated authControllerRefresh instead of raw axios.post
- Reduce gradle heap to -Xmx2048m to avoid swap thrash

### Fixed

- Update schemas with added search on sermons
- Cap jest workers to prevent OOM (SIGKILL) in CI
- Update openapi cpec version in generated files

## [0.4.1] - 2026-08-12

### Added

- Separate dev/prod via productFlavors

### Changed

- Enable progressive audio streaming

### Fixed

- Remove OTA updates script and references
- Update openapi spec version

## [0.4.0] - 2026-08-11

### Added

- Add notification action button, fix re-entry banner, resize banner

### Changed

- Split changelog generation into pure core and I/O orchestrator

### Fixed

- Insert changelog link references in version-descending order

## [0.3.1] - 2026-08-11

### Changed

- Update validation schemas and decompose mappers into separate files

### Fixed

- Remove unnecessary types from sections data
- Update packages
- Restore seeking and OS notification progress bar

## [0.3.0] - 2026-08-10

### Added

- Add app version check with update notification and green banner
- Add store screenshots for F-Droid listing
- Automate changelog generation from conventional commits
- Add fastlane metadata for F-Droid store listing

### Changed

- Remove expo-updates dependency and manifest metadata

### Fixed

- Remove eas from yarn.lock
- Remove residual expo-updates references from docs and config
- Resolve Gradle metaspace OOM and optimize release build
- Update signing check in commit-msg
- Eliminate Metaspace OOM on runner

## [0.2.1] - 2026-08-07

### Fixed

- Remove mock sermons from listen page

## [0.2.0] - 2026-08-07

### Fixed

- Add section mappers for updated API schemas
- Replace local openapi docs with remote link in orval

## [0.1.6] - 2026-08-07

### Fixed

- Verify tag creation in bump-version.mjs instead of trusting exec status
- Don't let yes's SIGPIPE fail the Android license acceptance step

## [0.1.5] - 2026-08-07

### Fixed

- Match CI commit-status context by prefix, not exact equality

## [0.1.4] - 2026-08-07

### Fixed

- Restore CI polling in release now that runner capacity is 2

## [0.1.3] - 2026-08-07

### Fixed

- Merge dco into ci.yml since workflow_run is unsupported

## [0.1.2] - 2026-08-07

### Fixed

- Enforce dco->ci->release order and fix broken release/dco triggers

## [0.1.1] - 2026-08-07

### Fixed

- Add setup android SDK step in release workflow
- Sign commits in bump-version and enforce DCO trailer via commitlint
- Update packages to supported versions
- Update expo version and modules

## [0.1.0] - 2026-08-06

### Added

- Align OpenAPI spec with backend changes
- Add Forgejo release workflow and improve version bump script
- Add custom notification icon with logo silhouette
- Add version bump script

### Fixed

- Getting sections and update schemas
- Remove unnecessary react imports
- Show server unreachable toast only once per outage
- Remove disabled background on API URL reset link, decompose ServerUrlSettings
- Prevent flicker on data retry

## [0.0.0] - 2026-07-28

### Added

- Add F-Droid build metadata with FCM strip
- User-configurable server URL
- Decouple from EAS proprietary services
- Adopt GPL-3.0-or-later with REUSE compliance
- Update api url
- Add accessibilityRole to touchable components and test touchable-item
- Implement retrying request on internet disconnected
- Redesign playlists list component
- Implement smooth change in title of playlist list when scrolling
- Implement material you theme option
- Add network disconnected island and server error toast
- Implement caching playlists
- Implement lignt/dark theme switching
- Display information about caching in push notification
- Show caching and clear cache progress for all playlist
- Add option for caching all playlist or clearing all playlist cache
- Add license
- Add about screen and momve settings screen to pages
- Implement error boundary and global error handler
- Replace console.error with error modal
- Rename info tab and add settings with clearing cache
- Implement generating schemas for all requests
- Close context menu on back
- Implement gesture handling or click-to-navigation handling to navigate story
- Add displaying playing or pause status in sermon in playlist
- Add seek buttons to player in push
- Implement display player in notification panel
- Implement playlist item context menu on long press
- Implement adding and removing from chache from playlist item and player context menu
- Implement audio files caching
- Implement displaying of sermon description
- Implement play/pause by clicking on middle area
- Add display of following sermon in header of full player
- Implement saving recurrence state in player between sessions
- Enhance progress bar and add repeat modes
- Implement seek forward/backward on hold next/prev sermod buttons
- Add thumb in progressbar
- Implement open botomsheet with playlist on click playlist button in fullscreen player
- Change icons for repeat button and update icons sizes
- Make animation of player transition to full-screen smooth
- Set sermon cover as player background and fix ellipsing player animation
- Add features from audio-player and set dark theme
- Replace old routing with expo-router

### Changed

- Change applicationId to ru.slovopropovedi
- Remove YouTube feature and leaked API key
- Use a11y queries instead of testID in Modal tests
- Move BibleBookName to mock db and add tests for bible domain
- Fix elslint fixme and disabling comments
- Consolidate single-use slices into consuming pages
- Replace simple json parsing with zod schemas and split some files
- Remove default exports from all, exclude app directory
- Split DynamicSectionsSlider component file
- Move skeletons to Skeleton components field
- Split skeletons for listen tab and move components in shared/ui to their directories
- Move collapsing navbar driver to shared
- Remove unnecessary useEffect uses
- Replace deprecated runOnJS with scheduleOnRN
- Remove unnecessary barrel exports
- Change imports iside shared layer
- Replace mock sliders with dynamic sections from backend
- Replace all slovo istiny with slovo propovedi
- Move initializePlayer function to entities/player
- Remove unnecessary from app folder
- Remove unnecessary
- Remove unnecessary and move to separate folder some components
- Decompose PlayerService
- Use ts-pattern library
- Remove unnecessary
- Remove unnecessary
- Remove unused animated player widget
- Main layout
- Remove unused mini player widget
- Decompose tabs route layout
- Remove web specific code

### Fixed

- Set NODE_BINARY in gradle.properties for Gradle daemon
- Update packages
- Fix seek-while-paused snap-back and notification metadata timing
- Resolve jest.mock hoisting error in ErrorDialog test
- Resolve jest.mock hoisting error in PlayingStatusOrChacheIcon test
- Resolve caching reactivity, seek snap-back, and background caching issues
- Replace jest.isolateModules with resetCOLORS helper in colors tests
- Disable max-lines rule for test files
- Decompose player controls component and fix other issues
- Replace view with scrollview for content container on settings and more pages
- Correct paddings in sermons list in playlist page
- Skeleton for listen tab
- Modal sizes if message text is very long
- Playlist title disappearing when scrolling quicly
- Test commit for forgejo runner
- Implement playlist labels scrolling in sliders
- Color icons in statusbar in light mode in playlists page on scroll to bottom
- Decompose PlaylistCacheMenu component
- Link to axios icon in readme
- Update readme file and fix check:unused script
- Lint errors
- Decompose ConfirmDialog component
- Fsd errors
- Cercular dependencies
- Remove unnecessary content from listen screen
- License url
- Remove React imports
- Layout of fullscreen player
- Tests after dependency updates
- Fsd errors
- Disable read and study tabs. Replace info and more tabs
- Update packages
- When switching to another sermon, if current one was not fully cached, sound is superimposed
- Sermons artwork height in playlist silders
- Set porperties for setting slider sizes as required
- Add mock data for sections request
- Update documentation with required fields
- Ipmlement disabling running player in notifications panel only in expo go
- Move hardwareBackPress handler to useEffect in root layout component
- Remove i18next and update README.md
- Pause when incoming call and autoplay when it ends
- Collapse fullscreen player with bottomsheet on swipe down
- Progressbar flies out of screen when switching tracks
- Do not work when switching to next sermon several times
- Repeat one track mode in background, replace previewUrl with artwork
- Start listening to playlist over if appropriate mode is selected
- Unupdate player in push notifications after end of playlist playback and replay
- Background playback and sermon switching
- Implement update content in push when switch sermon
- Change content of push notification when switching sermon
- Display of spinner in miniplayer on downlodaing file
- Add scripts for running android or ios app with build
- Not open in notifications at start of application, states were not synchronized
- Add artist for sermons
- Slow down scrolling through sermon title
- Queue controls text
- Add padding to bottom in playlist screen
- Collapsing header position
- Scroll in playlist view in listen screen
- Rename name app
- Update packages verstion
- Fix track auto-switch at end with repeat modes
- In split view of applications, scale of full-screen pallet was calculated incorrectly
- Implement hide bottomsheet on click backdrop
- Styles in bottomsheet
- Add more magrins for progressbar
- Remove audio player screen and change play button size in fullscreen player
- Increase width of progress bar in player, add swipe position change
- Incorrect menu position in full player
- Update knip config
- Update mime type
- Add reexport in app/(tabs)/stydy route
- Add knip
- Architecture errors
- Overlay overlapped player and it was impossible to click
- Move controls in full audio player down, add gradients
- Opening player on tap on miniplayer after swipe
- Correct expanding and collapsing when sliding on player
- Incorrect animation for backgound of player on collapse
- Add AGENTS.md
- Remove old packages and notifications for correct app running

[0.18.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.18.0
[0.17.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.17.0
[0.16.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.16.0
[0.15.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.15.0
[0.14.3]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.14.3
[0.14.2]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.14.2
[0.14.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.14.1
[0.14.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.14.0
[0.13.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.13.0
[0.12.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.12.0
[0.11.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.11.1
[0.11.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.11.0
[0.10.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.10.0
[0.9.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.9.0
[0.8.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.8.1
[0.8.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.8.0
[0.7.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.7.0
[0.6.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.6.0
[0.5.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.5.0
[0.4.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.4.1
[0.4.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.4.0
[0.3.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.3.1
[0.3.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.3.0
[0.2.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.2.1
[0.2.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.2.0
[0.1.6]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.6
[0.1.5]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.5
[0.1.4]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.4
[0.1.3]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.3
[0.1.2]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.2
[0.1.1]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.1
[0.1.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.1.0
[0.0.0]: https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/src/tag/v0.0.0

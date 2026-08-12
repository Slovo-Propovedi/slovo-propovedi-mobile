# Слово.Проповеди — Development

This document is for developers and contributors. For user-facing information (download, install, usage), see [README.md](README.md).

🍰 [Architecture design guidelines](https://feature-sliced.design/)

## Technology stack

- **UI**: `react`, `react-native`, `expo`
- **Navigation**: `expo-router` (file-based routing)
- **State Management**: `@reatom/core`, `@reatom/framework`, `@reatom/npm-react`
- **Audio**: `expo-audio`
- **HTTP**: `axios`
- **Storage**: `@react-native-async-storage/async-storage`
- **Validation**: `zod`
- **Pattern Matching**: `ts-pattern`
- **UI Components**: `@gorhom/bottom-sheet`
- **Animations**: `react-native-reanimated`
- **Gestures**: `react-native-gesture-handler`
- **Tab View**: `react-native-tab-view`
- **Notifications**: `expo-notifications`
- **Book Parsing**: `xml-js` (FB2 format)
- **Lang**: `typescript`
- **Lint**: `prettier`, `eslint`
- **Architecture**: `feature-sliced`

<div align="center">
<img title="react" alt="react" height=48 src="https://raw.githubusercontent.com/yurijserrano/Github-Profile-Readme-Logos/master/frameworks/react.svg"/>
<img title="react-native" alt="react-native" height=48 src="https://reactnative.dev/img/header_logo.svg"/>
<img title="expo" alt="expo" height=48 src="https://static.expo.dev/static/favicons/favicon-light-48x48.png"/>
<img title="reatom" alt="reatom" height=48 src="https://avatars.githubusercontent.com/u/50905415?s=200&v=4"/>
<img title="expo-router" alt="expo-router" height=48 src="https://static.expo.dev/static/favicons/favicon-light-48x48.png"/>
<img title="axios" alt="axios" height=48 src="https://axios.rest/favicon-32x32.png"/>
<img title="typescript" alt="typescript" height=48 src="https://raw.githubusercontent.com/remojansen/logo.ts/master/ts.png"/>
<img title="prettier" alt="prettier" height=48 src="https://prettier.io/icon.png"/>
<img title="eslint" alt="eslint" height=48 src="https://eslint.org/favicon.ico"/>
<img title="feature-sliced" alt="feature-sliced" height=48 src="https://avatars.githubusercontent.com/u/60469024?s=200&v=4"/>
</div>

## Getting Started

### Installation

```bash
yarn install
```

### Running the App

```bash
yarn start
```

This will start the Expo development server. You can then scan the QR code with the Expo Go app on your mobile device or press `a` to run on Android emulator / `i` to run on iOS simulator.

## Available Scripts

### Development

- `yarn start` — Start Expo dev server
- `yarn start -- --clear` — Start with cleared cache
- `yarn run:android` — Run on Android device/emulator
- `yarn run:ios` — Run on iOS device/simulator

### Linting & Type Checking

- `yarn lint` — Run ESLint
- `yarn lint:fix` — Run ESLint with auto-fix
- `yarn check:types` — TypeScript type checking
- `yarn check:fsd` — FSD architecture linting (steiger)
- `yarn check:fsd-watch` — FSD linting in watch mode
- `yarn check:unused` — Check for unused code (knip)

### Testing

- `yarn test` — Jest in watch mode, changed files only (vs main)
- `yarn testFinal` — Run all tests once
- `yarn testDebug` — Run tests for locally changed files only
- `yarn updateSnapshots` — Update test snapshots

### Formatting

- `yarn prettier:write` — Format all files with Prettier

### API Generation

- `yarn api:generate` — Generate API client from OpenAPI spec (orval)

### Building & Deployment (EAS)

- `yarn build:android` — Build Android with EAS
- `yarn build:ios` — Build iOS with EAS
- `yarn build:all` — Build all platforms
- `yarn build:list` — List EAS builds
- `yarn build-local-debug:android` — Build Android debug locally
- `yarn build-local-release:android` — Build Android release locally

### Additional Commands

- `yarn build-preview:android` — Build Android with preview profile
- `yarn build-preview:ios` — Build iOS with preview profile
- `yarn build-preview:all` — Build all platforms with preview profile
- `yarn emulator-run-builds` — Run EAS builds on emulator
- `yarn visualize-deps` — Visualize FSD dependencies
- `yarn prepare` — Set up git hooks (husky)

## Project Architecture

This project follows **Feature-Sliced Design (FSD)** architecture with **Expo Router** for navigation.

### FSD Layers (top to bottom)

```
app/                    # Expo Router entry points and layouts only
src/
  ├── pages/           # Screen components with UI
  ├── widgets/         # Composed UI blocks (sliders, cards)
  ├── features/        # User interactions and business logic
  ├── entities/        # Domain models and business entities
  └── shared/          # Reusable utilities, UI components, and types
```

### Expo Router Structure

```
app/
├── _layout.tsx              # Root layout
├── _RootLayout.tsx          # Root layout component
├── index.tsx                # Redirect entry
├── about.tsx                # About screen
├── settings.tsx             # Settings screen
└── (tabs)/                  # Tab navigation group
    ├── _layout.tsx          # Tab bar layout
    ├── listen/              # Listen tab with nested screens
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── playlist.tsx
    │   └── playlist-list.tsx
    ├── read.tsx             # Read tab (single screen)
    ├── study.tsx            # Study tab
    └── more.tsx             # More tab
```

**Important:** Screen logic lives in `src/pages/`, `app/` only re-exports.

### FSD Slice Structure

```
src/entities/player/
├── index.ts              # Public API exports
├── model.ts              # State, atoms, types
├── lib/                  # Hooks and utilities
│   ├── index.ts
│   ├── usePlayer.ts
│   └── PlayerService/    # Platform-specific implementations
└── ui/                   # Components
    ├── PlayerControls.tsx
    └── PlayerControls.test.tsx
```

## Key Technologies

### State Management: Reatom

The project uses Reatom for state management, providing a reactive and atomic approach to state management.

**Usage Example:**

```typescript
// model.ts
import { atom, action } from '@reatom/framework'

export const currentAudioAtom = atom<AudioPlayerData | null>(null, 'currentAudioAtom')

export const setCurrentAudio = action(async (ctx, audio: AudioPlayerData) => {
  await ctx.schedule(() => {
    currentAudioAtom(ctx, audio)
  })
  return audio
}, 'setCurrentAudio')

// Component
import { useAtom, useAction } from '@reatom/npm-react'

const currentAudio = useAtom(currentAudioAtom)[0]
const setCurrentAudio = useAction(setCurrentAudio)
```

### Navigation: expo-router

File-based routing powered by Expo Router, with support for:

- Nested navigation
- Tab navigation
- Link-based navigation
- URL parameters

### Audio: expo-audio

Cross-platform audio playback for sermons and audio content.

### Book Parsing: xml-js

FB2 format book parsing for the reading section.

### HTTP: axios

Modern HTTP client for API requests with interceptors and automatic token refresh.

## Code Quality

### Linting & Formatting

- **ESLint**: Comprehensive linting with rules for:
  - React and React Hooks
  - TypeScript
  - Import ordering (perfectionist)
  - Code style and best practices

- **Prettier**: Consistent code formatting with project-specific configurations

- **TypeScript**: Strict type checking enabled

- **FSD Linting**: Enforces Feature-Sliced Design architecture rules using `steiger`

### Testing

- **Jest** with `jest-expo` preset for React Native/Expo testing
- **@testing-library/react-native** for component testing
- Test files placed alongside components (`ComponentName.test.tsx`)
- Snapshot testing support

## Pre-commit Hooks

The project uses **husky** + **lint-staged** + **commitlint** to ensure code quality before commits.

**What runs on commit (pre-commit):**

```bash
yarn lint:staged && yarn check:types
```

This runs ESLint fix + Prettier on staged files, then TypeScript type checking.

**What runs on commit (commit-msg):**

```bash
yarn commitlint
```

This validates that commit messages follow the Conventional Commits format.

## Package Manager

**This project uses yarn as the package manager.** Always use yarn instead of npm for all operations:

- Install dependencies: `yarn` or `yarn install`
- Add packages: `yarn add <package>`
- Add dev packages: `yarn add -D <package>`
- Run scripts: `yarn <script>`
- Run CLI tools: `yarn <tool>` (e.g., `yarn jest`)

## Commit Convention

The project follows Conventional Commits with these types:

- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code change without feature/fix
- `test` — Adding/modifying tests
- `docs` — Documentation only
- `style` — Formatting only
- `chore` — Maintenance tasks
- `build` — Build system changes
- `ci` — CI configuration changes
- `perf` — Performance improvements
- `revert` — Reverting changes

Max header length: 100 characters

## Setup Development Environment

To set up the development environment:

```bash
# Install dependencies
yarn install

# Set up git hooks
yarn prepare

# Start the dev server
yarn start
```

## Testing

To run tests:

```bash
# Run tests in watch mode
yarn test

# Run all tests once
yarn testFinal

# Update snapshots
yarn updateSnapshots
```

To run a single test file:

```bash
yarn jest path/to/file.test.tsx
```

## Building

### Local Builds (Recommended)

The app can be built entirely locally without proprietary cloud services. See **[docs/BUILD-LOCAL.md](docs/BUILD-LOCAL.md)** for detailed instructions.

Quick reference:
- Android release: `yarn build-local-release:android` → outputs APK at `android/app/build/outputs/apk/release/app-release.apk`
- Android debug: `yarn build-local-debug:android`
- iOS release: `yarn run:ios -- --configuration Release`

**Note**: Default local builds are signed with the debug keystore. For production signing, follow the steps in [docs/BUILD-LOCAL.md](docs/BUILD-LOCAL.md#production-signing).

### EAS Cloud Build (Optional Alternative)

[Expo Application Services (EAS)](https://expo.dev/eas) Build is also supported as an optional convenience. Note: EAS Build is a proprietary cloud service and is **not** part of the FLOSS distribution.

- `yarn build:android` / `yarn build:ios` / `yarn build:all`
- `yarn build-preview:android` / `yarn build-preview:ios`

The app is distributed through F-Droid and direct APK downloads.

## Additional Resources

- [Feature-Sliced Design Documentation](https://feature-sliced.design/)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Reatom Documentation](https://reatom.js.org/)
- [React Native Documentation](https://reactnative.dev/)

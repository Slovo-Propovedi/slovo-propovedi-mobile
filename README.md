# React Native app for church based on Feature Sliced Design

🍰 [Architecture design guidelines](https://feature-sliced.design/)

## Technology stack

- **UI**: `react@19.2.0`, `react-native`, `expo@55`
- **Navigation**: `expo-router` (file-based routing)
- **State Management**: `@reatom/core`, `@reatom/framework`, `@reatom/npm-react`
- **Audio**: `expo-audio`
- **HTTP**: `axios`
- **Storage**: `@react-native-async-storage/async-storage`
- **Book Parsing**: `xml-js` (FB2 format)
- **Lang**: `typescript`
- **Lint**: `prettier`, `eslint`
- **Architecture**: `feature-sliced`

<div align="center">
<img title="react" alt="react" height=48 src="https://raw.githubusercontent.com/yurijserrano/Github-Profile-Readme-Logos/master/frameworks/react.svg"/>
<img title="react-native" alt="react-native" height=48 src="https://reactnative.dev/img/favicon.ico"/>
<img title="expo" alt="expo" height=48 src="https://static.expo.dev/static/favicons/favicon-light-48x48.png"/>
<img title="reatom" alt="reatom" height=48 src="https://avatars.githubusercontent.com/u/50905415?s=200&v=4"/>
<img title="expo-router" alt="expo-router" height=48 src="https://github.com/expo/expo/raw/main/.github/assets/logo.png"/>
<img title="axios" alt="axios" height=48 src="https://axios-http.com/assets/logo.png"/>
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
- `yarn update-app` — Deploy OTA update to main branch

### Additional Commands

- `yarn build-preview:android` — Build Android with preview profile
- `yarn build-preview:ios` — Build iOS with preview profile
- `yarn build-preview:all` — Build all platforms with preview profile
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
├── _layout.tsx           # Root layout with providers (Reatom context)
├── index.tsx             # Redirect to /listen
├── (tabs)/               # Tab navigation group
│   ├── _layout.tsx       # Tab bar layout with custom TabBar
│   ├── listen.tsx        # Re-exports src/pages/listen/ui.tsx
│   ├── read.tsx
│   ├── study.tsx
│   └── info.tsx
├── listen/               # Nested screens under listen tab
│   ├── _layout.tsx
│   ├── playlist.tsx
│   └── playlist-list.tsx
└── read/                 # Nested screens under read tab
    ├── _layout.tsx
    ├── book-reader.tsx
    └── books-list.tsx
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

The project uses **husky** + **lint-staged** to ensure code quality before commits.

**What runs on commit:**

```bash
yarn lint:staged && yarn check:types
```

This runs ESLint fix + Prettier on staged files, then TypeScript type checking.

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

## Build for Production

To build the app for production using EAS (Expo Application Services):

```bash
# Build for Android
yarn build:android

# Build for iOS
yarn build:ios

# Build for all platforms
yarn build:all
```

## OTA Updates

To deploy an OTA (Over-the-Air) update to the main branch:

```bash
yarn update-app
```

## Additional Resources

- [Feature-Sliced Design Documentation](https://feature-sliced.design/)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Reatom Documentation](https://reatom.js.org/)
- [React Native Documentation](https://reactnative.dev/)

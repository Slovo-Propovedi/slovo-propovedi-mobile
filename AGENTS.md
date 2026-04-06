# AGENTS.md

Coding agent instructions for the slovo-propovedi-mobile React Native/Expo project.

## Build, Lint, and Test Commands

```bash
# Development
npm start                    # Start Expo dev server
npm start -- --clear         # Start with cleared cache

# Linting
npm run lint                 # Run ESLint
npm run lint:fix             # Run ESLint with auto-fix
npm run check:types          # TypeScript type checking
npm run check:fsd            # FSD architecture linting (steiger)
npm run check:fsd-watch      # FSD linting in watch mode

# Testing
npm run test                 # Jest in watch mode, changed files only (vs main)
npm run testFinal            # Run all tests once
npm run testDebug            # Run tests for locally changed files only
npm run updateSnapshots      # Update test snapshots

# Run a single test file
npx jest path/to/file.test.tsx
npx jest src/entities/player/ui/PlayerControls.test.tsx

# Formatting
npm run prettier:write       # Format all files with Prettier

# API Generation
npm run api:generate         # Generate API client from OpenAPI spec (orval)

# Build/Deploy (EAS)
npm run build:android        # Build Android with EAS
npm run build:ios            # Build iOS with EAS
npm run build:all            # Build all platforms
npm run update-app           # Deploy OTA update to main branch
```

## Project Architecture

This project follows Feature-Sliced Design (FSD) architecture with Expo Router for navigation.

### FSD Layers (top to bottom)

1. **app** (`app/`) - Expo Router entry points and layouts only
2. **pages** (`src/pages/`) - Screen components with UI
3. **widgets** (`src/widgets/`) - Composed UI blocks (sliders, cards)
4. **features** (`src/features/`) - User interactions and business logic
5. **entities** (`src/entities/`) - Domain models and business entities
6. **shared** (`src/shared/`) - Reusable utilities, UI components, and types

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
├── model.ts              # State, atoms, types (optional)
├── lib/                  # Hooks and utilities
│   ├── index.ts
│   ├── usePlayer.ts
│   └── PlayerService/    # Platform-specific implementations
└── ui/                   # Components
    ├── PlayerControls.tsx
    └── PlayerControls.test.tsx
```

## Code Style Guidelines

### Imports

```typescript
// Order: external → internal (FSD layers) → types → relative
import { useEffect } from 'react'
import { View } from 'react-native'
import { usePlayer } from 'entities/player'
import { COLORS } from 'shared/themed'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaylistData } from 'shared/model'
import { localHelper } from './lib/helper'
```

- Use absolute imports for FSD layers: `'entities/*'`, `'features/*'`, `'shared/*'`, `'widgets/*'`, `'pages/*'`
- Use inline type imports: `import { type Foo } from 'bar'`
- No relative imports across layers (enforced by ESLint)
- Imports are alphabetically sorted (perfectionist plugin)

### Component Style

```typescript
// Use arrow functions as default exports
export const MyComponent = ({ prop1, prop2 }: MyComponentProps) => {
  return <View>...</View>
}

export default MyComponent

// Or inline for simple cases
export default () => <Redirect href="/listen" />
```

- Arrow functions preferred over function declarations
- Use `export const` for named exports
- Use `export default` for screen components
- Max 130 lines per file (enforced by ESLint)
- Self-closing components required: `<View />` not `<View></View>`

### Formatting

- Single quotes for strings
- No semicolons
- 2 spaces indentation
- Trailing commas always (except JSON files)
- Arrow parens: avoid when single param
- Print width: 100 characters
- JSX: single quotes, bracket on new line
- Platform-specific line endings (LF on Unix, CRLF on Windows)

### Types

```typescript
// Prefer interfaces for props
interface MyComponentProps {
  title: string
  onPress?: () => void
}

// Use type for unions/intersections
type Status = 'loading' | 'success' | 'error'

// Use const assertions for constants
export const COLORS = {
  primary: '#f16031',
  white: '#fff',
} as const
```

### Styling

```typescript
// Use StyleSheet.create for styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
})

// Use themed constants from shared/themed
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/themed'
```

### Naming Conventions

- **Components:** PascalCase (`PlayerControls.tsx`)
- **Utilities:** camelCase (`usePlayer.ts`, `timeConverters.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (`CURRENT_AUDIO`)
- **Folders:** kebab-case (`sermon-player-controls`)
- **FSD segments:** camelCase (`lib/`, `ui/`, `model.ts`)

## State Management (Reatom)

This project uses Reatom for state management.

### Atoms

```typescript
// model.ts
import { atom, action } from '@reatom/framework'

export const currentAudioAtom = atom<AudioPlayerData | null>(null, 'currentAudioAtom')
```

### Actions

```typescript
// model.ts
export const setCurrentAudio = action(async (ctx, audio: AudioPlayerData) => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(audio))
  await ctx.schedule(() => {
    currentAudioAtom(ctx, audio)
  })
  return audio
}, 'setCurrentAudio')
```

### Usage in Components

```typescript
import { useAtom, useAction } from '@reatom/npm-react'

const currentAudio = useAtom(currentAudioAtom)[0]
const setCurrentAudio = useAction(setCurrentAudioAction)
```

### Root Provider

The Reatom context is set up in `app/_layout.tsx`:

```typescript
import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'

const ctx = createCtx()

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <RootLayout />
  </reatomContext.Provider>
)
```

## Navigation

### Navigation Hooks

Navigation logic is centralized in `shared/routing/`:

```typescript
// shared/routing/useListenNavigation.ts
export const useListenNavigation = () => {
  const router = useRouter()

  const navigateToPlaylist = (playlist: PlaylistData) => {
    router.push({
      params: { playlist: JSON.stringify(playlist) },
      pathname: '/listen/playlist',
    })
  }

  return { navigateToPlaylist }
}
```

### Screen Re-export Pattern

```typescript
// app/(tabs)/listen.tsx
export { ListenScreen as default } from 'pages/listen'

// src/pages/listen/index.ts
export { ListenScreen } from './ui'
```

## Testing

### Test File Setup

- Test file naming: `ComponentName.test.tsx`
- Place test files next to the component
- Jest preset: `jest-expo`
- Setup file: `__mocks__/@react-native-async-storage/async-storage.js`

### Test Patterns

```typescript
import { render } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'

jest.mock('../lib/usePlayer', () => ({
  usePlayer: jest.fn(),
}))

let mockedUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>

describe('<PlayerControls>', () => {
  beforeEach(() => {
    mockedUsePlayer.mockReturnValue(mockUsePlayerReturnValue)
  })

  test('PlayerControls renders correctly', () => {
    const { getByTestId } = render(<PlayerControls {...props} />)
    expect(getByTestId('controls-container')).toBeTruthy()
  })
})
```

### Testing Guidelines

- Use `testID` props for element selection
- Use `@testing-library/jest-native/extend-expect` for extended matchers
- Mock external dependencies and hooks
- Use `beforeEach` to reset mock state

## Error Handling

```typescript
// Use try-catch for async operations
useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await api.getData()
      setData(data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }
  void fetchData()
}, [])
```

Note: `console.log` is warned in ESLint; use `console.warn` or `console.error`.

## Pre-commit Hooks

Husky + lint-staged runs on every commit:

```bash
# .husky/pre-commit
yarn lint:staged && yarn check:types
```

Runs ESLint fix + Prettier on staged files, then TypeScript check.

## Commit Convention

Conventional commits with these types:

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change without feature/fix
- `test` - Adding/modifying tests
- `docs` - Documentation only
- `style` - Formatting only
- `chore` - Maintenance tasks
- `build` - Build system changes
- `ci` - CI configuration changes
- `perf` - Performance improvements
- `revert` - Reverting changes

Max header length: 100 characters

## Key Dependencies

- **Navigation:** expo-router, @react-navigation/\*
- **State:** @reatom/core, @reatom/npm-react, @reatom/framework
- **Audio:** expo-audio
- **HTTP:** ky
- **Storage:** @react-native-async-storage/async-storage
- **Book parsing:** xml-js (FB2 format)

## Platform-Specific Code

Use `.native.ts` and `.web.ts` extensions for platform-specific implementations:

```
src/entities/player/lib/PlayerService/
├── index.ts        # Default export
├── index.native.ts # React Native implementation
└── index.web.ts    # Web implementation
```

## Package Manager

**IMPORTANT:** This project uses **yarn** as the package manager. Always use yarn instead of npm for all operations:

- Install dependencies: `yarn` or `yarn install`
- Add packages: `yarn add <package>`
- Add dev packages: `yarn add -D <package>`
- Run scripts: `yarn <script>`
- Run CLI tools: `yarn <tool>` (e.g., `yarn jest`)
  Do NOT use npm or npx commands.

## Gotchas

1. **AsyncStorage Mock:** Must be mocked in `__mocks__/` for tests
2. **Generated API Code:** `src/shared/api/generated/` is auto-generated and ignored by ESLint/FSD linting
3. **FSD Insignificant Slice:** Rule set to 'warn' - single-use features should be relocated eventually
4. **No Semicolons:** Project uses no semicolons, enforced by ESLint
5. **React 19:** Project uses React 19.2.0
6. **Expo SDK 55:** Using Expo SDK ~55.0.4

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
npm run check:circular       # Check for circular dependencies (dependency-cruiser)

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
├── _layout.tsx           # Корневой провайдер (reatomContext + ThemeProvider + GestureHandler + ErrorBoundary)
├── _RootLayout.tsx       # Корневой Stack: баннеры (Network/ServerError/Update), hardware-back каскад
├── index.tsx             # Redirect → /listen
├── settings.tsx          # → pages/settings (вне таб-группы)
├── about.tsx             # → pages/about (вне таб-группы)
└── (tabs)/
    ├── _layout.tsx       # 4 таба + CustomTabBar + ExpandablePlayer
    ├── listen/           # Стек раздела «Слушать»
    │   ├── _layout.tsx
    │   ├── index.tsx     # → pages/listen (главный экран)
    │   ├── playlist.tsx  # → pages/playlist
    │   └── playlist-list.tsx
    ├── read.tsx          # → pages/read (таб, ЗАБЛОКИРОВАН)
    ├── study.tsx         # → pages/study (таб, ЗАБЛОКИРОВАН/заглушка)
    └── more.tsx          # → pages/more
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

## Documentation (docs/)

В папке `docs/` лежит подробная документация функционала приложения на русском. Это **первоисточник знаний о проекте** для агентов (opencode, Claude Code, Cursor).

### Структура docs/

| Раздел                 | Назначение                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `docs/README.md`       | Карта документации и правила для агентов                                                                                 |
| `docs/architecture.md` | Архитектура «почему» (FSD + Expo Router + Reatom)                                                                        |
| `docs/conventions.md`  | Процессные договорённости (git, AI, ведение docs)                                                                        |
| `docs/decisions.md`    | Принятый стек и отклонённые варианты                                                                                     |
| `docs/debt.md`         | Технический долг                                                                                                         |
| `docs/features/`       | Крупные функциональные модули (player, audio-cache, navigation, state, theme, offline-and-network, updates, book-reader) |
| `docs/screens/`        | Описание экранов (с чек-листом формата в `screens/README.md`)                                                            |
| `docs/contracts/`      | Внешние контракты: REST API, AsyncStorage, локальная БД                                                                  |

### Обязательные правила для агентов

1. **Перед реализацией фичи/фикса** прочитай соответствующие документы в `docs/`:
   - `docs/screens/<экран>.md` — при работе с экраном
   - `docs/features/<модуль>.md` — при работе с модулем (плеер, кэш, навигация и т.д.)
   - `docs/contracts/<протокол>.md` — при работе с API/хранилищем
   - `docs/architecture.md` — при архитектурных решениях
   - `docs/decisions.md` — перед добавлением новой зависимости

2. **При изменении кода** обнови затронутые документы `docs/` **в том же PR/коммите**. Если изменил экран — обнови `docs/screens/<экран>.md`; изменил модуль — `docs/features/<модуль>.md`; изменил API-контракт — `docs/contracts/rest-api.md`; изменил ключи AsyncStorage — `docs/contracts/storage.md`.

3. **Каждый «срезанный угол»** (TODO, hack, отложенная задача, workaround) → запись в `docs/debt.md` в том же PR. Формат:

   ```
   - [ ] <что не доделано> — <где (пути файлов)> — <когда вернуться/контекст>
   ```

   Комментарий `// TODO(name):` в коде допустим **только** с зеркальной записью в `docs/debt.md`.

4. **Новые зависимости** — только через запись в `docs/decisions.md` (секция Approved stack) с объяснением «почему». Не добавляй пакеты «молча».

5. **Если в `docs/` нет нужной информации** — добавь её, исследовав код, чтобы следующий агент не делал это повторно. Это цель документации.

Полные правила ведения docs — в `docs/README.md` и `docs/conventions.md`. AGENTS.md и docs/ должны оставаться консистентными.

## Barrel Export Rules

- **One barrel per slice**: Each FSD slice should have only ONE barrel export file: `index.ts` at the slice root
- **No segment barrels**: DO NOT create `index.ts` files for segments (e.g., `ui/index.ts`, `lib/index.ts`)
- **Export only public API**: Export ONLY what's actually reused externally from other slices/layers. Internal implementation details (helper functions, internal components, atoms) should NOT be exported
- **Internal imports must be relative**: Inside a slice, files import each other via relative paths (`./lib/usePlayer`, `../model`), NEVER through the slice's own barrel (`'entities/player'`). This keeps the source context visible while reading code and prevents circular imports through the barrel.
- **Public API example**: If only one component is reused externally, export only that component:
  ```typescript
  export { MyComponent } from './ui/MyComponent'
  ```
  NOT:
  ```typescript
  export { MyComponent } from './ui/MyComponent'
  export { internalHelper } from './lib/internalHelper' // ❌ Internal, not reused externally
  export { InternalComponent } from './ui/InternalComponent' // ❌ Internal, not reused externally
  export { myAtom } from './model' // ❌ Internal state, not reused externally
  ```

### No re-exports of shared through higher layers

The `entities`, `features`, `widgets`, and `pages` layers must **NEVER** re-export anything from `shared/*` — no shim files (files whose content is essentially `export ... from 'shared/...'`), no re-export lines in slice barrels (`export { X } from 'shared/...'`). This ban covers BOTH value and type re-exports. Consumers must import from `shared/*` directly at the point of use.

```typescript
// ❌ BANNED: shim file inside an entity
// src/entities/player/lib/audioPlayerData.ts
export { audioPlayerDataSchema } from 'shared/model'

// ❌ BANNED: barrel line in a feature
// src/features/app-update/index.ts
export type { UpdateState } from 'shared/model'

// ✅ CORRECT: direct import at the point of use
import { audioPlayerDataSchema, type UpdateState } from 'shared/model'
```

Exemptions (NOT violations): `src/shared/**` itself; `app/` entry files re-exporting pages for Expo Router (`export { X as default } from 'pages/...'`); `@x` segment files (same-layer cross-slice convention); re-exports of NON-shared code (e.g. widgets composing entities — legal downward direction).

Rationale: such re-exports hide real dependencies (the import path no longer shows the symbol lives in `shared`), pull heavy module graphs through barrels, and caused Metro require cycles (player ↔ listening-history incident, 2026-08: the shim `entities/player/lib/audioPlayerData.ts` had to be deleted and every consumer rewired to import directly from `shared/model`). See [`docs/architecture.md`](docs/architecture.md) → «Запрет реэкспортов shared через верхние слои». This ban is enforced by code review only — there is no automated guard (steiger cannot see shims because a shim is a legal downward import; depcruise only catches cycles that result).

## Code Style Guidelines

### Imports

```typescript
// Order: external → internal (FSD layers) → types → relative
import { useEffect } from 'react'
import { View } from 'react-native'
import { usePlayer } from 'entities/player'
import { COLORS } from 'shared/ui/theme'
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
// Use arrow functions as named exports (preferred)
export const MyComponent = ({ prop1, prop2 }: MyComponentProps) => {
  return <View>...</View>
}
```

- **CRITICAL:** `export default` should ONLY be used in the `app/` folder for Expo Router entry points
- In all other folders (src/pages/, src/widgets/, src/features/, src/entities/, src/shared/), use ONLY named exports
- Arrow functions preferred over function declarations
- Use `export const` for named exports
- Max 130 lines per file (enforced by ESLint)
- Self-closing components required: `<View />` not `<View></View>`
- **UI components live in `ui/` segment:** Every slice (pages, widgets, features, entities) places its UI components and their co-located tests inside the `ui/` folder, never at the slice root
- **One component or hook per file:** Each component and hook gets its own file — helper components (e.g. `HistorySeparator`, `SearchRowSeparator`) must not be declared inside another component's file

### Formatting

- Single quotes for strings
- No semicolons
- 2 spaces indentation
- Trailing commas always (except JSON files)
- Arrow parens: avoid when single param
- Print width: 100 characters
- JSX: single quotes, bracket on new line
- Platform-specific line endings (LF on Unix, CRLF on Windows)

### Linting Requirements and Best Practices

When fixing linting errors, follow these guidelines:

1. **Max Lines Limit (130 lines)**:
   - When a file exceeds the 130-line limit, **decompose** code into smaller, focused pieces
   - Extract large components into sub-components
   - Extract complex logic into helper functions/hooks
   - Extract repetitive patterns into utilities
   - **DO NOT** remove blank lines between logical blocks to reduce line count
   - Maintain readability through proper separation of concerns

2. **Duplicate String Warnings**:
   - Extract duplicate strings into named constants at the top of the file
   - Use descriptive names: `TEST_ID`, `SLIDER_ITEM_ID`, `ERROR_MESSAGE`, etc.
   - Place constants before component/function declarations

3. **General Principles**:
   - **Readability first**: Better to have more well-named, focused functions than one monolithic file
   - **Decomposition over compression**: Extract logic rather than remove spacing
   - **Preserve logical separation**: Blank lines between logical blocks are intentional and should be kept

**Example of proper decomposition:**

```typescript
// ❌ BAD: Removing blank lines to fit line limit
const MyComponent = () => {
  const data = fetchData()
  const transformed = transformData(data)
  const filtered = filterData(transformed)
  return <List items={filtered} />
}

// ✅ GOOD: Decomposing into focused functions
const useFilteredData = () => {
  const data = fetchData()

  const transformed = transformData(data)

  return filterData(transformed)
}

export const MyComponent = () => {
  const filteredData = useFilteredData()

  return <List items={filteredData} />
}
```

1. **Lint-fix escalation** (strictly in this order):
   - `yarn lint:fix` — auto-fix everything ESLint can
   - `yarn prettier:write` — formatting pass
   - Whatever still remains — manual fixes by the coding agent (following the decomposition rules above: extract components/helpers, do NOT squeeze lines or remove blank lines)
   - After all steps, run `yarn lint` to verify zero errors remain, then `yarn check:types` to ensure no type errors were introduced

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

### Type Assertions (`as`)

**`as` type assertions are BANNED in production code (`src/`).** Type mismatches must be fixed at boundaries, not bypassed.

**Allowed exceptions:**

- `as const` — compile-time literal narrowing (not a runtime suppression)
- `as unknown` — only as an intermediate step before zod validation (e.g., `JSON.parse(raw) as unknown` before `schema.parse()`)
- `as` in test files (`*.test.ts`, `*.test.tsx`) — acceptable when truly necessary, but minimize even in tests

**What to do instead of `as`:**

1. **Fix at mapper boundaries** — normalize API responses where data enters the domain:

   ```typescript
   // ❌ BAD: null enters the domain, `as` hides it downstream
   artwork: apiSermon.artwork // API may return null

   // ✅ GOOD: normalize at the boundary — honest null, not a fake empty string
   // (domain type is `string | null`; consumers handle null: placeholder, fallback)
   artwork: apiSermon.artwork ?? null
   ```

2. **Construct new objects with narrowed types** instead of casting:

   ```typescript
   // ❌ BAD: `as` hides that SermonData ≠ AudioPlayerData
   return nextTrack as AudioPlayerData

   // ✅ GOOD: construct a new object, TypeScript narrows via truthiness check
   return { ...nextTrack, audioUrl: nextTrack.audioUrl }
   ```

3. **Fix zod schemas** — if a field can be null from the API, declare it honestly with `.nullable()` so the domain type is `string | null`. Do NOT normalize null to a fake value like `''` (empty string is also invalid — it just moves the lie downstream)

**Rationale:** `as` suppresses TypeScript's type checking at runtime. When the assumption behind `as` is wrong (e.g., API returns `null` where the type says `string`), the code compiles but crashes at runtime. This was a root cause of Issue #45 crashes.

### Native Module Boundary

Values passed to native modules must be validated at the JS boundary.

- For URIs use `hasUriProtocol` from `shared/lib/app-icon` — native `java.net.URL` casts throw on protocol-less values (`MalformedURLException`).
- Wrap native calls that can throw in try-catch + `reportError`. Cosmetic features (lock screen artwork, metadata) must never crash the app.
- expo-asset: `asset.uri`/`asset.localUri` may be bare asset names in release builds — validate before use.
- AsyncStorage data survives app updates — treat stored values as untrusted legacy input; validate at the read boundary.

**Rationale:** Issue #45 crash loop (protocol-less `assets_fallbackartwork` → `MalformedURLException` → uncaught throw → fatal). See [`docs/contracts/native-modules.md`](docs/contracts/native-modules.md).

### Styling

```typescript
// Use StyleSheet.create for styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
})

// Use themed constants from shared/ui/theme
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'
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
// NOTE: export default is ONLY allowed in app/ folder for Expo Router
export { ListenScreen as default } from 'pages/listen'

// src/pages/listen/ui.tsx
// NOTE: Use named exports, NOT default exports in src/ folder
export const ListenScreen = () => {
  // component implementation
}

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
    // Prefer accessibility queries (text, role, label) over testID
    const { getByRole } = render(<PlayerControls {...props} />)
    expect(getByRole('button', { name: /play/i })).toBeTruthy()
  })
})
```

### Testing Guidelines

- **Prefer accessibility queries over `testID`**: query elements by text (`getByText`), role/label (`getByRole`, `getByLabelText`, `aria-label`) first. Avoid `testID` — it duplicates identity already expressed via accessible name/role and doesn't verify real accessibility. `testID` is acceptable only when text/role genuinely don't apply (e.g., an unnamed container without text)
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
- **HTTP:** axios
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
2. **Generated API Code:** `src/shared/api/generated/` is auto-generated and includes:
   - Axios API functions (auth, sermons, playlists, sections, files, users)
   - Zod schemas for runtime validation
   - MSW mocks for development
   - TypeScript types (exported as APITypes)
3. **Reanimated v4 worklets:** never call JS-side functions (React state setters, callbacks) synchronously from worklet/animation callbacks (`withTiming` completion, `useAnimatedReaction`, gesture handlers) — it throws "Tried to synchronously call a Remote Function". Use `scheduleOnRN` from `react-native-worklets`. `runOnJS` is DEPRECATED — do not use it in new code (see docs/conventions.md).

## API Usage

The project uses Orval for API code generation. The generated API is located in `src/shared/api/generated/` and includes:

- **APITypes**: All TypeScript types from the OpenAPI schema
- **API Functions**: Axios-wrapped functions for all endpoints
- **Zod Schemas**: Runtime validation schemas
- **MSW Mocks**: Mock Service Worker handlers for development

### Example Usage

```typescript
import { API } from 'shared/api'
import type { APITypes } from 'shared/api/generated'

// Use generated API functions
const result = await API.getAllSermons()

// Use types
const sermon: APITypes.SermonEntity = result.data.sermons[0]

// Use Zod schemas for validation
import { createSermonBody } from 'shared/api/generated/API'
const validated = createSermonBody.parse(sermonData)
```

### Token Management

The project uses AsyncStorage for token storage with automatic refresh token mechanism:

```typescript
import { tokenStorage } from 'shared/api/axiosInstance'

// Set tokens
await tokenStorage.setTokens(accessToken, refreshToken)

// Get access token
const token = await tokenStorage.getAccessToken()

// Clear tokens (logout)
await tokenStorage.clearTokens()
```

3. **FSD Insignificant Slice:** Rule set to 'warn' - single-use features should be relocated eventually
4. **No Semicolons:** Project uses no semicolons, enforced by ESLint
5. **React 19:** Project uses React 19.2.0
6. **Expo SDK 57:** Using Expo SDK ~57.0.8

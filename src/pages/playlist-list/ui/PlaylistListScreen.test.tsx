import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { dynamicSectionsAtom } from 'entities/section'
import { renderWithProviders } from 'shared/mocks'
import type { PlaylistData, SectionData } from 'shared/model'
import { PlaylistListScreen } from './PlaylistListScreen'

const mockPush = jest.fn()
const mockParams: { sectionId?: string } = {}
const mockResolveSectionFromCache = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('entities/section', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
  }
})

jest.mock('shared/ui/collapsing-navbar-driver', () => ({
  useCollapsingNavbarDriver: jest.fn(() => ({ headerBgOpacity: 0 })),
}))

jest.mock('../lib/useCollapsingHeader', () => ({
  useCollapsingHeader: () => ({
    darkenStart: { value: 0 },
    headerHeight: 100,
    onTitleLayout: jest.fn(),
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
    titleAppearThreshold: { value: Number.MAX_SAFE_INTEGER },
  }),
}))

jest.mock('../lib/resolveSectionFromCache', () => ({
  resolveSectionFromCache: (...args: unknown[]) => mockResolveSectionFromCache(...args),
}))

jest.mock('shared/ui', () => {
  const { Text, View } = jest.requireActual('react-native')

  return {
    CoverImage: () => <View />,
    MarqueeText: ({ text }: { text: string }) => <Text>{text}</Text>,
  }
})

// The global reanimated mock (jest.setup) does not expose Animated.FlatList,
// which PlaylistListScreen renders. Extend it with the real FlatList.
jest.mock('react-native-reanimated', () => {
  const { FlatList, View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    cancelAnimation: () => {},
    createAnimatedComponent: (Component: unknown) => Component,
    default: {
      createAnimatedComponent: (Component: unknown) => Component,
      FlatList,
      View,
    },
    Easing: {
      in: (fn: (t: number) => number) => fn,
      inOut: (fn: (t: number) => number) => fn,
      linear: () => 'linear',
      out: (fn: (t: number) => number) => fn,
      sin: () => 'sin',
    },
    interpolate: (p: number) => p,
    ReduceMotion: { Always: 'always', Never: 'never', System: 'system' },
    useAnimatedProps: (fn: unknown) => (typeof fn === 'function' ? fn() : {}),
    useAnimatedReaction: () => {},
    useAnimatedStyle: (fn: unknown) => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: (fn: unknown) => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useSharedValue: <T,>(init: T) => ({ value: init }),
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: jest.fn((toValue, _config, callback) => {
      if (typeof callback === 'function') callback(true)
      return toValue
    }),
  }
})

const SECTION_ID = 'section-1'
const SECTION_TITLE = 'Раздел проповедей'
const PLAYLIST_ID = 'playlist-1'
const PLAYLIST_TITLE = 'Плейлист о вере'
const CACHED_SECTION_ID = 'cached-section'
const CACHED_SECTION_TITLE = 'Кэшированный раздел'
const SECTION_NOT_FOUND_TEXT = 'Секция не найдена'
const EMPTY_PLAYLISTS_TEXT = 'Нет плейлистов'

const makePlaylist = (id: string, title: string): PlaylistData => ({
  artwork: null,
  id,
  sermons: [],
  title,
})

const makeSection = (overrides: Partial<SectionData> = {}): SectionData => ({
  id: SECTION_ID,
  itemsSize: 'small',
  playlists: [makePlaylist(PLAYLIST_ID, PLAYLIST_TITLE)],
  title: SECTION_TITLE,
  transform: 'short',
  ...overrides,
})

describe('<PlaylistListScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.sectionId = SECTION_ID
  })

  test('renders the section title and its playlists', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])

    const { getByText } = await renderWithProviders(<PlaylistListScreen />, { ctx })

    expect(getByText(SECTION_TITLE)).toBeTruthy()
    expect(getByText(PLAYLIST_TITLE)).toBeTruthy()
  })

  test('navigates to the playlist screen with the playlist id on press', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])

    const { getByText } = await renderWithProviders(<PlaylistListScreen />, { ctx })

    await fireEvent.press(getByText(PLAYLIST_TITLE))

    expect(mockPush).toHaveBeenCalledWith({
      params: { playlist: PLAYLIST_ID },
      pathname: '/listen/playlist',
    })
  })

  test('shows the empty state when the section has no playlists', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection({ playlists: [] })])

    const { getByText } = await renderWithProviders(<PlaylistListScreen />, { ctx })

    expect(getByText(EMPTY_PLAYLISTS_TEXT)).toBeTruthy()
  })

  test('shows the not-found state when the section is missing after cache resolution', async () => {
    mockResolveSectionFromCache.mockResolvedValue(undefined)
    mockParams.sectionId = 'missing-section'

    const { findByText } = await renderWithProviders(<PlaylistListScreen />)

    expect(await findByText(SECTION_NOT_FOUND_TEXT)).toBeTruthy()
  })

  test('keeps the screen in a loading state while resolving the section from cache', async () => {
    let resolveCache!: (section?: SectionData) => void
    mockResolveSectionFromCache.mockReturnValue(
      new Promise(resolve => {
        resolveCache = resolve
      }),
    )
    mockParams.sectionId = CACHED_SECTION_ID

    const { container, queryByText } = await renderWithProviders(<PlaylistListScreen />)

    // RN 0.86 ActivityIndicator does not set accessibilityRole, so query the host element directly
    const spinner = container.queryAll(node => node.type === 'ActivityIndicator')
    expect(spinner).toHaveLength(1)
    expect(queryByText(SECTION_NOT_FOUND_TEXT)).toBeNull()

    await act(async () => {
      resolveCache(makeSection({ id: CACHED_SECTION_ID, title: CACHED_SECTION_TITLE }))
    })

    expect(queryByText(CACHED_SECTION_TITLE)).toBeTruthy()
  })

  test('renders the section resolved from cache when it is not in the atom', async () => {
    const cachedSection = makeSection({ id: CACHED_SECTION_ID, title: CACHED_SECTION_TITLE })
    mockResolveSectionFromCache.mockResolvedValue(cachedSection)
    mockParams.sectionId = CACHED_SECTION_ID

    const { findByText } = await renderWithProviders(<PlaylistListScreen />)

    expect(await findByText(CACHED_SECTION_TITLE)).toBeTruthy()
  })
})

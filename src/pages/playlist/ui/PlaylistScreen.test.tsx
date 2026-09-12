import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { type ComponentType } from 'react'
import { View as RNView } from 'react-native'
import { dynamicSectionsAtom } from 'entities/section'
import { renderWithProviders } from 'shared/mocks'
import {
  type AudioPlayerData,
  isOnlineAtom,
  type PlaylistData,
  type SectionData,
  toAudioPlayerData,
} from 'shared/model'
import { PlaylistScreen } from './PlaylistScreen'

/* ── Mocks ─────────────────────────────────────────────────────────── */

const mockParams: { playlist?: string } = { playlist: 'pl-1' }
const mockSetOptions = jest.fn()
const mockResolvePlaylistFromCache = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ setOptions: mockSetOptions }),
}))

jest.mock('expo-router/react-navigation', () => ({
  useHeaderHeight: () => 100,
}))

jest.mock('entities/section', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom') }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'testCurrentAudioAtom'),
    downloadingAudioUrlAtom: atom(null, 'testDownloadingAudioUrlAtom'),
    isPlayingAtom: atom(false, 'testIsPlayingAtom'),
    usePlayNewSermon: jest.fn(() => jest.fn()),
  }
})

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => []),
  useHistoryProgressMap: jest.fn(() => new Map()),
  useHistorySermonIds: jest.fn(() => new Set()),
}))

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      isCached: jest.fn().mockResolvedValue(false),
    },
  }
})

jest.mock('../lib/PlaylistCacheService', () => ({
  playlistCacheService: {
    cachePlaylist: jest.fn().mockResolvedValue(undefined),
    cancelPlaylistCache: jest.fn(),
    clearError: jest.fn(),
    getError: jest.fn(() => null),
  },
}))

jest.mock('shared/ui', () => {
  const { View } = jest.requireActual('react-native')
  return { CoverImage: () => <View /> }
})

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurTargetView: View, BlurView: View }
})

// Мок визуализирует связку props (downloadingUrl === audioUrl); политика matching'а тестируется в useTrackItemCache.test.
jest.mock('shared/ui/track-list', () => {
  const { Pressable, Text, View } = jest.requireActual('react-native')
  return {
    createTracksListStyles: () => ({ container: {}, divider: {} }),
    TracksListItem: (props: {
      audioUrl?: null | string
      downloadingUrl?: null | string
      isAudioPlaying?: boolean
      onPress?: () => void
      title: string
    }) => (
      <Pressable onPress={props.onPress} testID='tracks-list-item'>
        <View>
          <Text>{props.title}</Text>
          {props.downloadingUrl && props.downloadingUrl === props.audioUrl && (
            <Text testID='downloading-indicator'>{props.downloadingUrl}</Text>
          )}
          {props.isAudioPlaying && <Text testID={`playing-indicator-${props.title}`}>playing</Text>}
        </View>
      </Pressable>
    ),
  }
})

jest.mock('../lib/resolvePlaylistFromCache', () => ({
  resolvePlaylistFromCache: (...args: unknown[]) => mockResolvePlaylistFromCache(...args),
}))

jest.mock('shared/ui/collapsing-navbar-driver', () => ({
  useCollapsingNavbarDriver: () => ({ headerBgOpacity: 0 }),
}))

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
    useAnimatedScrollHandler: () => jest.fn(),
    useAnimatedStyle: (fn: unknown) => (typeof fn === 'function' ? fn() : {}),
    useDerivedValue: (fn: unknown) => ({ value: typeof fn === 'function' ? fn() : undefined }),
    useSharedValue: <T,>(init: T) => ({ value: init }),
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    withTiming: jest.fn((toValue: unknown) => toValue),
  }
})

/* ── Fixtures ─────────────────────────────────────────────────────── */

const PLAYLIST_ID = 'pl-1'
const PLAYLIST_TITLE = 'Плейлист о вере'
const SECTION_ID = 'section-1'
const SECTION_TITLE = 'Раздел'
const NOT_FOUND_TEXT = 'Плейлист не найден'
const EMPTY_TEXT = 'В плейлисте нет записей'
const PLAY_ALL_TEXT = 'Воспроизвести все'
const CACHE_ALL_TEXT = 'Закешировать все'
const CACHE_ALL_CONFIRM_TEXT = 'Закешировать весь плейлист'
const CACHE_DIALOG_TITLE = 'Кеширование плейлиста'
const CLEAR_CACHE_TEXT = 'Удалить из кеша все'
const MENU_BUTTON_TEST_ID = 'playlist-header-menu'
const PLAYING_INDICATOR_PREFIX = 'playing-indicator-'

const SERMON_1 = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://example.com/1.mp3',
  id: 'sermon-1',
  title: 'Первая проповедь',
}

const SERMON_2 = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://example.com/2.mp3',
  id: 'sermon-2',
  title: 'Вторая проповедь',
}

const PLAYLIST: PlaylistData = {
  artwork: null,
  description: 'Описание плейлиста',
  id: PLAYLIST_ID,
  sermons: [SERMON_1, SERMON_2],
  title: PLAYLIST_TITLE,
}

const makeSection = (overrides: Partial<SectionData> = {}): SectionData => ({
  id: SECTION_ID,
  itemsSize: 'small',
  playlists: [PLAYLIST],
  title: SECTION_TITLE,
  transform: 'short',
  ...overrides,
})

/* ── Helpers ───────────────────────────────────────────────────────── */

const renderScreen = async (ctx?: ReturnType<typeof createCtx>) => {
  const c = ctx ?? createCtx()
  return renderWithProviders(<PlaylistScreen />, { ctx: c })
}

const renderHeaderMenu = async (ctx: ReturnType<typeof createCtx>) => {
  const headerRightCall = mockSetOptions.mock.calls.find(
    ([opts]: [{ headerRight?: unknown }]) => typeof opts.headerRight === 'function',
  )
  if (!headerRightCall) throw new Error('headerRight was not set via navigation options')
  const HeaderRight = headerRightCall[0].headerRight as ComponentType
  return renderWithProviders(<HeaderRight />, { ctx })
}

/* ── Tests ─────────────────────────────────────────────────────────── */

describe('<PlaylistScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.playlist = PLAYLIST_ID
  })

  test('renders the playlist title and its tracks', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])

    const { getByText } = await renderScreen(ctx)

    expect(getByText(PLAYLIST_TITLE)).toBeTruthy()
    expect(getByText(SERMON_1.title)).toBeTruthy()
    expect(getByText(SERMON_2.title)).toBeTruthy()
  })

  test('shows the not-found state when the playlist param is missing', async () => {
    mockParams.playlist = undefined

    const { getByText } = await renderScreen()

    expect(getByText(NOT_FOUND_TEXT)).toBeTruthy()
  })

  test('shows the not-found state when the playlist id is unknown', async () => {
    mockParams.playlist = 'missing-playlist'
    mockResolvePlaylistFromCache.mockResolvedValue(undefined)

    const { findByText } = await renderScreen()

    expect(await findByText(NOT_FOUND_TEXT)).toBeTruthy()
  })

  test('keeps the loading state while resolving the playlist from cache', async () => {
    mockParams.playlist = 'cached-playlist'
    let resolveCache!: (p?: PlaylistData) => void
    mockResolvePlaylistFromCache.mockReturnValue(
      new Promise(resolve => {
        resolveCache = resolve
      }),
    )

    const { container, queryByText } = await renderScreen()
    const spinner = container.queryAll(node => node.type === 'ActivityIndicator')
    expect(spinner).toHaveLength(1)
    expect(queryByText(NOT_FOUND_TEXT)).toBeNull()

    await act(async () => {
      resolveCache(PLAYLIST)
    })

    expect(queryByText(PLAYLIST_TITLE)).toBeTruthy()
  })

  test('renders the playlist resolved from cache', async () => {
    mockParams.playlist = 'cached-playlist'
    mockResolvePlaylistFromCache.mockResolvedValue(PLAYLIST)

    const { findByText } = await renderScreen()

    expect(await findByText(PLAYLIST_TITLE)).toBeTruthy()
    expect(await findByText(SERMON_1.title)).toBeTruthy()
  })

  test('plays the tapped sermon with the playlist', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const playNewSermon = jest.fn()
    jest
      .mocked(jest.requireMock('entities/player').usePlayNewSermon as () => jest.Mock)
      .mockReturnValue(playNewSermon)

    const { getByText } = await renderScreen(ctx)
    await fireEvent.press(getByText(SERMON_1.title))

    expect(playNewSermon).toHaveBeenCalledWith({ playlist: PLAYLIST, sermon: SERMON_1 })
  })

  test('play-all plays the first playable sermon', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const playNewSermon = jest.fn()
    jest
      .mocked(jest.requireMock('entities/player').usePlayNewSermon as () => jest.Mock)
      .mockReturnValue(playNewSermon)

    const { getByText } = await renderScreen(ctx)
    await fireEvent.press(getByText(PLAY_ALL_TEXT))

    expect(playNewSermon).toHaveBeenCalledWith({ playlist: PLAYLIST, sermon: SERMON_1 })
  })

  test('sets the header right menu via navigation options', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])

    await renderScreen(ctx)

    const hasHeaderRight = mockSetOptions.mock.calls.some(
      ([opts]: [{ headerRight?: unknown }]) => typeof opts.headerRight === 'function',
    )
    expect(hasHeaderRight).toBe(true)
  })

  test('passes the downloading url to the matching track item', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const { downloadingAudioUrlAtom } = jest.requireMock('entities/player') as {
      downloadingAudioUrlAtom: (ctx: unknown, v: null | string) => unknown
    }

    const { queryByText } = await renderScreen(ctx)
    expect(queryByText(SERMON_1.audioUrl)).toBeNull()

    await act(async () => {
      downloadingAudioUrlAtom(ctx, SERMON_1.audioUrl)
    })

    expect(queryByText(SERMON_1.audioUrl)).toBeTruthy()
    expect(queryByText(SERMON_2.audioUrl)).toBeNull()
  })

  test('shows the empty state when the playlist has no sermons', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection({ playlists: [{ ...PLAYLIST, sermons: [] }] })])

    const { getByText } = await renderScreen(ctx)

    expect(getByText(EMPTY_TEXT)).toBeTruthy()
  })

  test('shows the playing indicator only on the active track while playing', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const { currentAudioAtom, isPlayingAtom } = jest.requireMock('entities/player') as {
      currentAudioAtom: (ctx: unknown, v: AudioPlayerData | null) => unknown
      isPlayingAtom: (ctx: unknown, v: boolean) => unknown
    }

    const { getByTestId, queryByTestId } = await renderScreen(ctx)

    await act(async () => {
      currentAudioAtom(ctx, toAudioPlayerData(SERMON_1))
    })

    expect(queryByTestId(`${PLAYING_INDICATOR_PREFIX}${SERMON_1.title}`)).toBeNull()

    await act(async () => {
      isPlayingAtom(ctx, true)
    })

    expect(getByTestId(`${PLAYING_INDICATOR_PREFIX}${SERMON_1.title}`)).toBeTruthy()
    expect(queryByTestId(`${PLAYING_INDICATOR_PREFIX}${SERMON_2.title}`)).toBeNull()
  })
})

describe('<PlaylistScreen> header menu integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.playlist = PLAYLIST_ID
    jest.spyOn(RNView.prototype, 'measureInWindow').mockImplementation(cb => {
      cb(300, 100, 44, 44)
      return undefined
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const openHeaderMenu = async (ctx: ReturnType<typeof createCtx>) => {
    const menu = await renderHeaderMenu(ctx)
    await fireEvent.press(menu.getByTestId(MENU_BUTTON_TEST_ID))
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    return menu
  }

  test('renders the header menu with cache options', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])

    await renderScreen(ctx)
    const menu = await openHeaderMenu(ctx)

    expect(menu.getByText(CACHE_ALL_TEXT)).toBeTruthy()
    expect(menu.getByText(CLEAR_CACHE_TEXT)).toBeTruthy()
  })

  test('disables cache-all in the header menu when offline', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    isOnlineAtom(ctx, false)

    await renderScreen(ctx)
    const menu = await openHeaderMenu(ctx)

    await fireEvent(menu.getByText(CACHE_ALL_TEXT), 'touchEnd')

    expect(menu.queryByText(CACHE_DIALOG_TITLE)).toBeNull()
  })

  test('cache-all confirm starts caching the playlist', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const { playlistCacheService } = jest.requireMock('../lib/PlaylistCacheService') as {
      playlistCacheService: { cachePlaylist: jest.Mock }
    }

    await renderScreen(ctx)
    const menu = await openHeaderMenu(ctx)

    await fireEvent(menu.getByText(CACHE_ALL_TEXT), 'touchEnd')
    expect(menu.getByText(CACHE_DIALOG_TITLE)).toBeTruthy()

    await fireEvent.press(menu.getByText(CACHE_ALL_CONFIRM_TEXT))

    expect(playlistCacheService.cachePlaylist).toHaveBeenCalledTimes(1)
    const [ctxArg, tracks, title] = playlistCacheService.cachePlaylist.mock.calls[0]
    expect(ctxArg).toBe(ctx)
    expect(tracks).toEqual([
      expect.objectContaining({
        audioUrl: SERMON_1.audioUrl,
        id: SERMON_1.id,
        title: SERMON_1.title,
      }),
      expect.objectContaining({
        audioUrl: SERMON_2.audioUrl,
        id: SERMON_2.id,
        title: SERMON_2.title,
      }),
    ])
    expect(title).toBe(PLAYLIST_TITLE)
  })
})

import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { type ComponentType } from 'react'
import { useTourActionRegistrar } from 'features/onboarding'
import {
  FAVORITES_PLAYLIST,
  myPlaylistsAtom,
  myPlaylistsLoadedAtom,
  type PlaylistData,
} from 'entities/playlist'
import { dynamicSectionsAtom, type SectionData } from 'entities/section'
import { type AudioPlayerData, toAudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { isOnlineAtom } from 'shared/model'
import { PlaylistScreen } from './PlaylistScreen'

/* ── Mocks ─────────────────────────────────────────────────────────── */

const mockParams: {
  custom?: string
  playlist?: string
  sermons?: string
  title?: string
} = { playlist: 'pl-1' }
const mockSetOptions = jest.fn()
const mockReplace = jest.fn()
const mockResolvePlaylistFromCache = jest.fn()
const mockTogglePlaylistSermon = jest.fn()
const mockUseIsLocalPlaylist = jest.fn()
const mockOpenAddAllToPlaylist = jest.fn()
const mockOpenAddToPlaylist = jest.fn()

// The tour drives the row menu through the screen's registrations; the modal
// itself is irrelevant here, so keep it unmounted and spy on the open handler.
jest.mock('features/add-to-playlist', () => ({
  useAddToPlaylistModal: () => ({
    modal: null,
    openAddAllToPlaylist: mockOpenAddAllToPlaylist,
    openAddToPlaylist: mockOpenAddToPlaylist,
  }),
}))

// Keep the real onboarding UI (the first row's target wrapper) but spy on the
// action registrar so tests can invoke what the tour would perform.
jest.mock('features/onboarding', () => {
  const actual = jest.requireActual('features/onboarding')
  return { ...actual, useTourActionRegistrar: jest.fn() }
})

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ setOptions: mockSetOptions }),
  usePathname: () => '/listen',
  useRouter: () => ({ replace: mockReplace, setParams: jest.fn() }),
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
    currentPlaylistAtom: atom(null, 'testCurrentPlaylistAtom'),
    durationAtom: atom(0, 'testDurationAtom'),
    isPlayingAtom: atom(false, 'testIsPlayingAtom'),
    positionAtom: atom(0, 'testPositionAtom'),
    // usePlaylistClearMenu wraps this via useAction; the real close-player path
    // is covered by the entity tests, so a no-op is enough here.
    resetPlaybackAction: jest.fn(),
    usePlayNewSermon: jest.fn(() => jest.fn()),
  }
})

jest.mock('entities/listening-history', () => {
  const actual = jest.requireActual('entities/listening-history')
  return {
    ...actual,
    buildHistoryMenuActions: jest.fn(() => []),
    flushHistoryProgressAction: jest.fn(),
    useHistoryProgressMap: jest.fn(() => new Map()),
    useHistorySermonIds: jest.fn(() => new Set()),
  }
})

jest.mock('entities/playlist', () => {
  const { action } = jest.requireActual('@reatom/framework')
  const actual = jest.requireActual('entities/playlist')
  return {
    ...actual,
    // The screen hydrates myPlaylistsAtom on mount; a no-op keeps the seeded atom
    // intact so reload tests can craft the stored state explicitly.
    loadMyPlaylists: action(() => Promise.resolve([]), 'loadMyPlaylistsMock'),
    togglePlaylistSermon: (...args: unknown[]) => mockTogglePlaylistSermon(...args),
    useIsLocalPlaylist: (id: string) => mockUseIsLocalPlaylist(id),
  }
})

jest.mock('entities/offline-cache', () => {
  const actual = jest.requireActual('entities/offline-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      isCached: jest.fn().mockResolvedValue(false),
    },
    useTrackItemCache: jest.fn(() => ({
      isCached: false,
      isCacheDisabled: false,
      isDownloading: false,
      isQueued: false,
      isSermonCachingEnabled: true,
      progressValue: -1,
      toggleCache: jest.fn(),
      visualState: 'cloud',
    })),
  }
})

jest.mock('../lib/PlaylistOfflineService', () => ({
  playlistOfflineService: {
    addPlaylistToOffline: jest.fn().mockResolvedValue(undefined),
    cancelPlaylistOfflineAdd: jest.fn(),
    clearError: jest.fn(),
    getError: jest.fn(() => null),
  },
}))

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { View } = jest.requireActual('react-native')
  return { ...actual, CoverImage: () => <View /> }
})

jest.mock('shared/ui/menu', () => {
  const { View: MockView } = jest.requireActual('react-native')
  return {
    AnchoredDropdown: ({
      children,
      onClose,
      visible,
    }: {
      children: React.ReactNode
      onClose: () => void
      visible: boolean
    }) => {
      if (!visible) return null
      return (
        <MockView testID='anchored-dropdown'>
          <MockView testID='backdrop' onTouchEnd={onClose} />
          {children}
        </MockView>
      )
    },
  }
})

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurTargetView: View, BlurView: View }
})

jest.mock('entities/track-list', () => {
  const { Fragment, useEffect, useState } = jest.requireActual('react')
  const { Pressable, Text, View } = jest.requireActual('react-native')
  return {
    createTracksListStyles: () => ({ container: {}, divider: {} }),
    TracksListItem: ({
      bindMenuOpener,
      isAudioPlaying,
      menuActions,
      onPress,
      renderMenuItem,
      title,
    }: {
      audioUrl?: null | string
      bindMenuOpener?: (controls: { close: () => void; open: () => void }) => void
      isAudioPlaying?: boolean
      menuActions?: Array<{ onboardingTargetId?: string; onPress: () => void; text: string }>
      onPress?: () => void
      renderMenuItem?: (row: React.ReactNode, item: object) => React.ReactNode
      title: string
    }) => {
      const [isMenuOpen, setIsMenuOpen] = useState(false)

      useEffect(() => {
        bindMenuOpener?.({
          close: () => setIsMenuOpen(false),
          open: () => setIsMenuOpen(true),
        })
      }, [bindMenuOpener])

      return (
        <Pressable onPress={onPress} testID='tracks-list-item'>
          <View>
            <Text>{title}</Text>
            {menuActions?.map(action => {
              const row = (
                <Pressable onPress={action.onPress}>
                  <Text>{action.text}</Text>
                </Pressable>
              )
              return (
                <Fragment key={action.text}>
                  {renderMenuItem ? renderMenuItem(row, action) : row}
                </Fragment>
              )
            })}
            {isMenuOpen && <Text>row-menu-open</Text>}
            {isAudioPlaying && <Text testID={`playing-indicator-${title}`}>playing</Text>}
          </View>
        </Pressable>
      )
    },
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
    makeMutable: <T,>(init: T) => ({ value: init }),
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
const EMPTY_TEXT = 'Этот плейлист пустой'
const PLAY_ALL_TEXT = 'Начать прослушивание плейлиста'
const ADD_ALL_TO_OFFLINE_TEXT = 'Добавить все в офлайн'
const ADD_ALL_TO_OFFLINE_CONFIRM_TEXT = 'Добавить весь плейлист в офлайн'
const CACHE_DIALOG_TITLE = 'Добавление плейлиста в офлайн'
const CLEAR_CACHE_TEXT = 'Удалить из офлайн все'
const MENU_BUTTON_LABEL = 'Меню плейлиста'
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
  // The resolver suppresses notFound until myPlaylistsAtom is hydrated; the
  // screen's mount hydration is mocked to a no-op, so mark it loaded here.
  myPlaylistsLoadedAtom(c, true)
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

beforeEach(() => {
  mockUseIsLocalPlaylist.mockReturnValue(false)
})

describe('<PlaylistScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.playlist = PLAYLIST_ID
    delete mockParams.custom
    delete mockParams.sermons
    delete mockParams.title
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

  test('keeps the loading state instead of not-found while a custom link imports', async () => {
    mockParams.playlist = undefined
    mockParams.custom = ''

    const { container, queryByText } = await renderScreen()
    const spinner = container.queryAll(node => node.type === 'ActivityIndicator')
    expect(spinner).toHaveLength(1)
    expect(queryByText(NOT_FOUND_TEXT)).toBeNull()
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

  test('disables play-all when the playlist has nothing playable', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection({ playlists: [{ ...PLAYLIST, sermons: [] }] })])
    const playNewSermon = jest.fn()
    jest
      .mocked(jest.requireMock('entities/player').usePlayNewSermon as () => jest.Mock)
      .mockReturnValue(playNewSermon)

    const { getByRole, getByText } = await renderScreen(ctx)
    expect(getByText(PLAY_ALL_TEXT)).toBeTruthy()

    const playAllButton = getByRole('button')

    await fireEvent.press(playAllButton)

    expect(playAllButton).toBeDisabled()
    expect(playAllButton).toHaveStyle({ opacity: 0.5 })
    expect(playNewSermon).not.toHaveBeenCalled()
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

describe('<PlaylistScreen> row-menu tour actions', () => {
  const OPEN_ROW_MENU_ACTION = 'open-playlist-row-menu'
  const PRESS_ROW_MENU_ADD_ACTION = 'press-row-menu-add'
  const ROW_MENU_OPEN_TEXT = 'row-menu-open'

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsLocalPlaylist.mockReturnValue(false)
    mockParams.playlist = PLAYLIST_ID
    delete mockParams.custom
  })

  const renderTracks = async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    return renderScreen(ctx)
  }

  const tourAction = (id: string) =>
    jest.mocked(useTourActionRegistrar).mock.calls.find(([actionId]) => actionId === id)?.[1]

  test('registers the row-menu actions and opens the first row menu', async () => {
    const { getByText } = await renderTracks()

    const open = tourAction(OPEN_ROW_MENU_ACTION)
    expect(open).toBeDefined()
    expect(screen.queryByText(ROW_MENU_OPEN_TEXT)).toBeNull()

    await act(async () => {
      open?.()
    })

    expect(getByText(ROW_MENU_OPEN_TEXT)).toBeTruthy()
  })

  test('pressing add closes the row menu and opens the modal for the first sermon', async () => {
    await renderTracks()

    const open = tourAction(OPEN_ROW_MENU_ACTION)
    const pressAdd = tourAction(PRESS_ROW_MENU_ADD_ACTION)
    expect(pressAdd).toBeDefined()

    await act(async () => {
      open?.()
    })
    expect(screen.getByText(ROW_MENU_OPEN_TEXT)).toBeTruthy()

    await act(async () => {
      pressAdd?.()
    })

    expect(mockOpenAddToPlaylist).toHaveBeenCalledWith(SERMON_1)
    expect(screen.queryByText(ROW_MENU_OPEN_TEXT)).toBeNull()
  })
})

describe('<PlaylistScreen> header menu integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.playlist = PLAYLIST_ID
    delete mockParams.custom
    mockMeasureInWindow({ height: 44, width: 44, x: 300, y: 100 })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const openHeaderMenu = async (ctx: ReturnType<typeof createCtx>) => {
    const menu = await renderHeaderMenu(ctx)
    await fireEvent.press(menu.getByRole('button', { name: MENU_BUTTON_LABEL }))
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

    expect(menu.getByText(ADD_ALL_TO_OFFLINE_TEXT)).toBeTruthy()
    expect(menu.getByText(CLEAR_CACHE_TEXT)).toBeTruthy()
  })

  test('disables cache-all in the header menu when offline', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    isOnlineAtom(ctx, false)

    await renderScreen(ctx)
    const menu = await openHeaderMenu(ctx)

    await fireEvent.press(menu.getByText(ADD_ALL_TO_OFFLINE_TEXT))

    expect(menu.queryByText(CACHE_DIALOG_TITLE)).toBeNull()
  })

  test('cache-all confirm starts caching the playlist', async () => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [makeSection()])
    const { playlistOfflineService } = jest.requireMock('../lib/PlaylistOfflineService') as {
      playlistOfflineService: { addPlaylistToOffline: jest.Mock }
    }

    await renderScreen(ctx)
    const menu = await openHeaderMenu(ctx)

    await fireEvent.press(menu.getByText(ADD_ALL_TO_OFFLINE_TEXT))
    expect(menu.getByText(CACHE_DIALOG_TITLE)).toBeTruthy()

    await fireEvent.press(menu.getByText(ADD_ALL_TO_OFFLINE_CONFIRM_TEXT))

    expect(playlistOfflineService.addPlaylistToOffline).toHaveBeenCalledTimes(1)
    const [ctxArg, tracks, title] = playlistOfflineService.addPlaylistToOffline.mock.calls[0]
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

describe('<PlaylistScreen> remove-from-playlist flow', () => {
  const CUSTOM_PLAYLIST_ID = 'custom-abcdef0123456789'
  const REMOVE_MENU_TEXT = 'Удалить из плейлиста'
  const REMOVE_DIALOG_TITLE = 'Удалить из плейлиста?'
  const REMOVE_WARNING_MESSAGE = 'Проповедь будет удалена из этого плейлиста. Плеер будет закрыт.'
  const CHOOSER_TITLE = 'Где продолжить прослушивание?'
  const SKIP_TEXT = 'Закрыть плеер'
  const CANDIDATE_ID = 'other-pl'
  const CANDIDATE_TITLE = 'Другой плейлист'
  const CONFIRM_TEXT = 'Удалить'
  const CANCEL_TEXT = 'Отмена'
  const SUPPRESS_OPTION = { suppressPlayerReset: true }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsLocalPlaylist.mockReturnValue(true)
    mockParams.playlist = CUSTOM_PLAYLIST_ID
    delete mockParams.custom
  })

  const renderLocalPlaylist = async ({ withCandidate = false } = {}) => {
    const ctx = createCtx()
    dynamicSectionsAtom(ctx, [
      makeSection({ playlists: [{ ...PLAYLIST, id: CUSTOM_PLAYLIST_ID }] }),
    ])
    myPlaylistsAtom(ctx, [
      { id: FAVORITES_PLAYLIST.id, sermonIds: [], sermons: [], title: FAVORITES_PLAYLIST.title },
      ...(withCandidate
        ? [
            {
              id: CANDIDATE_ID,
              sermonIds: [SERMON_1.id],
              sermons: [SERMON_1],
              title: CANDIDATE_TITLE,
            },
          ]
        : []),
    ])
    const utils = await renderScreen(ctx)
    return { ...utils, ctx }
  }

  const getPlayerMock = () =>
    jest.requireMock('entities/player') as {
      currentAudioAtom: (ctx: unknown, value: AudioPlayerData | null) => unknown
      currentPlaylistAtom: (ctx: unknown, value: null | PlaylistData) => unknown
      resetPlaybackAction: jest.Mock
      usePlayNewSermon: jest.Mock
    }

  const confirmRemoval = async (
    getByText: (text: string) => Parameters<typeof fireEvent.press>[0],
  ) => {
    await waitFor(() => expect(getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())
    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })
  }

  test('removes the sermon after confirmation via togglePlaylistSermon', async () => {
    const { ctx, getAllByText, getByText, queryByText } = await renderLocalPlaylist()

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])
    await confirmRemoval(getByText)

    expect(mockTogglePlaylistSermon).toHaveBeenCalledWith(
      ctx,
      CUSTOM_PLAYLIST_ID,
      expect.objectContaining({ id: SERMON_1.id }),
      false,
      SUPPRESS_OPTION,
    )
    await waitFor(() => expect(queryByText(REMOVE_DIALOG_TITLE)).toBeNull())
  })

  test('closes the player when the playing sermon has nowhere else to continue', async () => {
    const { ctx, getAllByText, getByText, queryByText } = await renderLocalPlaylist()
    const { currentAudioAtom, currentPlaylistAtom, resetPlaybackAction } = getPlayerMock()
    currentPlaylistAtom(ctx, { ...PLAYLIST, id: CUSTOM_PLAYLIST_ID })
    currentAudioAtom(ctx, toAudioPlayerData(SERMON_1))

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])
    await waitFor(() => expect(getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())
    expect(getByText(REMOVE_WARNING_MESSAGE)).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })

    expect(mockTogglePlaylistSermon).toHaveBeenCalledWith(
      ctx,
      CUSTOM_PLAYLIST_ID,
      expect.objectContaining({ id: SERMON_1.id }),
      false,
      SUPPRESS_OPTION,
    )
    // No candidates → the chooser is skipped and the player resets.
    expect(resetPlaybackAction).toHaveBeenCalledWith(ctx)
    await waitFor(() => expect(queryByText(REMOVE_DIALOG_TITLE)).toBeNull())
  })

  test('offers to continue in another playlist and keeps the player open on pick', async () => {
    const { ctx, getAllByText, getByText } = await renderLocalPlaylist({ withCandidate: true })
    const { currentAudioAtom, currentPlaylistAtom, resetPlaybackAction, usePlayNewSermon } =
      getPlayerMock()
    const playNewSermon = jest.fn()
    usePlayNewSermon.mockReturnValue(playNewSermon)
    currentPlaylistAtom(ctx, { ...PLAYLIST, id: CUSTOM_PLAYLIST_ID })
    currentAudioAtom(ctx, toAudioPlayerData(SERMON_1))

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])
    await confirmRemoval(getByText)

    expect(getByText(CHOOSER_TITLE)).toBeTruthy()
    expect(resetPlaybackAction).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(getByText(CANDIDATE_TITLE))
    })

    expect(playNewSermon).toHaveBeenCalledWith({
      playlist: expect.objectContaining({ id: CANDIDATE_ID }),
      sermon: expect.objectContaining({ id: SERMON_1.id }),
    })
    expect(resetPlaybackAction).not.toHaveBeenCalled()
  })

  test('closing the chooser falls back to closing the player', async () => {
    const { ctx, getAllByText, getByText } = await renderLocalPlaylist({ withCandidate: true })
    const { currentAudioAtom, currentPlaylistAtom, resetPlaybackAction } = getPlayerMock()
    currentPlaylistAtom(ctx, { ...PLAYLIST, id: CUSTOM_PLAYLIST_ID })
    currentAudioAtom(ctx, toAudioPlayerData(SERMON_1))

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])
    await confirmRemoval(getByText)

    await act(async () => {
      fireEvent.press(getByText(SKIP_TEXT))
    })

    expect(resetPlaybackAction).toHaveBeenCalledWith(ctx)
  })

  test('does not offer to continue when another playlist is current', async () => {
    const { ctx, getAllByText, getByText, queryByText } = await renderLocalPlaylist({
      withCandidate: true,
    })
    const { currentAudioAtom, currentPlaylistAtom, resetPlaybackAction } = getPlayerMock()
    currentPlaylistAtom(ctx, { ...PLAYLIST, id: 'another-playlist' })
    currentAudioAtom(ctx, toAudioPlayerData(SERMON_1))

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])
    await waitFor(() => expect(getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())
    expect(queryByText(REMOVE_WARNING_MESSAGE)).toBeNull()

    await act(async () => {
      fireEvent.press(getByText(CONFIRM_TEXT))
    })

    expect(mockTogglePlaylistSermon).toHaveBeenCalledTimes(1)
    expect(queryByText(CHOOSER_TITLE)).toBeNull()
    expect(resetPlaybackAction).not.toHaveBeenCalled()
  })

  test('does not remove the sermon when the confirmation is cancelled', async () => {
    const { getAllByText, getByText, queryByText } = await renderLocalPlaylist()

    fireEvent.press(getAllByText(REMOVE_MENU_TEXT)[0])

    await waitFor(() => expect(getByText(REMOVE_DIALOG_TITLE)).toBeTruthy())

    await act(async () => {
      fireEvent.press(getByText(CANCEL_TEXT))
    })

    expect(mockTogglePlaylistSermon).not.toHaveBeenCalled()
    await waitFor(() => expect(queryByText(REMOVE_DIALOG_TITLE)).toBeNull())
  })
})

describe('<PlaylistScreen> custom share link and reload', () => {
  const CUSTOM_TITLE = 'Импортированный плейлист'
  const CUSTOM_ID = 'custom-abcdef0123456789'

  beforeEach(() => {
    jest.clearAllMocks()
    delete mockParams.custom
    delete mockParams.sermons
    delete mockParams.title
  })

  test('imports a custom link, renders it, and never rewrites the route', async () => {
    mockParams.playlist = undefined
    mockParams.custom = ''
    mockParams.sermons = SERMON_1.id
    mockParams.title = CUSTOM_TITLE

    const { findByText } = await renderScreen()

    expect(await findByText(CUSTOM_TITLE)).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  test('renders a stored custom playlist on reload without not-found', async () => {
    mockParams.playlist = CUSTOM_ID
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [
      { id: FAVORITES_PLAYLIST.id, sermonIds: [], sermons: [], title: FAVORITES_PLAYLIST.title },
      { id: CUSTOM_ID, sermonIds: [SERMON_1.id], sermons: [SERMON_1], title: CUSTOM_TITLE },
    ])

    const { findByText, queryByText } = await renderScreen(ctx)

    expect(await findByText(CUSTOM_TITLE)).toBeTruthy()
    expect(queryByText(NOT_FOUND_TEXT)).toBeNull()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

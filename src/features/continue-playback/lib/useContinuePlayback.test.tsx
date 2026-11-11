import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { durationAtom, positionAtom } from 'entities/player'
import { myPlaylistsAtom, type PlaylistData } from 'entities/playlist'
import { dynamicSectionsAtom, type SectionData } from 'entities/section'
import { type AudioPlayerData } from 'entities/sermon'
import { mockConsole } from 'shared/mocks'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { useContinuePlayback } from './useContinuePlayback'

const mockPlayNewSermon = jest.fn()
const mockFlush = jest.fn()
const mockGetCachedSections = jest.fn()
const mockFindOne = jest.fn()
const mockMapPlaylistEntity = jest.fn()
const mockSermonFindOne = jest.fn()

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    durationAtom: atom(0, 'testDurationAtom'),
    positionAtom: atom(0, 'testPositionAtom'),
    usePlayNewSermon: () => mockPlayNewSermon,
  }
})

jest.mock('entities/playlist', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    mapPlaylistEntityToPlaylistData: (...args: unknown[]) => mockMapPlaylistEntity(...args),
    myPlaylistsAtom: atom([], 'testMyPlaylistsAtom'),
  }
})

jest.mock('entities/section', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom'),
    getCachedSections: (...args: unknown[]) => mockGetCachedSections(...args),
  }
})

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({
      playlistControllerFindOne: (...args: unknown[]) => mockFindOne(...args),
    }),
  },
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindOne: (...args: unknown[]) => mockSermonFindOne(...args),
    }),
  },
}))

jest.mock('entities/listening-history', () => ({
  flushHistoryProgressAction: (...args: unknown[]) => mockFlush(...args),
}))

const SERMON_ID = 'sermon-1'
const FROM_PLAYLIST_ID = 'source'
const SKIP_TEXT = 'Закрыть плеер'
const UUID = '123e4567-e89b-42d3-a456-426614174000'

const SERMON: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: SERMON_ID,
  title: 'Слово',
}

const lightPlaylist = (id: string, title: string): PlaylistData => ({
  artwork: null,
  id,
  sermons: [],
  title,
})

const serverPlaylist = (id: string, title: string): PlaylistData => ({
  artwork: null,
  id,
  sermons: [SERMON],
  title,
})

const localPlaylist = (id: string, title: string, sermonIds: string[]) => ({
  id,
  sermonIds,
  sermons: [SERMON],
  title,
})

const section = (playlists: PlaylistData[]): SectionData => ({
  id: 'section-1',
  itemsSize: 'small',
  playlists,
  title: 'Раздел',
  transform: 'short',
})

const renderProbe = async () => {
  const ctx = createCtx()
  const result: { current: null | ReturnType<typeof useContinuePlayback> } = { current: null }
  const Probe = () => {
    const value = useContinuePlayback()
    result.current = value
    return value.dialog
  }
  const utils = await renderWithProviders(<Probe />, { ctx })
  return { ...utils, ctx, result }
}

describe('useContinuePlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Real `getCachedSections` always returns a promise; keep the mock shape.
    mockGetCachedSections.mockResolvedValue(undefined)
  })

  test('offers server and local candidates, excluding the source and duplicates', async () => {
    const { ctx, getByText, queryByText, result } = await renderProbe()
    const sermon: AudioPlayerData = {
      ...SERMON,
      playlists: [
        serverPlaylist('srv-a', 'Сервер A'),
        serverPlaylist(FROM_PLAYLIST_ID, 'Источник'),
      ],
    }
    myPlaylistsAtom(ctx, [
      localPlaylist(FROM_PLAYLIST_ID, 'Источник', [SERMON_ID]),
      localPlaylist('srv-a', 'Дубль сервера', [SERMON_ID]),
      localPlaylist('loc-b', 'Локальный B', [SERMON_ID]),
      localPlaylist('loc-c', 'Локальный C', []),
    ])

    await act(async () => {
      result.current?.offer(sermon, FROM_PLAYLIST_ID, jest.fn())
    })

    expect(getByText('Сервер A')).toBeTruthy()
    expect(getByText('Локальный B')).toBeTruthy()
    expect(queryByText('Источник')).toBeNull()
    expect(queryByText('Дубль сервера')).toBeNull()
    expect(queryByText('Локальный C')).toBeNull()
  })

  test('calls onSkip immediately without a dialog when nothing else holds the sermon', async () => {
    const { result } = await renderProbe()
    const onSkip = jest.fn()

    await act(async () => {
      result.current?.offer(SERMON, FROM_PLAYLIST_ID, onSkip)
    })

    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(result.current?.dialog).toBeNull()
  })

  test('picking a playlist continues playback and rewrites the history entry', async () => {
    const { ctx, getByText, queryByText, result } = await renderProbe()
    myPlaylistsAtom(ctx, [localPlaylist('loc-b', 'Локальный B', [SERMON_ID])])
    positionAtom(ctx, 5000)
    durationAtom(ctx, 10000)

    await act(async () => {
      result.current?.offer(SERMON, FROM_PLAYLIST_ID, jest.fn())
    })
    await act(async () => {
      fireEvent.press(getByText('Локальный B'))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({
        playlist: expect.objectContaining({ id: 'loc-b' }),
        sermon: expect.objectContaining({ id: SERMON_ID }),
      }),
    )
    await waitFor(() =>
      expect(mockFlush).toHaveBeenCalledWith(ctx, {
        durationMs: 10000,
        playlist: expect.objectContaining({ id: 'loc-b' }),
        positionMs: 5000,
        sermon: expect.objectContaining({ id: SERMON_ID }),
      }),
    )
    await waitFor(() => expect(queryByText('Локальный B')).toBeNull())
  })

  test('closing the chooser calls the provided onSkip', async () => {
    const { ctx, getByText, result } = await renderProbe()
    myPlaylistsAtom(ctx, [localPlaylist('loc-b', 'Локальный B', [SERMON_ID])])
    const onSkip = jest.fn()

    await act(async () => {
      result.current?.offer(SERMON, FROM_PLAYLIST_ID, onSkip)
    })
    await act(async () => {
      fireEvent.press(getByText(SKIP_TEXT))
    })

    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })

  test('pick resolves a light candidate to the full playlist from loaded sections', async () => {
    const { ctx, getByText, result } = await renderProbe()
    dynamicSectionsAtom(ctx, [section([serverPlaylist('srv-a', 'Сервер A')])])
    const lightSermon: AudioPlayerData = {
      ...SERMON,
      playlists: [lightPlaylist('srv-a', 'Сервер A')],
    }

    await act(async () => {
      result.current?.offer(lightSermon, FROM_PLAYLIST_ID, jest.fn())
    })
    await act(async () => {
      fireEvent.press(getByText('Сервер A'))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({
        playlist: expect.objectContaining({ id: 'srv-a', sermons: [SERMON] }),
        sermon: lightSermon,
      }),
    )
    // The resolved full playlist is flushed into history, not the light ref.
    await waitFor(() =>
      expect(mockFlush).toHaveBeenCalledWith(
        ctx,
        expect.objectContaining({ playlist: expect.objectContaining({ id: 'srv-a' }) }),
      ),
    )
    expect(mockGetCachedSections).not.toHaveBeenCalled()
  })

  test('pick resolves a light candidate via the API for a UUID', async () => {
    const { getByText, result } = await renderProbe()
    const full = serverPlaylist(UUID, 'API плейлист')
    mockFindOne.mockResolvedValue({ id: UUID })
    mockMapPlaylistEntity.mockReturnValue(full)
    const lightSermon: AudioPlayerData = {
      ...SERMON,
      playlists: [lightPlaylist(UUID, 'API плейлист')],
    }

    await act(async () => {
      result.current?.offer(lightSermon, FROM_PLAYLIST_ID, jest.fn())
    })
    await act(async () => {
      fireEvent.press(getByText('API плейлист'))
    })

    await waitFor(() => expect(mockFindOne).toHaveBeenCalledWith(UUID))
    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: full, sermon: lightSermon }),
    )
  })

  test('pick falls back to the light ref when a non-UUID candidate is absent from sections', async () => {
    const { getByText, result } = await renderProbe()
    const lightSermon: AudioPlayerData = {
      ...SERMON,
      playlists: [lightPlaylist('local-custom', 'Неизвестный')],
    }

    await act(async () => {
      result.current?.offer(lightSermon, FROM_PLAYLIST_ID, jest.fn())
    })
    await act(async () => {
      fireEvent.press(getByText('Неизвестный'))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({
        playlist: expect.objectContaining({ id: 'local-custom', sermons: [] }),
        sermon: lightSermon,
      }),
    )
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  test('offer fetches memberships when the sermon has none and offers the result', async () => {
    const { getByText, result } = await renderProbe()
    const serverSermon: AudioPlayerData = { ...SERMON, id: UUID }
    mockSermonFindOne.mockResolvedValue({ playlists: [{ id: 'srv-a' }] })
    mockMapPlaylistEntity.mockReturnValue(serverPlaylist('srv-a', 'Сервер A'))

    await act(async () => {
      result.current?.offer(serverSermon, FROM_PLAYLIST_ID, jest.fn())
    })

    expect(mockSermonFindOne).toHaveBeenCalledTimes(1)
    expect(mockSermonFindOne).toHaveBeenCalledWith(UUID)
    expect(getByText('Сервер A')).toBeTruthy()
  })

  test('offer skips when the membership fetch fails', async () => {
    mockConsole('warn')
    const { result } = await renderProbe()
    const serverSermon: AudioPlayerData = { ...SERMON, id: UUID }
    mockSermonFindOne.mockRejectedValue(new Error('offline'))
    const onSkip = jest.fn()

    await act(async () => {
      result.current?.offer(serverSermon, FROM_PLAYLIST_ID, onSkip)
    })

    expect(mockSermonFindOne).toHaveBeenCalledTimes(1)
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(result.current?.dialog).toBeNull()
  })

  test('offer skips a non-UUID sermon without a membership fetch', async () => {
    const { result } = await renderProbe()
    const onSkip = jest.fn()

    await act(async () => {
      result.current?.offer(SERMON, FROM_PLAYLIST_ID, onSkip)
    })

    expect(mockSermonFindOne).not.toHaveBeenCalled()
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(result.current?.dialog).toBeNull()
  })
})

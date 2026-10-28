import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { type LocalPlaylistData, myPlaylistsAtom, type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { usePlaybackChoice } from './usePlaybackChoice'

const mockPlayNewSermon = jest.fn()

jest.mock('entities/player', () => ({
  usePlayNewSermon: () => mockPlayNewSermon,
}))

const OFFLINE_OPTION_TEXT = 'Все офлайн-проповеди'
const DIALOG_TITLE = 'Где воспроизвести проповедь?'
const ERROR_MESSAGE = 'Не удалось воспроизвести проповедь'

const sermon: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: 'sermon-1',
  title: 'Слово',
}

const realPlaylist: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [sermon],
  title: 'Плейлист 1',
}

const offlinePlaylist: PlaylistData = {
  artwork: null,
  description: '',
  id: 'offline-list',
  sermons: [sermon],
  title: 'Офлайн',
}

// `buildManualPlaylist` shape: id = sermon id, exactly this sermon, no real context.
const syntheticPlaylist: PlaylistData = {
  artwork: null,
  id: sermon.id,
  sermons: [sermon],
  title: sermon.title,
}

const localPlaylist = (
  id: string,
  title: string,
  sermons: AudioPlayerData[],
): LocalPlaylistData => ({
  id,
  sermonIds: sermons.map(entry => entry.id),
  sermons,
  title,
})

type FallbackPlaylist = (
  sermon: AudioPlayerData,
  originPlaylist: null | PlaylistData,
) => PlaylistData | Promise<PlaylistData | undefined> | undefined

const renderProbe = async (offline?: PlaylistData, fallback?: FallbackPlaylist) => {
  const ctx = createCtx()
  const result: { current: null | ReturnType<typeof usePlaybackChoice> } = { current: null }
  const Probe = () => {
    const value = usePlaybackChoice({
      errorMessage: ERROR_MESSAGE,
      getFallbackPlaylist:
        fallback ?? ((_sermon, originPlaylist) => offline ?? originPlaylist ?? undefined),
      getOfflinePlaylist: offline ? () => offline : undefined,
    })
    result.current = value
    return value.dialog
  }
  const utils = await renderWithProviders(<Probe />, { ctx })
  return { ...utils, ctx, result }
}

describe('usePlaybackChoice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('offline mode: no real playlists plays the offline collection directly', async () => {
    const { result } = await renderProbe(offlinePlaylist)

    await act(async () => {
      result.current?.openChoice(sermon, syntheticPlaylist)
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: offlinePlaylist, sermon }),
    )
    expect(result.current?.dialog).toBeNull()
  })

  test('offline mode: chooser shows the offline option first, then real playlists', async () => {
    const { getAllByRole, result } = await renderProbe(offlinePlaylist)

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })

    const buttons = getAllByRole('button')
    expect(buttons[0]).toHaveTextContent(OFFLINE_OPTION_TEXT)
    expect(buttons[1]).toHaveTextContent(realPlaylist.title)
    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })

  test('offers local playlists holding the sermon, deduped by id', async () => {
    const { ctx, getByText, queryByText, result } = await renderProbe()
    myPlaylistsAtom(ctx, [
      localPlaylist(realPlaylist.id, 'Дубль исходного', [sermon]),
      localPlaylist('local-b', 'Локальный B', [sermon]),
      localPlaylist('local-c', 'Локальный C', []),
    ])

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })

    expect(getByText('Локальный B')).toBeTruthy()
    expect(queryByText('Дубль исходного')).toBeNull()
    expect(queryByText('Локальный C')).toBeNull()
  })

  test('offers membership refs with a local queue and drops light refs', async () => {
    const fullMembership: PlaylistData = {
      artwork: null,
      id: 'member-full',
      sermons: [sermon],
      title: 'Полный участник',
    }
    const lightMembership: PlaylistData = {
      artwork: null,
      id: 'member-light',
      sermons: [],
      title: 'Лёгкий участник',
    }
    const membershipSermon: AudioPlayerData = {
      ...sermon,
      playlists: [fullMembership, lightMembership],
    }
    const { getByText, queryByText, result } = await renderProbe()

    await act(async () => {
      result.current?.openChoice(membershipSermon, syntheticPlaylist)
    })

    expect(getByText('Полный участник')).toBeTruthy()
    expect(queryByText('Лёгкий участник')).toBeNull()
  })

  test('selecting a playlist starts playback there and closes the chooser', async () => {
    const { getByText, queryByText, result } = await renderProbe(offlinePlaylist)

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })
    await act(async () => {
      fireEvent.press(getByText(realPlaylist.title))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: realPlaylist, sermon }),
    )
    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })

  test('selecting the offline option plays the offline collection', async () => {
    const { getByText, result } = await renderProbe(offlinePlaylist)

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })
    await act(async () => {
      fireEvent.press(getByText(OFFLINE_OPTION_TEXT))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: offlinePlaylist, sermon }),
    )
  })

  test('history mode: chooser lists the origin playlist without the offline option', async () => {
    const { getAllByRole, getByText, queryByText, result } = await renderProbe()

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })

    expect(getByText(DIALOG_TITLE)).toBeTruthy()
    expect(queryByText(OFFLINE_OPTION_TEXT)).toBeNull()
    expect(getAllByRole('button')[0]).toHaveTextContent(realPlaylist.title)
    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })

  test('history mode: selecting a playlist plays the sermon there', async () => {
    const { getByText, result } = await renderProbe()

    await act(async () => {
      result.current?.openChoice(sermon, realPlaylist)
    })
    await act(async () => {
      fireEvent.press(getByText(realPlaylist.title))
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: realPlaylist, sermon }),
    )
  })

  test('history mode: synthetic origin with no alternatives plays the entry playlist directly', async () => {
    const { queryByText, result } = await renderProbe()

    await act(async () => {
      result.current?.openChoice(sermon, syntheticPlaylist)
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: syntheticPlaylist, sermon }),
    )
    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })

  test('history mode: async fallback resolves the full playlist when there are no candidates', async () => {
    const fullPlaylist: PlaylistData = {
      ...syntheticPlaylist,
      id: 'playlist-1',
      sermons: [sermon, { ...sermon, id: 'sermon-2' }],
      title: 'Полный плейлист',
    }
    const fallback = jest.fn(async () => fullPlaylist)
    const { queryByText, result } = await renderProbe(undefined, fallback)

    await act(async () => {
      result.current?.openChoice(sermon, syntheticPlaylist)
    })

    await waitFor(() =>
      expect(mockPlayNewSermon).toHaveBeenCalledWith({ playlist: fullPlaylist, sermon }),
    )
    expect(fallback).toHaveBeenCalledWith(sermon, syntheticPlaylist)
    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })

  test('history mode: async fallback resolving undefined starts nothing', async () => {
    const fallback = jest.fn(async () => undefined)
    const { result } = await renderProbe(undefined, fallback)

    await act(async () => {
      result.current?.openChoice(sermon, syntheticPlaylist)
    })

    expect(fallback).toHaveBeenCalledWith(sermon, syntheticPlaylist)
    expect(mockPlayNewSermon).not.toHaveBeenCalled()
  })
})

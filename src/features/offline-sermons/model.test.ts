import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { CACHED_SECTIONS, CACHED_SERMON_SEARCH, LISTENING_HISTORY } from 'shared/config'
import { audioCacheService, offlineRegistryAtom } from 'shared/lib/audio-cache'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { loadOfflineSermons, offlineSermonsAtom } from './model'

jest.mock('shared/lib/audio-cache', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    audioCacheService: { isCached: jest.fn() },
    offlineRegistryAtom: atom({}, 'testOfflineRegistryAtom'),
  }
})

jest.mock('./lib/currentPlayerCandidates', () => ({
  collectCurrentPlayerCandidates: jest.fn(() => []),
}))

jest.mock('entities/section/@x/listening-history', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { dynamicSectionsAtom: atom([], 'testDynamicSectionsAtom') }
})

const mockSermon: AudioPlayerData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [mockSermon],
  title: 'Playlist 1',
}

describe('loadOfflineSermons', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)
  })

  test('merges cached items from history, sections and search', async () => {
    await AsyncStorage.setItem(
      LISTENING_HISTORY,
      JSON.stringify([
        {
          durationMs: 120000,
          lastPlayedAt: Date.now(),
          playlist: mockPlaylist,
          positionMs: 30000,
          sermon: mockSermon,
        },
      ]),
    )
    await AsyncStorage.setItem(
      CACHED_SECTIONS,
      JSON.stringify([
        {
          itemsSize: 'middle',
          playlists: [mockPlaylist],
          title: 'Section',
          transform: 'middle',
        },
      ]),
    )
    await AsyncStorage.setItem(`${CACHED_SERMON_SEARCH}:test`, JSON.stringify([mockSermon]))

    const ctx = createCtx()
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(1)
    expect(items[0].sermon.id).toBe('sermon-1')
    expect(items[0].playlist.id).toBe('playlist-1')
  })

  test('builds a synthetic playlist for search-only sermons', async () => {
    await AsyncStorage.setItem(`${CACHED_SERMON_SEARCH}:test`, JSON.stringify([mockSermon]))

    const ctx = createCtx()
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(1)
    expect(items[0].playlist).toEqual({
      artwork: mockSermon.artwork,
      description: '',
      id: mockSermon.id,
      sermons: [mockSermon],
      title: mockSermon.title,
    })
  })

  test('full sections playlist beats slim history snapshot', async () => {
    const slimPlaylist: PlaylistData = {
      artwork: null,
      id: 'playlist-slim',
      sermons: [mockSermon],
      title: 'Slim Playlist',
    }
    const fullPlaylist: PlaylistData = {
      artwork: 'https://example.com/full.jpg',
      id: 'playlist-full',
      sermons: [mockSermon, { ...mockSermon, id: 'sermon-2' }],
      title: 'Full Playlist',
    }

    await AsyncStorage.setItem(
      LISTENING_HISTORY,
      JSON.stringify([
        {
          durationMs: 120000,
          lastPlayedAt: Date.now(),
          playlist: slimPlaylist,
          positionMs: 30000,
          sermon: mockSermon,
        },
      ]),
    )
    await AsyncStorage.setItem(
      CACHED_SECTIONS,
      JSON.stringify([
        {
          itemsSize: 'middle',
          playlists: [fullPlaylist],
          title: 'Section',
          transform: 'middle',
        },
      ]),
    )

    const ctx = createCtx()
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(2)
    const sermonItem = items.find(item => item.sermon.id === 'sermon-1')
    expect(sermonItem?.playlist.id).toBe('playlist-full')
  })

  test('keeps the previous list when loading fails', async () => {
    const ctx = createCtx()
    offlineSermonsAtom(ctx, [{ playlist: mockPlaylist, sermon: mockSermon }])

    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('storage error'))

    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(1)
    expect(items[0].sermon.id).toBe('sermon-1')
  })

  test('offline registry playlist beats search-only synthetic playlist', async () => {
    await AsyncStorage.setItem(`${CACHED_SERMON_SEARCH}:test`, JSON.stringify([mockSermon]))

    const ctx = createCtx()
    offlineRegistryAtom(ctx, {
      [mockSermon.audioUrl]: {
        playlist: mockPlaylist,
        registeredAt: Date.now(),
        sermon: mockSermon,
      },
    })
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(1)
    expect(items[0].playlist).toEqual(mockPlaylist)
  })

  test('sections playlist beats offline registry playlist', async () => {
    const registryPlaylist: PlaylistData = {
      artwork: null,
      id: 'playlist-registry',
      sermons: [mockSermon],
      title: 'Registry Playlist',
    }
    const sectionsPlaylist: PlaylistData = {
      artwork: 'https://example.com/sections.jpg',
      id: 'playlist-sections',
      sermons: [mockSermon, { ...mockSermon, id: 'sermon-2' }],
      title: 'Sections Playlist',
    }

    await AsyncStorage.setItem(
      CACHED_SECTIONS,
      JSON.stringify([
        {
          itemsSize: 'middle',
          playlists: [sectionsPlaylist],
          title: 'Section',
          transform: 'middle',
        },
      ]),
    )

    const ctx = createCtx()
    offlineRegistryAtom(ctx, {
      [mockSermon.audioUrl]: {
        playlist: registryPlaylist,
        registeredAt: Date.now(),
        sermon: mockSermon,
      },
    })
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    const sermonItem = items.find(item => item.sermon.id === 'sermon-1')
    expect(sermonItem?.playlist.id).toBe('playlist-sections')
  })

  test('offline registry sermon without playlist gets a synthetic playlist', async () => {
    const ctx = createCtx()
    offlineRegistryAtom(ctx, {
      [mockSermon.audioUrl]: {
        playlist: null,
        registeredAt: Date.now(),
        sermon: mockSermon,
      },
    })
    await loadOfflineSermons(ctx)

    const items = ctx.get(offlineSermonsAtom)
    expect(items).toHaveLength(1)
    expect(items[0].playlist).toEqual({
      artwork: mockSermon.artwork,
      description: '',
      id: mockSermon.id,
      sermons: [mockSermon],
      title: mockSermon.title,
    })
  })
})

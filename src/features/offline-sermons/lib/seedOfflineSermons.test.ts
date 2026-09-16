import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { OFFLINE_SERMONS_REGISTRY_SEEDED } from 'shared/config'
import { registerOfflineSermon } from 'shared/lib/audio-cache'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { collectSermonItems } from './collectSermonItems'
import { filterCachedSermons } from './filterCachedSermons'
import { seedOfflineSermons } from './seedOfflineSermons'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
  flushOfflineRegistryPersist: jest.fn(() => Promise.resolve()),
  registerOfflineSermon: jest.fn(),
}))

jest.mock('./collectSermonItems', () => ({
  collectSermonItems: jest.fn(),
}))

jest.mock('./filterCachedSermons', () => ({
  filterCachedSermons: jest.fn(),
}))

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

describe('seedOfflineSermons', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('registers cached sermons and sets the seeded flag', async () => {
    jest
      .mocked(collectSermonItems)
      .mockResolvedValue([{ playlist: mockPlaylist, sermon: mockSermon }])
    jest
      .mocked(filterCachedSermons)
      .mockResolvedValue([{ playlist: mockPlaylist, sermon: mockSermon }])

    const ctx = createCtx()
    await seedOfflineSermons(ctx)

    expect(registerOfflineSermon).toHaveBeenCalledWith(
      ctx,
      mockSermon.audioUrl,
      mockSermon,
      mockPlaylist,
    )
    expect(await AsyncStorage.getItem(OFFLINE_SERMONS_REGISTRY_SEEDED)).toBe('true')
  })

  test('skips when already seeded', async () => {
    await AsyncStorage.setItem(OFFLINE_SERMONS_REGISTRY_SEEDED, 'true')

    const ctx = createCtx()
    await seedOfflineSermons(ctx)

    expect(collectSermonItems).not.toHaveBeenCalled()
    expect(registerOfflineSermon).not.toHaveBeenCalled()
  })

  test('does not set the flag when the backfill fails', async () => {
    jest.mocked(collectSermonItems).mockRejectedValue(new Error('boom'))

    const ctx = createCtx()
    await seedOfflineSermons(ctx)

    expect(registerOfflineSermon).not.toHaveBeenCalled()
    expect(await AsyncStorage.getItem(OFFLINE_SERMONS_REGISTRY_SEEDED)).toBeNull()
  })
})

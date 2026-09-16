import { createCtx } from '@reatom/framework'
import { audioCacheService, registerOfflineSermon } from 'shared/lib/audio-cache'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { collectSermonItems } from './collectSermonItems'
import { syncOfflineSermon } from './syncOfflineSermon'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
  registerOfflineSermon: jest.fn(),
}))

jest.mock('./collectSermonItems', () => ({
  collectSermonItems: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockSermon: AudioPlayerData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [mockSermon],
  title: 'Playlist 1',
}

describe('syncOfflineSermon', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('registers the sermon when the URL is cached and found in candidates', async () => {
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)
    jest
      .mocked(collectSermonItems)
      .mockResolvedValue([{ playlist: mockPlaylist, sermon: mockSermon }])

    const ctx = createCtx()
    await syncOfflineSermon(ctx, AUDIO_URL)

    expect(registerOfflineSermon).toHaveBeenCalledWith(ctx, AUDIO_URL, mockSermon, mockPlaylist)
  })

  test('does not register when the URL is not cached', async () => {
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)

    const ctx = createCtx()
    await syncOfflineSermon(ctx, AUDIO_URL)

    expect(collectSermonItems).not.toHaveBeenCalled()
    expect(registerOfflineSermon).not.toHaveBeenCalled()
  })

  test('does not register when the sermon is not found in candidates', async () => {
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)
    jest.mocked(collectSermonItems).mockResolvedValue([])

    const ctx = createCtx()
    await syncOfflineSermon(ctx, AUDIO_URL)

    expect(registerOfflineSermon).not.toHaveBeenCalled()
  })
})

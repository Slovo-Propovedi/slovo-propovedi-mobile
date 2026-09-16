import { audioCacheService } from 'shared/lib/audio-cache'
import { type PlaylistData, type SermonData } from 'shared/model'
import { filterCachedSermons } from './filterCachedSermons'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
}))

const sermonWithAudio: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon 1',
}

const sermonWithoutAudio: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art2.jpg',
  id: 'sermon-2',
  title: 'Sermon 2',
}

const playlist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [sermonWithAudio, sermonWithoutAudio],
  title: 'Playlist',
}

describe('filterCachedSermons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('keeps only pairs whose audio is cached', async () => {
    jest
      .mocked(audioCacheService.isCached)
      .mockImplementation(async url => url === sermonWithAudio.audioUrl)

    const result = await filterCachedSermons([
      { playlist, sermon: sermonWithAudio },
      { playlist, sermon: sermonWithoutAudio },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].sermon.id).toBe('sermon-1')
  })

  test('drops sermons without audioUrl without checking the cache', async () => {
    const result = await filterCachedSermons([{ playlist, sermon: sermonWithoutAudio }])

    expect(result).toHaveLength(0)
    expect(audioCacheService.isCached).not.toHaveBeenCalled()
  })

  test('treats cache check failures as not cached', async () => {
    jest.mocked(audioCacheService.isCached).mockRejectedValue(new Error('fs error'))

    const result = await filterCachedSermons([{ playlist, sermon: sermonWithAudio }])

    expect(result).toHaveLength(0)
  })
})

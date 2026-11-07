import { resolvePlaylistBySermon } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { resolveEntryFallbackPlaylist } from './resolveEntryFallbackPlaylist'

jest.mock('entities/listening-history', () => ({
  resolvePlaylistBySermon: jest.fn(),
}))

const sermon: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://cdn/sermon-1.mp3',
  id: 'sermon-1',
  title: 'Слово',
}

const snapshotPlaylist: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [sermon],
  title: 'Плейлист записи',
}

const fullPlaylist: PlaylistData = {
  ...snapshotPlaylist,
  sermons: [sermon, { ...sermon, id: 'sermon-2' }],
  title: 'Полный плейлист',
}

describe('resolveEntryFallbackPlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('no origin playlist → undefined, nothing to resolve', async () => {
    const result = await resolveEntryFallbackPlaylist(sermon, null)

    expect(result).toBeUndefined()
    expect(resolvePlaylistBySermon).not.toHaveBeenCalled()
  })

  test('resolves the full playlist by the origin playlist and sermon ids', async () => {
    jest.mocked(resolvePlaylistBySermon).mockResolvedValue(fullPlaylist)

    const result = await resolveEntryFallbackPlaylist(sermon, snapshotPlaylist)

    expect(resolvePlaylistBySermon).toHaveBeenCalledWith(
      snapshotPlaylist.id,
      sermon.id,
      snapshotPlaylist,
    )
    expect(result).toBe(fullPlaylist)
  })
})

import { type PlaylistData } from 'entities/playlist'
import { getNextSermonInfo } from './getNextSermonInfo'

const playlist: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [
    { artist: 'Author A', artwork: null, id: 'sermon-a', title: 'Sermon A' },
    { artist: 'Author B', artwork: null, id: 'sermon-b', title: 'Sermon B' },
  ],
  title: 'Test Playlist',
}

describe('getNextSermonInfo', () => {
  test('reports the following sermon when the current one is in the playlist', () => {
    expect(getNextSermonInfo(playlist, 'sermon-a')).toEqual({
      hasNext: true,
      title: 'Sermon B',
    })
  })

  test('reports no next sermon when the current track is not in the playlist', () => {
    expect(getNextSermonInfo(playlist, 'not-in-playlist')).toEqual({
      hasNext: false,
      title: undefined,
    })
  })
})

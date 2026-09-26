import { playlistDataSchema, playlistsArraySchema } from './common'

const validSermon = {
  artist: 'Pastor John',
  artwork: 'https://example.com/artwork.jpg',
  id: 'sermon-1',
  title: 'Grace of God',
}

const validPlaylist = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [validSermon],
  title: 'Sunday Sermons',
}

describe('alias schemas', () => {
  test('playlistDataSchema parses valid playlist', () => {
    const result = playlistDataSchema.parse(validPlaylist)
    expect(result.id).toBe(validPlaylist.id)
  })
})

describe('array schemas', () => {
  test('playlistsArraySchema parses array of playlists', () => {
    const result = playlistsArraySchema.parse([validPlaylist])
    expect(result).toHaveLength(1)
  })

  test('playlistsArraySchema throws on invalid item', () => {
    const invalid = [{ artwork: 'url', id: '1', title: 't' }]
    expect(() => playlistsArraySchema.parse(invalid)).toThrow()
  })
})

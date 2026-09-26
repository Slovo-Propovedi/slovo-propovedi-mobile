import { playlistDataSchema, playlistsArraySchema, playlistSchema } from './model'

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

describe('playlistSchema', () => {
  test('parses valid playlist with required fields', () => {
    const result = playlistSchema.parse(validPlaylist)
    expect(result.id).toBe('playlist-1')
    expect(result.sermons).toHaveLength(1)
    expect(result.title).toBe('Sunday Sermons')
  })

  test('parses playlist with optional description and sections', () => {
    const playlist = {
      ...validPlaylist,
      description: 'Best sermons',
      sections: [{ itemsSize: 'large', transform: 'high' }],
    }
    const result = playlistSchema.parse(playlist)
    expect(result.description).toBe('Best sermons')
    expect(result.sections).toHaveLength(1)
  })

  test('parses playlist with empty sermons array', () => {
    const playlist = { ...validPlaylist, sermons: [] }
    const result = playlistSchema.parse(playlist)
    expect(result.sermons).toEqual([])
  })

  test('throws on missing required field: artwork', () => {
    const { artwork: _, ...rest } = validPlaylist
    expect(() => playlistSchema.parse(rest)).toThrow()
  })

  test('throws on missing required field: sermons', () => {
    const { sermons: _, ...rest } = validPlaylist
    expect(() => playlistSchema.parse(rest)).toThrow()
  })
})

describe('playlistDataSchema alias', () => {
  test('parses valid playlist', () => {
    const result = playlistDataSchema.parse(validPlaylist)
    expect(result.id).toBe(validPlaylist.id)
  })
})

describe('playlistsArraySchema', () => {
  test('parses array of playlists', () => {
    const result = playlistsArraySchema.parse([validPlaylist])
    expect(result).toHaveLength(1)
  })

  test('throws on invalid item', () => {
    const invalid = [{ artwork: 'url', id: '1', title: 't' }]
    expect(() => playlistsArraySchema.parse(invalid)).toThrow()
  })
})

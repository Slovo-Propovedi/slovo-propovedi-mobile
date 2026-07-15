import {
  bookDataSchema,
  booksArraySchema,
  playlistDataSchema,
  playlistsArraySchema,
  sermonDataSchema,
} from './common'

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
  test('sermonDataSchema parses valid sermon', () => {
    const result = sermonDataSchema.parse(validSermon)
    expect(result.id).toBe(validSermon.id)
  })

  test('playlistDataSchema parses valid playlist', () => {
    const result = playlistDataSchema.parse(validPlaylist)
    expect(result.id).toBe(validPlaylist.id)
  })

  test('bookDataSchema parses valid sermon (book = sermon)', () => {
    const result = bookDataSchema.parse(validSermon)
    expect(result.artist).toBe(validSermon.artist)
  })
})

describe('array schemas', () => {
  test('booksArraySchema parses array of sermons', () => {
    const sermon2 = { ...validSermon, id: 'sermon-2', title: 'Faith' }
    const result = booksArraySchema.parse([validSermon, sermon2])
    expect(result).toHaveLength(2)
  })

  test('playlistsArraySchema parses array of playlists', () => {
    const result = playlistsArraySchema.parse([validPlaylist])
    expect(result).toHaveLength(1)
  })

  test('booksArraySchema throws on invalid item', () => {
    const invalid = [{ ...validSermon, artist: 123 }]
    expect(() => booksArraySchema.parse(invalid)).toThrow()
  })

  test('playlistsArraySchema throws on invalid item', () => {
    const invalid = [{ artwork: 'url', id: '1', title: 't' }]
    expect(() => playlistsArraySchema.parse(invalid)).toThrow()
  })
})

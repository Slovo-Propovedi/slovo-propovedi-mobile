import { sermonSchema } from './common'

const validSermon = {
  artist: 'Pastor John',
  artwork: 'https://example.com/artwork.jpg',
  id: 'sermon-1',
  title: 'Grace of God',
}

describe('sermonSchema', () => {
  test('parses valid sermon with only required fields', () => {
    const result = sermonSchema.parse(validSermon)
    expect(result).toEqual(validSermon)
  })

  test('parses sermon with all optional fields', () => {
    const fullSermon = {
      ...validSermon,
      audioUrl: 'https://example.com/audio.mp3',
      chapter: 3,
      description: 'A sermon about grace',
      playlists: [],
      textFileUrl: null,
      verse: 15,
      youtubeUrl: 'https://youtube.com/watch?v=abc',
    }
    const result = sermonSchema.parse(fullSermon)
    expect(result.chapter).toBe(3)
    expect(result.verse).toBe(15)
    expect(result.audioUrl).toBe('https://example.com/audio.mp3')
  })

  test('parses sermon with verse as array', () => {
    const sermon = { ...validSermon, verse: [1, 2, 3] }
    const result = sermonSchema.parse(sermon)
    expect(result.verse).toEqual([1, 2, 3])
  })

  test('parses sermon with chapter as range', () => {
    const sermon = { ...validSermon, chapter: [3, 4] }
    const result = sermonSchema.parse(sermon)
    expect(result.chapter).toEqual([3, 4])
  })

  test('parses sermon with verse as range', () => {
    const sermon = { ...validSermon, verse: [16, 18] }
    const result = sermonSchema.parse(sermon)
    expect(result.verse).toEqual([16, 18])
  })

  test('parses sermon with verse as segment list', () => {
    const sermon = { ...validSermon, verse: [16, [18, 20], 22] }
    const result = sermonSchema.parse(sermon)
    expect(result.verse).toEqual([16, [18, 20], 22])
  })

  test('parses sermon with verse list starting with a range', () => {
    const sermon = { ...validSermon, verse: [[9, 18], 20] }
    const result = sermonSchema.parse(sermon)
    expect(result.verse).toEqual([[9, 18], 20])
  })

  test('parses sermon with book reference', () => {
    const sermon = { ...validSermon, book: 'Бытие' }
    const result = sermonSchema.parse(sermon)
    expect(result.book).toBe('Бытие')
  })

  test('parses sermon with nullable fields set to null', () => {
    const sermon = { ...validSermon, audioUrl: null, textFileUrl: null, youtubeUrl: null }
    const result = sermonSchema.parse(sermon)
    expect(result.audioUrl).toBeNull()
    expect(result.textFileUrl).toBeNull()
    expect(result.youtubeUrl).toBeNull()
  })

  test('throws on missing required field: artist', () => {
    const { artist: _, ...noArtist } = validSermon
    expect(() => sermonSchema.parse(noArtist)).toThrow()
  })

  test('throws on missing required field: title', () => {
    const { title: _, ...noTitle } = validSermon
    expect(() => sermonSchema.parse(noTitle)).toThrow()
  })

  test('throws when verse has invalid type', () => {
    const sermon = { ...validSermon, verse: 'not a number' }
    expect(() => sermonSchema.parse(sermon)).toThrow()
  })

  test('throws when verse is a numeric string', () => {
    const sermon = { ...validSermon, verse: '16' }
    expect(() => sermonSchema.parse(sermon)).toThrow()
  })
})

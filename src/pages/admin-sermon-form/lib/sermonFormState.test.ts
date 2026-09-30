import { type APITypes } from 'shared/api'
import { initialFormValues, type SermonFormValues } from './sermonFormInitialValues'
import {
  applyChapterEndChange,
  buildCreateSermonDto,
  buildUpdateSermonDto,
  isRangeMode,
  resolveVerse,
  verseError,
} from './sermonFormState'

const baseValues = (overrides: Partial<SermonFormValues> = {}): SermonFormValues => ({
  ...initialFormValues(null),
  ...overrides,
})

const entity = (overrides: Partial<APITypes.SermonEntity> = {}): APITypes.SermonEntity => ({
  artist: 'Иоанн',
  artwork: 'cover',
  audioUrl: null,
  book: 'Иоанна',
  chapter: 3,
  description: 'Описание',
  id: 's1',
  playlists: [],
  textFileUrl: null,
  title: 'Сила веры',
  verse: 16,
  youtubeUrl: null,
  ...overrides,
})

describe('initialFormValues', () => {
  test('maps a sermon entity into form fields', () => {
    const values = initialFormValues(entity())

    expect(values.title).toBe('Сила веры')
    expect(values.chapterStart).toBe('3')
    expect(values.chapterEnd).toBe('')
    expect(values.verseText).toBe('16')
  })

  test('prefills the verse pair for a chapter range with a verse range', () => {
    const values = initialFormValues(entity({ chapter: [3, 4], verse: [16, 18] }))

    expect(values.chapterStart).toBe('3')
    expect(values.chapterEnd).toBe('4')
    expect(values.verseStart).toBe('16')
    expect(values.verseEnd).toBe('18')
    expect(values.verseText).toBe('')
  })
})

describe('resolveVerse', () => {
  test('range mode with an empty pair clears the field', () => {
    expect(resolveVerse(baseValues({ chapterEnd: '4' }))).toBeNull()
  })

  test('range mode with a full pair yields a tuple', () => {
    const values = baseValues({ chapterEnd: '4', verseEnd: '18', verseStart: '16' })

    expect(resolveVerse(values)).toEqual([16, 18])
  })

  test('range mode with a half-filled pair is invalid', () => {
    expect(resolveVerse(baseValues({ chapterEnd: '4', verseStart: '16' }))).toBeUndefined()
  })

  test('plain mode parses the free text', () => {
    expect(resolveVerse(baseValues({ verseText: '16–18' }))).toEqual([16, 18])
  })

  test('plain mode with empty text clears the field', () => {
    expect(resolveVerse(baseValues({ verseText: '' }))).toBeNull()
  })
})

describe('verseError', () => {
  test('flags a half-filled range pair', () => {
    expect(verseError(baseValues({ chapterEnd: '4', verseStart: '16' }))).not.toBe('')
  })

  test('is silent for a valid plain text', () => {
    expect(verseError(baseValues({ verseText: '16, 18–20' }))).toBe('')
  })

  test('flags an invalid plain text', () => {
    expect(verseError(baseValues({ verseText: 'abc' }))).not.toBe('')
  })
})

describe('applyChapterEndChange', () => {
  test('entering range mode moves a range from text into the pair', () => {
    const next = applyChapterEndChange(baseValues({ verseText: '16–18' }), '4')

    expect(isRangeMode(next)).toBe(true)
    expect(next.verseStart).toBe('16')
    expect(next.verseEnd).toBe('18')
  })

  test('entering range mode moves a single verse into the start only', () => {
    const next = applyChapterEndChange(baseValues({ verseText: '16' }), '4')

    expect(next.verseStart).toBe('16')
    expect(next.verseEnd).toBe('')
  })

  test('leaving range mode serializes the completed pair back to text', () => {
    const next = applyChapterEndChange(
      baseValues({ chapterEnd: '4', verseEnd: '18', verseStart: '16' }),
      '',
    )

    expect(next.verseText).toBe('16–18')
  })

  test('leaving range mode is blocked while the pair is half-filled', () => {
    const next = applyChapterEndChange(baseValues({ chapterEnd: '4', verseStart: '16' }), '')

    expect(next.chapterEnd).toBe('4')
  })
})

describe('buildCreateSermonDto', () => {
  test('clears nullable fields to null and always sends the playlists array', () => {
    const dto = buildCreateSermonDto(
      baseValues({ artist: ' Иоанн ', title: ' Сила веры ', verseText: '16' }),
    )

    expect(dto).toEqual({
      artist: 'Иоанн',
      artwork: '',
      audioUrl: null,
      book: null,
      chapter: null,
      description: null,
      playlistsIds: [],
      textFileUrl: null,
      title: 'Сила веры',
      verse: 16,
      youtubeUrl: null,
    })
  })

  test('keeps chapter and verse when filled', () => {
    const dto = buildCreateSermonDto(
      baseValues({ chapterEnd: '4', chapterStart: '3', verseEnd: '18', verseStart: '16' }),
    )

    expect(dto.chapter).toEqual([3, 4])
    expect(dto.verse).toEqual([16, 18])
  })
})

describe('buildUpdateSermonDto', () => {
  test('mirrors the create DTO shape', () => {
    const dto = buildUpdateSermonDto(baseValues({ title: 'Сила веры' }))

    expect(dto.playlistsIds).toEqual([])
    expect(dto.book).toBeNull()
  })
})

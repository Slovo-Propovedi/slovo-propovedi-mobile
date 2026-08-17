import { formatSermonReference } from './formatSermonReference'

describe('formatSermonReference', () => {
  test('book + chapter + verse range', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: 1, verse: [1, 5] })).toBe('Бытие 1:1-5')
  })

  test('book + chapter', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: 1 })).toBe('Бытие 1')
  })

  test('book only', () => {
    expect(formatSermonReference({ book: 'Бытие' })).toBe('Бытие')
  })

  test('chapter + verse without book', () => {
    expect(formatSermonReference({ chapter: 1, verse: [1, 5] })).toBe('1:1-5')
  })

  test('verse as single number', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: 1, verse: 5 })).toBe('Бытие 1:5')
  })

  test('book + verse without chapter', () => {
    expect(formatSermonReference({ book: 'Бытие', verse: 5 })).toBe('Бытие 5')
  })

  test('verse without book and chapter', () => {
    expect(formatSermonReference({ verse: 5 })).toBe('5')
  })

  test('null values return undefined', () => {
    expect(formatSermonReference({ book: null, chapter: null, verse: null })).toBeUndefined()
  })

  test('undefined values return undefined', () => {
    expect(
      formatSermonReference({ book: undefined, chapter: undefined, verse: undefined }),
    ).toBeUndefined()
  })

  test('empty params return undefined', () => {
    expect(formatSermonReference({})).toBeUndefined()
  })

  test('book + chapter range', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: [3, 4] })).toBe('Бытие 3-4')
  })

  test('book + chapter range + verse', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: [3, 4], verse: 5 })).toBe('Бытие 3-4:5')
  })

  test('chapter range without book', () => {
    expect(formatSermonReference({ chapter: [3, 4] })).toBe('3-4')
  })

  test('book + verse range', () => {
    expect(formatSermonReference({ book: 'Бытие', verse: [16, 18] })).toBe('Бытие 16-18')
  })

  test('book + verse list with nested ranges', () => {
    expect(formatSermonReference({ book: 'Бытие', verse: [16, [18, 20], 22] })).toBe(
      'Бытие 16, 18-20, 22',
    )
  })

  test('book + verse list starting with a range', () => {
    expect(formatSermonReference({ book: 'Бытие', verse: [[9, 18], 20] })).toBe('Бытие 9-18, 20')
  })

  test('verse list without book', () => {
    expect(formatSermonReference({ verse: [16, [18, 20], 22] })).toBe('16, 18-20, 22')
  })

  test('plain verse array with 3+ ints is a list of scattered verses', () => {
    expect(formatSermonReference({ book: 'Бытие', verse: [16, 18, 22] })).toBe('Бытие 16, 18, 22')
  })

  test('book + chapter + verse segment list', () => {
    expect(formatSermonReference({ book: 'Бытие', chapter: 3, verse: [16, [18, 20], 22] })).toBe(
      'Бытие 3:16, 18-20, 22',
    )
  })
})

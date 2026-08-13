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

  test('empty params return undefined', () => {
    expect(formatSermonReference({})).toBeUndefined()
  })
})

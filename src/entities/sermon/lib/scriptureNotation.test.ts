import { isVerseRangeTuple, parseChapter, parseVerseInput, type Verse } from './scriptureNotation'
import { serializeVerseInput } from './scriptureSerialization'

describe('isVerseRangeTuple', () => {
  test('accepts exactly two integers', () => {
    expect(isVerseRangeTuple([3, 4])).toBe(true)
  })

  test('rejects a single number, a wider array and non-numbers', () => {
    expect(isVerseRangeTuple(3)).toBe(false)
    expect(isVerseRangeTuple([3])).toBe(false)
    expect(isVerseRangeTuple([3, 4, 5])).toBe(false)
    expect(isVerseRangeTuple(['3', 4])).toBe(false)
    expect(isVerseRangeTuple(null)).toBe(false)
  })
})

describe('parseChapter', () => {
  test('only the start yields a single number', () => {
    expect(parseChapter('3', '')).toBe(3)
  })

  test('start and end yield a range tuple', () => {
    expect(parseChapter('3', '4')).toEqual([3, 4])
  })

  test('neither field yields undefined', () => {
    expect(parseChapter('', '')).toBeUndefined()
  })

  test('a lone end is ignored', () => {
    expect(parseChapter('', '4')).toBeUndefined()
  })

  test('an equal end collapses to a single number', () => {
    expect(parseChapter('3', '3')).toBe(3)
  })

  test('null and non-numeric values are handled at the boundary', () => {
    expect(parseChapter(null, null)).toBeUndefined()
    expect(parseChapter('abc', '4')).toBeUndefined()
  })
})

describe('parseVerseInput', () => {
  test('parses a single verse', () => {
    expect(parseVerseInput('16')).toBe(16)
  })

  test('parses a range with any dash', () => {
    expect(parseVerseInput('16-18')).toEqual([16, 18])
    expect(parseVerseInput('16–18')).toEqual([16, 18])
    expect(parseVerseInput('16—18')).toEqual([16, 18])
  })

  test('collapses an equal range to a single verse', () => {
    expect(parseVerseInput('16-16')).toBe(16)
  })

  test('parses disjoint segments', () => {
    expect(parseVerseInput('9-18, 20')).toEqual([[9, 18], 20])
  })

  test('wraps two lone verses to stay unambiguous on the wire', () => {
    expect(parseVerseInput('9, 20')).toEqual([
      [9, 9],
      [20, 20],
    ])
  })

  test('an empty input yields undefined', () => {
    expect(parseVerseInput('')).toBeUndefined()
    expect(parseVerseInput('   ')).toBeUndefined()
  })

  test('any invalid part invalidates the whole input', () => {
    expect(parseVerseInput('16, abc')).toBeUndefined()
    expect(parseVerseInput('0')).toBeUndefined()
    expect(parseVerseInput('16-')).toBeUndefined()
  })
})

describe('serializeVerseInput', () => {
  test('mirrors the display normalization', () => {
    expect(serializeVerseInput(16)).toBe('16')
    expect(serializeVerseInput([16, 18])).toBe('16–18')
    expect(serializeVerseInput([[9, 18], 20])).toBe('9–18, 20')
  })

  test('collapses a [n, n] tuple to a single verse', () => {
    expect(serializeVerseInput([3, 3])).toBe('3')
  })

  test('a missing value renders as an empty string', () => {
    expect(serializeVerseInput(null)).toBe('')
    expect(serializeVerseInput(undefined)).toBe('')
  })

  test('round-trips parseVerseInput output', () => {
    const cases: Verse[] = [16, [16, 18], [[9, 18], 20]]
    for (const value of cases) expect(parseVerseInput(serializeVerseInput(value))).toEqual(value)
  })
})

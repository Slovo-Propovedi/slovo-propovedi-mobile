import { isValidBlurhash } from './isValidBlurhash'

describe('isValidBlurhash', () => {
  test('accepts a real base83 blurhash', () => {
    expect(isValidBlurhash('LKO2?wKcjK')).toBe(true)
    expect(isValidBlurhash('LEHV6nWB2yk8pyo0adR*.7kCMdnj')).toBe(true)
  })

  test('rejects absent, empty and too-short values', () => {
    expect(isValidBlurhash(null)).toBe(false)
    expect(isValidBlurhash(undefined)).toBe(false)
    expect(isValidBlurhash('')).toBe(false)
    expect(isValidBlurhash('abc')).toBe(false)
  })

  test('rejects strings outside the base83 charset', () => {
    expect(isValidBlurhash('not a blurhash')).toBe(false)
    expect(isValidBlurhash('https://example.com/cover.jpg')).toBe(false)
  })
})

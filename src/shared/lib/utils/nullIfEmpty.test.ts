import { nullIfEmpty } from './nullIfEmpty'

describe('nullIfEmpty', () => {
  test('returns null for an empty string', () => {
    expect(nullIfEmpty('')).toBeNull()
  })

  test('returns null for null and undefined', () => {
    expect(nullIfEmpty(null)).toBeNull()
    expect(nullIfEmpty(undefined)).toBeNull()
  })

  test('passes a non-empty value through', () => {
    expect(nullIfEmpty('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
  })
})

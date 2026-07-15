import { isNonNullable } from './isNonNullable'

describe('isNonNullable', () => {
  test('returns false for null', () => {
    expect(isNonNullable(null)).toEqual(false)
  })

  test('returns false for undefined', () => {
    expect(isNonNullable(undefined)).toEqual(false)
  })

  test('returns true for a number', () => {
    expect(isNonNullable(42)).toEqual(true)
  })

  test('returns true for zero', () => {
    expect(isNonNullable(0)).toEqual(true)
  })

  test('returns true for an empty string', () => {
    expect(isNonNullable('')).toEqual(true)
  })

  test('returns true for false', () => {
    expect(isNonNullable(false)).toEqual(true)
  })

  test('returns true for an empty object', () => {
    expect(isNonNullable({})).toEqual(true)
  })

  test('returns true for an empty array', () => {
    expect(isNonNullable([])).toEqual(true)
  })

  test('does not confuse falsy values with nullable', () => {
    expect(isNonNullable(0)).toEqual(true)
    expect(isNonNullable('')).toEqual(true)
    expect(isNonNullable(false)).toEqual(true)
  })

  test('works as a type guard with filter', () => {
    const mixed: (null | string | undefined)[] = ['a', null, 'b', undefined, 'c']
    const filtered = mixed.filter(isNonNullable)
    expect(filtered).toEqual(['a', 'b', 'c'])
  })
})

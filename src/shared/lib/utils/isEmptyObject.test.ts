import { isEmptyObject } from './isEmptyObject'

describe('isEmptyObject', () => {
  test('returns true for an empty object', () => {
    expect(isEmptyObject({})).toEqual(true)
  })

  test('returns false for an object with one property', () => {
    expect(isEmptyObject({ a: 1 })).toEqual(false)
  })

  test('returns false for an object with multiple properties', () => {
    expect(isEmptyObject({ a: 1, b: 2, c: 3 })).toEqual(false)
  })

  test('returns true for null', () => {
    expect(isEmptyObject(null)).toEqual(true)
  })

  test('returns true for undefined', () => {
    expect(isEmptyObject(undefined)).toEqual(true)
  })

  test('returns false for a non-empty array', () => {
    expect(isEmptyObject([1, 2, 3])).toEqual(false)
  })

  test('returns false for an array with one element', () => {
    expect(isEmptyObject([1])).toEqual(false)
  })

  test('returns true for an empty array', () => {
    expect(isEmptyObject([])).toEqual(true)
  })

  test('returns true for a Date object', () => {
    expect(isEmptyObject(new Date())).toEqual(true)
  })

  test('returns true for an object with only symbol keys', () => {
    const sym = Symbol('test')
    expect(isEmptyObject({ [sym]: 'value' })).toEqual(true)
  })
})

import { isEmpty } from './isEmpty'

describe('isEmpty', () => {
  test('returns true for an object without own keys', () => {
    expect(isEmpty({})).toBe(true)
  })

  test('returns false for an object with own keys', () => {
    expect(isEmpty({ title: '' })).toBe(false)
  })

  test('counts a key holding undefined', () => {
    expect(isEmpty({ title: undefined })).toBe(false)
  })
})

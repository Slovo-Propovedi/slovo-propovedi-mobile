import { hasModifier, isEscapeKey } from './isEscapeKey'

describe('isEscapeKey', () => {
  test('returns true for a plain DOM Escape keydown', () => {
    expect(isEscapeKey({ key: 'Escape' })).toBe(true)
  })

  test('returns true for an RN nativeEvent-shaped Escape keypress', () => {
    expect(isEscapeKey({ nativeEvent: { key: 'Escape' } })).toBe(true)
  })

  test('returns false for a non-Escape key', () => {
    expect(isEscapeKey({ key: 'Enter' })).toBe(false)
  })

  test('returns false for the legacy Esc key name', () => {
    expect(isEscapeKey({ key: 'Esc' })).toBe(false)
  })

  test('returns false when no key is present', () => {
    expect(isEscapeKey({})).toBe(false)
  })

  test.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['alt', { altKey: true }],
    ['shift', { shiftKey: true }],
  ])('returns false when %s is held', (_name, modifiers) => {
    expect(isEscapeKey({ key: 'Escape', ...modifiers })).toBe(false)
  })
})

describe('hasModifier', () => {
  test('returns false when no modifier is held', () => {
    expect(hasModifier({ key: 'Escape' })).toBe(false)
  })

  test.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['alt', { altKey: true }],
    ['shift', { shiftKey: true }],
  ])('returns true when %s is held', (_name, modifiers) => {
    expect(hasModifier({ key: 'Escape', ...modifiers })).toBe(true)
  })
})

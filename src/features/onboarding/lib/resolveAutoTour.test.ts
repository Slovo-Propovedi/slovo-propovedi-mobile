import { resolveAutoTour } from './resolveAutoTour'

describe('resolveAutoTour', () => {
  test('plays the welcome tour when no version was seen yet', () => {
    expect(resolveAutoTour(null, '1.2.0', true)).toBe('welcome')
  })

  test('plays the whats-new tour when the seen app version is older', () => {
    expect(resolveAutoTour('1.1.0', '1.2.0', true)).toBe('whatsNew')
  })

  test('plays nothing when the current app version was already seen', () => {
    expect(resolveAutoTour('1.2.0', '1.2.0', true)).toBeNull()
  })

  test('plays nothing when the seen version is newer than the running bundle', () => {
    // A downgrade (or a stored version from a newer release) must not re-show the tour.
    expect(resolveAutoTour('1.4.1', '1.2.0', true)).toBeNull()
  })

  test('plays nothing when the release ships no whats-new steps', () => {
    // A release without user-visible novelties keeps an empty scenario and stays
    // silent even though its app version is newer than the seen one.
    expect(resolveAutoTour('1.1.0', '1.2.0', false)).toBeNull()
  })

  test('still plays the welcome tour on a fresh install of a silent release', () => {
    expect(resolveAutoTour(null, '1.2.0', false)).toBe('welcome')
  })

  test('compares versions numerically, not as strings', () => {
    expect(resolveAutoTour('0.9.0', '0.10.0', true)).toBe('whatsNew')
  })
})

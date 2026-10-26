import { resolveAutoTour } from './resolveAutoTour'

describe('resolveAutoTour', () => {
  test('plays the welcome tour when no version was seen yet', () => {
    expect(resolveAutoTour(null, '1.2.0')).toBe('welcome')
  })

  test('plays the whats-new tour when the seen content is older', () => {
    expect(resolveAutoTour('1.1.0', '1.2.0')).toBe('whatsNew')
  })

  test('plays nothing when the current content was already seen', () => {
    expect(resolveAutoTour('1.2.0', '1.2.0')).toBeNull()
  })

  test('plays nothing on a plain app update without new content', () => {
    // Legacy installs stored the app version, which is newer than the content.
    expect(resolveAutoTour('1.4.1', '1.2.0')).toBeNull()
  })

  test('compares versions numerically, not as strings', () => {
    expect(resolveAutoTour('0.9.0', '0.10.0')).toBe('whatsNew')
  })
})

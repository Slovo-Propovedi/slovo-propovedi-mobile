import { resolveAutoTour } from './resolveAutoTour'

const CONTENT_FINGERPRINT = 'a1b2c3d4'

describe('resolveAutoTour', () => {
  test('plays the welcome tour when no content was seen yet', () => {
    expect(resolveAutoTour(null, CONTENT_FINGERPRINT, true)).toBe('welcome')
  })

  test('plays the whats-new tour when the stored fingerprint belongs to older content', () => {
    expect(resolveAutoTour('deadbeef', CONTENT_FINGERPRINT, true)).toBe('whatsNew')
  })

  test('plays nothing when the current content fingerprint was already seen', () => {
    expect(resolveAutoTour(CONTENT_FINGERPRINT, CONTENT_FINGERPRINT, true)).toBeNull()
  })

  test('does not re-show identical content after an app version bump', () => {
    // A hotfix/OTA that only bumps the version keeps the steps unchanged, so the
    // fingerprint matches and the tour stays silent — the version is not a gate input.
    expect(resolveAutoTour(CONTENT_FINGERPRINT, CONTENT_FINGERPRINT, true)).toBeNull()
  })

  test('re-shows the tour once when the stored value is a legacy app version', () => {
    // Devices upgraded from the version-gated releases still store strings like
    // '0.32.0'; such a value never equals a fingerprint, so the new content shows once.
    expect(resolveAutoTour('0.32.0', CONTENT_FINGERPRINT, true)).toBe('whatsNew')
  })

  test('plays nothing when the release ships no whats-new steps', () => {
    // A release without user-visible novelties keeps an empty scenario and stays
    // silent even though the stored fingerprint differs.
    expect(resolveAutoTour('deadbeef', CONTENT_FINGERPRINT, false)).toBeNull()
  })

  test('still plays the welcome tour on a fresh install of a silent release', () => {
    expect(resolveAutoTour(null, CONTENT_FINGERPRINT, false)).toBe('welcome')
  })
})

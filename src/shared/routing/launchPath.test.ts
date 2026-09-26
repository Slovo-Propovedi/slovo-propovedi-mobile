import { extractLaunchPath, shouldAttemptRecovery } from './launchPath'

const HTTPS_PLAYLIST_URL = 'https://app.slovo-propovedi.ru/listen/playlist?playlist=x'
const HTTPS_HOST = 'https://app.slovo-propovedi.ru'
const CUSTOM_SCHEME_URL = 'slovo-propovedi://foo/bar?a=1'
const CUSTOM_SCHEME_HOST = 'slovo-propovedi://'
const TRIPLE_SLASH_PLAYLIST_URL = 'slovo-propovedi:///listen/playlist?playlist=x'
const TRIPLE_SLASH_ROOT_URL = 'slovo-propovedi:///'

describe('extractLaunchPath', () => {
  test('extracts path and query from an https URL', () => {
    expect(extractLaunchPath(HTTPS_PLAYLIST_URL)).toBe('/listen/playlist?playlist=x')
  })

  test('returns null for a host-only https URL', () => {
    expect(extractLaunchPath(HTTPS_HOST)).toBeNull()
  })

  test('extracts path and query from a custom-scheme URL', () => {
    expect(extractLaunchPath(CUSTOM_SCHEME_URL)).toBe('/foo/bar?a=1')
  })

  test('returns null for a host-only custom-scheme URL', () => {
    expect(extractLaunchPath(CUSTOM_SCHEME_HOST)).toBeNull()
  })

  test('normalizes an empty authority in a triple-slash custom-scheme URL', () => {
    expect(extractLaunchPath(TRIPLE_SLASH_PLAYLIST_URL)).toBe('/listen/playlist?playlist=x')
  })

  test('returns null for a triple-slash custom-scheme root', () => {
    expect(extractLaunchPath(TRIPLE_SLASH_ROOT_URL)).toBeNull()
  })

  test('returns null for garbage', () => {
    expect(extractLaunchPath('not-a-url')).toBeNull()
  })

  test('returns null for empty or whitespace input', () => {
    expect(extractLaunchPath('')).toBeNull()
    expect(extractLaunchPath('   ')).toBeNull()
  })

  test('returns the root path unchanged', () => {
    expect(extractLaunchPath(`${HTTPS_HOST}/listen`)).toBe('/listen')
  })
})

describe('shouldAttemptRecovery', () => {
  test('recovers a playlist link from the listen fallback', () => {
    expect(shouldAttemptRecovery('/listen', '/listen/playlist?playlist=x')).toBe(true)
  })

  test('recovers from the index redirect', () => {
    expect(shouldAttemptRecovery('/', '/listen')).toBe(true)
  })

  test('does not recover when the launch path matches the current route', () => {
    expect(shouldAttemptRecovery('/listen', '/listen')).toBe(false)
  })

  test('does not recover without a launch path', () => {
    expect(shouldAttemptRecovery('/listen', null)).toBe(false)
  })

  test('does not hijack user navigation away from the fallback', () => {
    expect(shouldAttemptRecovery('/settings', '/listen/playlist')).toBe(false)
  })
})

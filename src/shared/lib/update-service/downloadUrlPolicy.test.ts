import { ALLOWED_UPDATE_URL_PREFIXES, assertAllowedUpdateUrl } from './downloadUrlPolicy'

const ASSET_PATH = 'v0.3.0/slovo-propovedi-v0.3.0.zip'
const GITHUB_PREFIX = 'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/'
const NOT_ALLOWED = 'Update download URL is not allowed'
const UNSAFE_PATH = 'Unsafe path in update download URL'

describe('assertAllowedUpdateUrl', () => {
  test.each(ALLOWED_UPDATE_URL_PREFIXES)('accepts release assets under %s', prefix => {
    expect(() => assertAllowedUpdateUrl(`${prefix}${ASSET_PATH}`)).not.toThrow()
  })

  test('rejects a host outside the allowlist', () => {
    expect(() =>
      assertAllowedUpdateUrl(`https://evil.example/releases/download/${ASSET_PATH}`),
    ).toThrow(NOT_ALLOWED)
  })

  test('rejects another repository on an allowed host', () => {
    expect(() =>
      assertAllowedUpdateUrl(`https://github.com/attacker/app/releases/download/${ASSET_PATH}`),
    ).toThrow(NOT_ALLOWED)
  })

  test('rejects userinfo tricks that fool the React Native URL polyfill', () => {
    expect(() =>
      assertAllowedUpdateUrl(
        `https://evil.example/@${GITHUB_PREFIX.slice('https://'.length)}x.zip`,
      ),
    ).toThrow(NOT_ALLOWED)
    expect(() =>
      assertAllowedUpdateUrl('https://github.com@evil.example/Slovo-Propovedi/x.zip'),
    ).toThrow(NOT_ALLOWED)
  })

  test.each(['../../../attacker/app/x.zip', 'v1/%2e%2e/%2E%2E/x.zip', 'v1\\x.zip', '..'])(
    'rejects path escapes: %s',
    suffix => {
      expect(() => assertAllowedUpdateUrl(`${GITHUB_PREFIX}${suffix}`)).toThrow(UNSAFE_PATH)
    },
  )

  test('rejects a non-https URL', () => {
    expect(() => assertAllowedUpdateUrl(GITHUB_PREFIX.replace('https', 'http'))).toThrow(
      'Update download URL must use https',
    )
  })

  test('rejects an unparsable URL', () => {
    expect(() => assertAllowedUpdateUrl('not a url')).toThrow('must use https')
  })
})

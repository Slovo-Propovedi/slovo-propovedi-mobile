import {
  LATEST_RELEASE_API_URLS,
  PROJECT_REPOSITORY_URL,
  RELEASE_DOWNLOAD_URL_PREFIXES,
} from './repository'

// __mocks__/env.js pins the production repository coordinates.
describe('repository config', () => {
  test('derives the project, release-API and download URLs from the coordinates', () => {
    expect(PROJECT_REPOSITORY_URL).toBe(
      'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile',
    )
    expect(LATEST_RELEASE_API_URLS).toEqual({
      codeberg:
        'https://codeberg.org/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest',
      forgejo:
        'https://git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest',
      github: 'https://api.github.com/repos/Slovo-Propovedi/slovo-propovedi-mobile/releases/latest',
    })
    expect(RELEASE_DOWNLOAD_URL_PREFIXES).toEqual([
      'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases/download/',
      'https://codeberg.org/Slovo_Propovedi/slovo-propovedi-mobile/releases/download/',
      'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/',
    ])
  })

  // The coordinates also build the update-download allowlist, so a malformed
  // value must fail config loading instead of widening a prefix.
  test.each([
    ['EXPO_PUBLIC_REPOSITORY_URL', 'https://git.lightnode.ru/evil'],
    ['EXPO_PUBLIC_REPOSITORY_URL', 'http://git.lightnode.ru'],
    ['EXPO_PUBLIC_MIRROR_CODEBERG_URL', 'javascript:alert(1)'],
    ['EXPO_PUBLIC_MIRROR_GITHUB_ORG', 'Slovo-Propovedi/evil'],
    ['EXPO_PUBLIC_MOBILE_REPOSITORY_NAME', ''],
  ])('rejects %s=%p at load time', (name, value) => {
    const original = process.env[name]
    process.env[name] = value
    try {
      // A fresh module registry re-runs env.ts's load-time validation.
      expect(() => jest.isolateModules(() => jest.requireActual('./env'))).toThrow(
        'Invalid environment configuration',
      )
    } finally {
      process.env[name] = original
    }
  })
})

import { compareVersions } from './compareVersions'

describe('compareVersions', () => {
  test('returns 0 for equal versions', () => {
    expect(compareVersions('0.2.1', '0.2.1')).toBe(0)
  })

  test('returns 1 when the first version is newer', () => {
    expect(compareVersions('0.2.2', '0.2.1')).toBe(1)
  })

  test('returns -1 when the first version is older', () => {
    expect(compareVersions('0.2.0', '0.2.1')).toBe(-1)
  })

  test('returns 1 for a major version difference', () => {
    expect(compareVersions('1.0.0', '0.9.9')).toBe(1)
  })

  test('strips the v prefix from the first version', () => {
    expect(compareVersions('v0.2.2', '0.2.1')).toBe(1)
  })

  test('returns 0 when both versions have the v prefix', () => {
    expect(compareVersions('v0.2.1', 'v0.2.1')).toBe(0)
  })

  test('treats a missing segment as 0 in the second version', () => {
    expect(compareVersions('0.2.1', '0.2')).toBe(1)
  })

  test('treats a missing segment as 0 in the first version', () => {
    expect(compareVersions('0.2', '0.2.1')).toBe(-1)
  })

  test('strips pre-release suffixes before comparing', () => {
    expect(compareVersions('0.3.0-rc.1', '0.3.0')).toBe(0)
  })

  test('returns -1 for a patch version difference', () => {
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1)
  })

  test('handles multi-digit version numbers', () => {
    expect(compareVersions('10.0.0', '9.9.9')).toBe(1)
  })
})

const mockDownloadUpdateZip = jest.fn()
const mockFetchLatestRelease = jest.fn()

jest.mock('shared/lib/update-service', () => ({
  downloadUpdateZip: (...args: unknown[]) => mockDownloadUpdateZip(...args),
}))

jest.mock('shared/lib/version-check', () => ({
  ...jest.requireActual('shared/lib/version-check'),
  fetchLatestRelease: (...args: unknown[]) => mockFetchLatestRelease(...args),
}))

import { createCtx } from '@reatom/framework'
import type { LatestReleaseInfo } from 'shared/lib/version-check'
import { latestVersionAtom, releaseUrlAtom, zipDownloadUrlAtom } from './update'
import { updateProgressAtom } from './updateInstall'
import { downloadUpdateZipWithFallback, getFallbackDownloadUrl } from './updateInstallFallback'

const FAILED_URL = 'https://forgejo.example.com/slovo-propovedi-v0.3.0.zip'
const FALLBACK_URL =
  'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/v0.3.0/slovo-propovedi-v0.3.0.zip'
const RELEASE_HTML_URL =
  'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/tag/v0.3.0'
const DOWNLOADED_ZIP_PATH = '/cache/updates/slovo-propovedi-update.zip'
const FORGEJO_ERROR_MESSAGE = 'forgejo dead'
const GITHUB_ERROR_MESSAGE = 'github dead'

const makeRelease = (zipDownloadUrl: null | string, version = '0.3.0'): LatestReleaseInfo => ({
  body: 'Release notes',
  htmlUrl: RELEASE_HTML_URL,
  name: 'Слово.Проповеди v0.3.0',
  publishedAt: '2026-08-01T00:00:00Z',
  tagName: `v${version}`,
  version,
  zipDownloadUrl,
})

describe('getFallbackDownloadUrl', () => {
  test('returns null when the release is unavailable', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', null)).toBeNull()
  })

  test('returns null when the release has no zip asset', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(null))).toBeNull()
  })

  test('returns null when the fallback URL equals the failed URL', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(FAILED_URL))).toBeNull()
  })

  test('returns the new URL when it differs from the failed URL', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(FALLBACK_URL))).toBe(
      FALLBACK_URL,
    )
  })

  test('rejects an older fallback version', () => {
    expect(
      getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(FALLBACK_URL, '0.2.9')),
    ).toBeNull()
  })

  test('accepts the same fallback version', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(FALLBACK_URL, '0.3.0'))).toBe(
      FALLBACK_URL,
    )
  })

  test('accepts a newer fallback version', () => {
    expect(getFallbackDownloadUrl(FAILED_URL, '0.3.0', makeRelease(FALLBACK_URL, '0.3.1'))).toBe(
      FALLBACK_URL,
    )
  })
})

describe('downloadUpdateZipWithFallback', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('retries once with the new URL and refreshes atoms when the first download fails', async () => {
    mockDownloadUpdateZip
      .mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
      .mockResolvedValueOnce(DOWNLOADED_ZIP_PATH)
    mockFetchLatestRelease.mockResolvedValue(makeRelease(FALLBACK_URL))
    const ctx = createCtx()

    const zipPath = await downloadUpdateZipWithFallback(ctx, FAILED_URL)

    expect(zipPath).toBe(DOWNLOADED_ZIP_PATH)
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(2)
    expect(mockDownloadUpdateZip).toHaveBeenNthCalledWith(1, FAILED_URL, expect.any(Function))
    expect(mockDownloadUpdateZip).toHaveBeenNthCalledWith(2, FALLBACK_URL, expect.any(Function))
    expect(ctx.get(updateProgressAtom)).toBe(0)
    expect(ctx.get(latestVersionAtom)).toBe('0.3.0')
    expect(ctx.get(releaseUrlAtom)).toBe(RELEASE_HTML_URL)
    expect(ctx.get(zipDownloadUrlAtom)).toBe(FALLBACK_URL)
  })

  test('rethrows the original error when the release is unavailable', async () => {
    mockDownloadUpdateZip.mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
    mockFetchLatestRelease.mockResolvedValue(null)
    const ctx = createCtx()

    await expect(downloadUpdateZipWithFallback(ctx, FAILED_URL)).rejects.toThrow(
      FORGEJO_ERROR_MESSAGE,
    )
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(1)
  })

  test('rethrows the original error when the release has no zip asset', async () => {
    mockDownloadUpdateZip.mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
    mockFetchLatestRelease.mockResolvedValue(makeRelease(null))
    const ctx = createCtx()

    await expect(downloadUpdateZipWithFallback(ctx, FAILED_URL)).rejects.toThrow(
      FORGEJO_ERROR_MESSAGE,
    )
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(1)
  })

  test('rethrows the original error when the fallback URL equals the failed URL', async () => {
    mockDownloadUpdateZip.mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
    mockFetchLatestRelease.mockResolvedValue(makeRelease(FAILED_URL))
    const ctx = createCtx()

    await expect(downloadUpdateZipWithFallback(ctx, FAILED_URL)).rejects.toThrow(
      FORGEJO_ERROR_MESSAGE,
    )
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(1)
  })

  test('rejects the fallback when the mirror lags behind the failed version', async () => {
    mockDownloadUpdateZip.mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
    mockFetchLatestRelease.mockResolvedValue(makeRelease(FALLBACK_URL, '0.2.9'))
    const ctx = createCtx()
    latestVersionAtom(ctx, '0.3.0')

    await expect(downloadUpdateZipWithFallback(ctx, FAILED_URL)).rejects.toThrow(
      FORGEJO_ERROR_MESSAGE,
    )
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(1)
  })

  test('rethrows the original error when the retry also fails', async () => {
    mockDownloadUpdateZip
      .mockRejectedValueOnce(new Error(FORGEJO_ERROR_MESSAGE))
      .mockRejectedValueOnce(new Error(GITHUB_ERROR_MESSAGE))
    mockFetchLatestRelease.mockResolvedValue(makeRelease(FALLBACK_URL))
    const ctx = createCtx()

    const error = await downloadUpdateZipWithFallback(ctx, FAILED_URL).catch(e => e)

    expect(error).toHaveProperty('message', FORGEJO_ERROR_MESSAGE)
    expect(mockDownloadUpdateZip).toHaveBeenCalledTimes(2)
  })
})

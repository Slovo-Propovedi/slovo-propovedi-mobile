/* eslint-disable camelcase -- GitHub/Forgejo release API fields are snake_case */
import axios from 'axios'
import { fetchLatestRelease } from './fetchLatestRelease'
import { type LatestReleaseInfo } from './types'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

const FORGEJO_API_URL =
  'https://git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest'
const CODEBERG_API_URL =
  'https://codeberg.org/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest'
const GITHUB_API_URL =
  'https://api.github.com/repos/Slovo-Propovedi/slovo-propovedi-mobile/releases/latest'
const ZIP_DOWNLOAD_URL = 'https://example.com/releases/download/v0.3.0/slovo-propovedi-v0.3.0.zip'
const WEB_ZIP_DOWNLOAD_URL =
  'https://example.com/releases/download/v0.3.0/slovo-propovedi-web-v0.3.0.zip'
const SUMS_DOWNLOAD_URL = 'https://example.com/releases/download/v0.3.0/SHA256SUMS.txt'
const APK_ZIP_ASSET = { browser_download_url: ZIP_DOWNLOAD_URL, name: 'slovo-propovedi-v0.3.0.zip' }
const WEB_ZIP_ASSET = {
  browser_download_url: WEB_ZIP_DOWNLOAD_URL,
  name: 'slovo-propovedi-web-v0.3.0.zip',
}
const RELEASE_BODY = 'Release notes\r\nSecond line'
const FORGEJO_RELEASE_HTML_URL =
  'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases/tag/v0.3.0'
const CODEBERG_RELEASE_HTML_URL =
  'https://codeberg.org/Slovo_Propovedi/slovo-propovedi-mobile/releases/tag/v0.3.0'
const GITHUB_RELEASE_HTML_URL =
  'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/tag/v0.3.0'
const RELEASE_NAME = 'Слово.Проповеди v0.3.0'
const RELEASE_PUBLISHED_AT = '2026-08-01T00:00:00Z'
const RELEASE_TAG = 'v0.3.0'

const validRelease = {
  assets: [APK_ZIP_ASSET, { browser_download_url: SUMS_DOWNLOAD_URL, name: 'SHA256SUMS.txt' }],
  body: RELEASE_BODY,
  draft: false,
  html_url: FORGEJO_RELEASE_HTML_URL,
  name: RELEASE_NAME,
  prerelease: false,
  published_at: RELEASE_PUBLISHED_AT,
  tag_name: RELEASE_TAG,
}

const makeExpectedRelease = (htmlUrl: string): LatestReleaseInfo => ({
  body: 'Release notes\nSecond line',
  htmlUrl,
  name: RELEASE_NAME,
  publishedAt: RELEASE_PUBLISHED_AT,
  sha256SumsDownloadUrl: SUMS_DOWNLOAD_URL,
  tagName: RELEASE_TAG,
  version: '0.3.0',
  zipDownloadUrl: ZIP_DOWNLOAD_URL,
})

describe('fetchLatestRelease', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  test('returns parsed release info when Forgejo succeeds', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: validRelease })

    const result = await fetchLatestRelease()

    expect(result).toEqual(makeExpectedRelease(FORGEJO_RELEASE_HTML_URL))
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    expect(mockedAxios.get).toHaveBeenCalledWith(FORGEJO_API_URL, { timeout: 10000 })
  })

  test('falls back to Codeberg when Forgejo fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Forgejo unavailable'))
    mockedAxios.get.mockResolvedValueOnce({
      data: { ...validRelease, html_url: CODEBERG_RELEASE_HTML_URL },
    })

    const result = await fetchLatestRelease()

    expect(result).toEqual(makeExpectedRelease(CODEBERG_RELEASE_HTML_URL))
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    expect(mockedAxios.get).toHaveBeenNthCalledWith(2, CODEBERG_API_URL, { timeout: 10000 })
  })

  test('falls back to GitHub when Forgejo and Codeberg fail', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Forgejo unavailable'))
    mockedAxios.get.mockRejectedValueOnce(new Error('Codeberg unavailable'))
    mockedAxios.get.mockResolvedValueOnce({
      data: { ...validRelease, html_url: GITHUB_RELEASE_HTML_URL },
    })

    const result = await fetchLatestRelease()

    expect(result).toEqual(makeExpectedRelease(GITHUB_RELEASE_HTML_URL))
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    expect(mockedAxios.get).toHaveBeenNthCalledWith(3, GITHUB_API_URL, { timeout: 10000 })
  })

  test('returns null when all sources fail', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'))

    const result = await fetchLatestRelease()

    expect(result).toBeNull()
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
  })

  test('returns null for a prerelease', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { ...validRelease, prerelease: true } })

    const result = await fetchLatestRelease()

    expect(result).toBeNull()
  })

  test('returns null when the tag contains a pre-release suffix', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { ...validRelease, tag_name: 'v0.3.0-rc.1' } })

    const result = await fetchLatestRelease()

    expect(result).toBeNull()
  })

  test('returns null for an invalid response', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} })

    const result = await fetchLatestRelease()

    expect(result).toBeNull()
  })

  test('finds the checksum asset case-insensitively', async () => {
    const release = {
      ...validRelease,
      assets: [{ browser_download_url: SUMS_DOWNLOAD_URL, name: 'sha256sums.TXT' }],
    }
    mockedAxios.get.mockResolvedValueOnce({ data: release })

    const result = await fetchLatestRelease()

    expect(result?.sha256SumsDownloadUrl).toBe(SUMS_DOWNLOAD_URL)
  })

  test('returns a null checksum URL for a legacy release without the sums asset', async () => {
    const release = { ...validRelease, assets: [APK_ZIP_ASSET] }
    mockedAxios.get.mockResolvedValueOnce({ data: release })

    const result = await fetchLatestRelease()

    expect(result?.sha256SumsDownloadUrl).toBeNull()
  })

  test('returns a null zip URL when only the web export asset is attached', async () => {
    const release = {
      ...validRelease,
      assets: [WEB_ZIP_ASSET, { browser_download_url: SUMS_DOWNLOAD_URL, name: 'SHA256SUMS.txt' }],
    }
    mockedAxios.get.mockResolvedValueOnce({ data: release })

    const result = await fetchLatestRelease()

    expect(result?.zipDownloadUrl).toBeNull()
    expect(result?.sha256SumsDownloadUrl).toBe(SUMS_DOWNLOAD_URL)
  })

  test.each([
    { assets: [WEB_ZIP_ASSET, APK_ZIP_ASSET], label: 'web export first' },
    { assets: [APK_ZIP_ASSET, WEB_ZIP_ASSET], label: 'APK first' },
  ])('selects the APK zip when the web export is also attached ($label)', async ({ assets }) => {
    mockedAxios.get.mockResolvedValueOnce({ data: { ...validRelease, assets } })

    const result = await fetchLatestRelease()

    expect(result?.zipDownloadUrl).toBe(ZIP_DOWNLOAD_URL)
  })
})

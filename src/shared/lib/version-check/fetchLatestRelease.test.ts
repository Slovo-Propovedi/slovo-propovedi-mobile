/* eslint-disable camelcase -- GitHub/Forgejo release API fields are snake_case */
import axios from 'axios'
import type { LatestReleaseInfo } from './types'
import { fetchLatestRelease } from './fetchLatestRelease'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

const FORGEJO_API_URL =
  'https://git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest'
const GITHUB_API_URL =
  'https://api.github.com/repos/Slovo-Propovedi/slovo-propovedi-mobile/releases/latest'
const ZIP_DOWNLOAD_URL = 'https://example.com/releases/download/v0.3.0/slovo-propovedi-v0.3.0.zip'
const RELEASE_BODY = 'Release notes\r\nSecond line'
const RELEASE_HTML_URL = 'https://example.com/releases/tag/v0.3.0'
const RELEASE_NAME = 'Слово.Проповеди v0.3.0'
const RELEASE_PUBLISHED_AT = '2026-08-01T00:00:00Z'
const RELEASE_TAG = 'v0.3.0'

const validRelease = {
  assets: [{ browser_download_url: ZIP_DOWNLOAD_URL, name: 'slovo-propovedi-v0.3.0.zip' }],
  body: RELEASE_BODY,
  draft: false,
  html_url: RELEASE_HTML_URL,
  name: RELEASE_NAME,
  prerelease: false,
  published_at: RELEASE_PUBLISHED_AT,
  tag_name: RELEASE_TAG,
}

const expectedRelease: LatestReleaseInfo = {
  body: 'Release notes\nSecond line',
  htmlUrl: RELEASE_HTML_URL,
  name: RELEASE_NAME,
  publishedAt: RELEASE_PUBLISHED_AT,
  tagName: RELEASE_TAG,
  version: '0.3.0',
  zipDownloadUrl: ZIP_DOWNLOAD_URL,
}

describe('fetchLatestRelease', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  test('returns parsed release info when Forgejo succeeds', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: validRelease })

    const result = await fetchLatestRelease()

    expect(result).toEqual(expectedRelease)
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    expect(mockedAxios.get).toHaveBeenCalledWith(FORGEJO_API_URL, { timeout: 10000 })
  })

  test('falls back to GitHub when Forgejo fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Forgejo unavailable'))
    mockedAxios.get.mockResolvedValueOnce({ data: validRelease })

    const result = await fetchLatestRelease()

    expect(result).toEqual(expectedRelease)
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    expect(mockedAxios.get).toHaveBeenNthCalledWith(2, GITHUB_API_URL, { timeout: 10000 })
  })

  test('returns null when both sources fail', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network down'))

    const result = await fetchLatestRelease()

    expect(result).toBeNull()
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
})

import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { reportError } from 'shared/model/error-dialog'
import { startBackgroundCaching } from '../BackgroundCachingService'
import { resolvePlaybackUrl } from './resolvePlaybackUrl'

const AUDIO_URL = 'https://example.com/audio.mp3'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { getCachedUri: jest.fn() },
  getPartialFileUri: jest.fn(),
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('../BackgroundCachingService', () => ({ startBackgroundCaching: jest.fn() }))

const mockedGetCachedUri = jest.mocked(audioCacheService.getCachedUri)
const mockedGetPartialFileUri = jest.mocked(getPartialFileUri)
const mockedStartBackgroundCaching = jest.mocked(startBackgroundCaching)
const mockedReportError = jest.mocked(reportError)

describe('resolvePlaybackUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCachedUri.mockResolvedValue(null)
    mockedGetPartialFileUri.mockResolvedValue(null)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns the cached URI and skips background caching', async () => {
    const cachedUri = 'file:///data/cache/audio.mp3'
    mockedGetCachedUri.mockResolvedValue(cachedUri)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(cachedUri)
    expect(mockedStartBackgroundCaching).not.toHaveBeenCalled()
    expect(mockedGetPartialFileUri).not.toHaveBeenCalled()
  })

  test('returns the partial URI when cache misses and a partial exists', async () => {
    const partialUri = 'file:///data/cache/abc.cache.mp3'
    mockedGetPartialFileUri.mockResolvedValue(partialUri)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(partialUri)
    expect(mockedStartBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('returns the network URL when nothing local exists', async () => {
    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(AUDIO_URL)
    expect(mockedStartBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('falls back to network URL when the cache check rejects (no throw)', async () => {
    mockedGetCachedUri.mockRejectedValue(new Error('cache check failed'))

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(AUDIO_URL)
    expect(mockedStartBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedReportError).toHaveBeenCalledWith(
      expect.any(Error),
      'Ошибка при проверке офлайн-копии аудио',
    )
  })
})

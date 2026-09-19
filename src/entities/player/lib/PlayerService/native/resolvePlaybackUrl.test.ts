import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { startBackgroundCaching } from '../BackgroundCachingService'
import { resolvePlaybackUrl } from './resolvePlaybackUrl'

const AUDIO_URL = 'https://example.com/audio.mp3'
const CACHED_URI = 'file:///data/cache/audio.mp3'
const PARTIAL_URI = 'file:///data/cache/abc.cache.mp3'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { getCachedUri: jest.fn() },
  getPartialFileUri: jest.fn(),
}))

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/model/network', () => ({ isOnlineAtom: {} }))

jest.mock('../BackgroundCachingService', () => ({ startBackgroundCaching: jest.fn() }))

const mockedGetCachedUri = jest.mocked(audioCacheService.getCachedUri)
const mockedGetPartialFileUri = jest.mocked(getPartialFileUri)
const mockedStartBackgroundCaching = jest.mocked(startBackgroundCaching)
const mockedReportError = jest.mocked(reportError)
const mockedCtxGet = jest.mocked(ctx.get)

describe('resolvePlaybackUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetCachedUri.mockResolvedValue(null)
    mockedGetPartialFileUri.mockResolvedValue(null)
    mockedCtxGet.mockReturnValue(true)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns the cached URI and skips background caching', async () => {
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(CACHED_URI)
    expect(mockedStartBackgroundCaching).not.toHaveBeenCalled()
    expect(mockedGetPartialFileUri).not.toHaveBeenCalled()
  })

  test('cached URI wins over an offline partial', async () => {
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    mockedCtxGet.mockReturnValue(false)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(CACHED_URI)
    expect(mockedGetPartialFileUri).not.toHaveBeenCalled()
  })

  test('returns the partial URI when offline and a partial exists', async () => {
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    mockedCtxGet.mockReturnValue(false)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(PARTIAL_URI)
    expect(mockedStartBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('does not delete the partial and returns the network URL when online', async () => {
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)

    const result = await resolvePlaybackUrl(AUDIO_URL)

    expect(result).toBe(AUDIO_URL)
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

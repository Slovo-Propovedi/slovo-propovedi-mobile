import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { showInfo } from 'shared/model/info-dialog'
import { bufferedProgressStateAtom } from './download-model'
import { guardOfflinePlayback } from './playOfflineGuard'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
  getPartialFileUri: jest.fn(),
}))

jest.mock('shared/model/info-dialog', () => ({
  showInfo: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'

describe('guardOfflinePlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    bufferedProgressStateAtom(ctx, null)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)
    jest.mocked(getPartialFileUri).mockResolvedValue(null)
  })

  test('online → allowed, cache not checked', async () => {
    await expect(guardOfflinePlayback(AUDIO_URL, true)).resolves.toBe(false)

    expect(audioCacheService.isCached).not.toHaveBeenCalled()
    expect(showInfo).not.toHaveBeenCalled()
  })

  test('offline + cached → allowed without dialog', async () => {
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)

    await expect(guardOfflinePlayback(AUDIO_URL, false)).resolves.toBe(false)

    expect(showInfo).not.toHaveBeenCalled()
  })

  test('offline + uncached → blocked and dialog shown', async () => {
    await expect(guardOfflinePlayback(AUDIO_URL, false)).resolves.toBe(true)

    expect(showInfo).toHaveBeenCalledTimes(1)
  })

  test('offline + uncached + retained partial → allowed without dialog (no flag)', async () => {
    jest.mocked(getPartialFileUri).mockResolvedValue('file:///data/cache/abc.cache.mp3')

    await expect(guardOfflinePlayback(AUDIO_URL, false)).resolves.toBe(false)

    expect(showInfo).not.toHaveBeenCalled()
  })

  test('offline + uncached + partially buffered → allowed without dialog', async () => {
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    await expect(guardOfflinePlayback(AUDIO_URL, false, true)).resolves.toBe(false)

    expect(showInfo).not.toHaveBeenCalled()
  })

  test('offline + uncached + buffered progress 0 → blocked', async () => {
    bufferedProgressStateAtom(ctx, { progress: 0, url: AUDIO_URL })

    await expect(guardOfflinePlayback(AUDIO_URL, false, true)).resolves.toBe(true)

    expect(showInfo).toHaveBeenCalledTimes(1)
  })

  test('offline + uncached + buffered url mismatch → blocked', async () => {
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: OTHER_URL })

    await expect(guardOfflinePlayback(AUDIO_URL, false, true)).resolves.toBe(true)

    expect(showInfo).toHaveBeenCalledTimes(1)
  })

  test('default flag + matching buffered state → blocked (fresh load semantics)', async () => {
    bufferedProgressStateAtom(ctx, { progress: 0.4, url: AUDIO_URL })

    await expect(guardOfflinePlayback(AUDIO_URL, false)).resolves.toBe(true)

    expect(showInfo).toHaveBeenCalledTimes(1)
  })
})

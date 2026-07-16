import { createCtx, type Ctx } from '@reatom/framework'
import { incrementCacheTrigger, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from '../download-model'
import { startBackgroundCaching } from './BackgroundCachingService'

const TEST_URL = 'https://example.com/audio.mp3'
const SECOND_URL = 'https://example.com/audio2.mp3'
const CACHED_URI = 'file://cached.mp3'

let mockCtx: Ctx

jest.mock('shared/lib/reatom-ctx', () => ({
  get ctx() {
    return mockCtx
  },
}))

const mockCacheAudio = jest.fn<Promise<string>, [string, ((progress: number) => void)?]>()

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: {
    cacheAudio: (...args: Parameters<typeof mockCacheAudio>) => mockCacheAudio(...args),
  },
}))

jest.mock('shared/lib/cache-triggers', () => {
  const actual = jest.requireActual('shared/lib/cache-triggers')
  return {
    ...actual,
    incrementCacheTrigger: jest.fn(actual.incrementCacheTrigger),
  }
})

const mockIncrementCacheTrigger = jest.mocked(incrementCacheTrigger)

const flushPromises = () => new Promise<void>(resolve => setImmediate(resolve))

describe('BackgroundCachingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCtx = createCtx()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('empty audioUrl guard', () => {
    test('returns early without calling cacheAudio', () => {
      startBackgroundCaching('')
      expect(mockCacheAudio).not.toHaveBeenCalled()
    })

    test('does not set downloading state for empty url', () => {
      startBackgroundCaching('')
      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('progress updates', () => {
    test('updates both atoms when onProgress is called', () => {
      let onProgressCb: ((progress: number) => void) | undefined
      mockCacheAudio.mockImplementation((_url: string, onProgress?: (progress: number) => void) => {
        onProgressCb = onProgress
        return new Promise<string>(() => {})
      })

      startBackgroundCaching(TEST_URL)
      onProgressCb?.(0.5)

      expect(mockCtx.get(downloadProgressAtom)).toBe(0.5)
      expect(mockCtx.get(playlistDownloadProgressAtom)).toEqual({ [TEST_URL]: 0.5 })
    })

    test('tracks initial progress as 0', () => {
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))
      startBackgroundCaching(TEST_URL)
      expect(mockCtx.get(playlistDownloadProgressAtom)).toEqual({ [TEST_URL]: 0 })
    })
  })

  describe('cleanup on success', () => {
    test('removes per-track key and calls incrementCacheTrigger', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(playlistDownloadProgressAtom)).not.toHaveProperty(TEST_URL)
      expect(mockIncrementCacheTrigger).toHaveBeenCalledTimes(1)
    })

    test('resets downloadProgressAtom to 0 after completion', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
    })

    test('resets global downloading state after success', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('cleanup on error', () => {
    test('removes per-track key without calling incrementCacheTrigger', async () => {
      mockCacheAudio.mockRejectedValue(new Error('download failed'))
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(playlistDownloadProgressAtom)).not.toHaveProperty(TEST_URL)
      expect(mockIncrementCacheTrigger).not.toHaveBeenCalled()
    })

    test('resets global downloading state after error', async () => {
      mockCacheAudio.mockRejectedValue(new Error('download failed'))
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('incrementCacheTrigger fires on success only', () => {
    test('called in .then but not in .catch', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()
      expect(mockIncrementCacheTrigger).toHaveBeenCalledTimes(1)

      mockIncrementCacheTrigger.mockClear()

      mockCacheAudio.mockRejectedValue(new Error('fail'))
      startBackgroundCaching(SECOND_URL)
      await flushPromises()
      expect(mockIncrementCacheTrigger).not.toHaveBeenCalled()
    })
  })

  describe('race condition guard', () => {
    test('does not reset global state when downloadingAudioUrlAtom was overwritten', async () => {
      const resolveRef = { current: null as ((value: string) => void) | null }
      const firstPromise = new Promise<string>(r => {
        resolveRef.current = r
      })
      mockCacheAudio.mockReturnValueOnce(firstPromise)

      startBackgroundCaching(TEST_URL)
      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(TEST_URL)

      // Simulate second download overwriting the URL
      downloadingAudioUrlAtom(mockCtx, SECOND_URL)

      // Simulate second download having its own progress
      downloadProgressAtom(mockCtx, 0.5)

      // First download completes
      resolveRef.current?.(CACHED_URI)
      await flushPromises()

      // Global state should NOT be cleared because we're no longer the active downloader
      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(SECOND_URL)
      // Progress should NOT be clobbered to 0 — second download is still active
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.5)
    })

    test('resets global state when still the active downloader', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('setting downloading state on start', () => {
    test('sets atoms before calling cacheAudio', () => {
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))
      startBackgroundCaching(TEST_URL)

      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(TEST_URL)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
      expect(mockCtx.get(playlistDownloadProgressAtom)).toEqual({ [TEST_URL]: 0 })
    })
  })
})

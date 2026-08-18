import { createCtx, type Ctx } from '@reatom/framework'
import { incrementCacheTrigger, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from '../download-model'
import {
  _resetInFlightDownloadsForTesting,
  startBackgroundCaching,
} from './BackgroundCachingService'

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
    _resetInFlightDownloadsForTesting()
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

    test('sets downloadProgressAtom to 1 after completion', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      expect(mockCtx.get(downloadProgressAtom)).toBe(1)
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

    test('late ticks and stale completion of old download do not clobber active download state', async () => {
      const resolveRef = { current: null as ((value: string) => void) | null }
      let onProgressCbA: ((progress: number) => void) | undefined
      mockCacheAudio.mockImplementationOnce(
        (_url: string, onProgress?: (progress: number) => void) => {
          onProgressCbA = onProgress
          return new Promise<string>(r => {
            resolveRef.current = r
          })
        },
      )

      // Start download A, advance it
      startBackgroundCaching(TEST_URL)
      onProgressCbA?.(0.4)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.4)

      // Switch to download B (as startBackgroundCaching(B) would do)
      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      // Late progress ticks from A — must NOT clobber global progress
      onProgressCbA?.(0.8)
      onProgressCbA?.(1.0)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.7)
      // Per-URL record for A is still updated (track-list shows old track's bar)
      expect(mockCtx.get(playlistDownloadProgressAtom)[TEST_URL]).toBe(1.0)

      // Resolve A's download — .then fires incrementCacheTrigger + removeTrackProgress,
      // .finally skips global state reset because downloadingAudioUrlAtom !== A
      resolveRef.current?.(CACHED_URI)
      await flushPromises()

      // incrementCacheTrigger DID fire (successful background cache, by design)
      expect(mockIncrementCacheTrigger).toHaveBeenCalledTimes(1)
      // Per-URL record for A was cleaned up
      expect(mockCtx.get(playlistDownloadProgressAtom)).not.toHaveProperty(TEST_URL)
      // Global state still belongs to B — stale completion did not clobber it
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.7)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(SECOND_URL)
      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
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

  describe('single-flight guard', () => {
    test('second startBackgroundCaching with same URL does not call cacheAudio again', () => {
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)
      startBackgroundCaching(TEST_URL)

      expect(mockCacheAudio).toHaveBeenCalledTimes(1)
    })

    test('allows same URL again after first download completes', async () => {
      mockCacheAudio.mockResolvedValue(CACHED_URI)
      startBackgroundCaching(TEST_URL)
      await flushPromises()

      mockCacheAudio.mockClear()
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))
      startBackgroundCaching(TEST_URL)

      expect(mockCacheAudio).toHaveBeenCalledTimes(1)
    })

    test('allows different URLs concurrently', () => {
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)
      startBackgroundCaching(SECOND_URL)

      expect(mockCacheAudio).toHaveBeenCalledTimes(2)
    })
  })

  describe('atom adoption for in-flight URL', () => {
    test('adopts atoms and seeds progress when URL already in-flight', () => {
      let onProgressCb: ((progress: number) => void) | undefined
      mockCacheAudio.mockImplementation((_url: string, onProgress?: (progress: number) => void) => {
        onProgressCb = onProgress
        return new Promise<string>(() => {})
      })

      startBackgroundCaching(TEST_URL)
      onProgressCb?.(0.4)

      // Simulate user switching away (atoms overwritten by another download)
      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      // Re-enter same URL — should adopt atoms, not no-op
      startBackgroundCaching(TEST_URL)

      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(TEST_URL)
      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
      // Progress seeded from playlistDownloadProgressAtom (0.4)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.4)
      // cacheAudio NOT called twice
      expect(mockCacheAudio).toHaveBeenCalledTimes(1)
    })

    test('adopts atoms with 0 when no prior progress recorded', () => {
      mockCacheAudio.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)
      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      startBackgroundCaching(TEST_URL)

      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(TEST_URL)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
      expect(mockCacheAudio).toHaveBeenCalledTimes(1)
    })

    test('adoption followed by download settle resets terminal state', async () => {
      const resolveRef = { current: null as ((value: string) => void) | null }
      let onProgressCb: ((progress: number) => void) | undefined
      mockCacheAudio.mockImplementationOnce(
        (_url: string, onProgress?: (progress: number) => void) => {
          onProgressCb = onProgress
          return new Promise<string>(r => {
            resolveRef.current = r
          })
        },
      )

      // Start download A, advance it
      startBackgroundCaching(TEST_URL)
      onProgressCb?.(0.4)

      // Adoption — re-enter same URL while still in-flight
      startBackgroundCaching(TEST_URL)

      // Resolve the download
      resolveRef.current?.(CACHED_URI)
      await flushPromises()

      // Terminal state must be fully reset
      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
      expect(mockCtx.get(downloadProgressAtom)).toBe(1)
    })

    test('late ticks after adoption update global progress', () => {
      let onProgressCb: ((progress: number) => void) | undefined
      mockCacheAudio.mockImplementation((_url: string, onProgress?: (progress: number) => void) => {
        onProgressCb = onProgress
        return new Promise<string>(() => {})
      })

      startBackgroundCaching(TEST_URL)
      onProgressCb?.(0.4)

      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      startBackgroundCaching(TEST_URL)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.4)

      // Late tick from the still-running download — now writes global progress
      onProgressCb?.(0.6)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.6)
    })
  })
})

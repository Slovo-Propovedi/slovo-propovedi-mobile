import { createCtx, type Ctx } from '@reatom/framework'
import { enqueueCache } from 'shared/lib/audio-cache'
import { CacheCancelledError } from 'shared/lib/audio-cache/CacheCancelledError'
import { incrementCacheTrigger } from 'shared/lib/cache-triggers'
import { reportError } from 'shared/model/error-dialog'
import { downloadingAudioUrlAtom, downloadProgressAtom, isDownloadingAtom } from '../download-model'
import { startBackgroundCaching } from './BackgroundCachingService'

const TEST_URL = 'https://example.com/audio.mp3'
const SECOND_URL = 'https://example.com/audio2.mp3'
const CACHED_URI = 'file://cached.mp3'
const DOWNLOAD_ERROR = new Error('download failed')

let mockCtx: Ctx

jest.mock('shared/lib/reatom-ctx', () => ({
  get ctx() {
    return mockCtx
  },
}))

jest.mock('shared/lib/audio-cache', () => ({
  enqueueCache: jest.fn(),
  isCacheCancelledError: jest.requireActual('shared/lib/audio-cache/CacheCancelledError')
    .isCacheCancelledError,
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

jest.mock('shared/lib/cache-triggers', () => {
  const actual = jest.requireActual('shared/lib/cache-triggers')
  return {
    ...actual,
    incrementCacheTrigger: jest.fn(actual.incrementCacheTrigger),
  }
})

const mockEnqueueCache = jest.mocked(enqueueCache)
const mockReportError = jest.mocked(reportError)
const mockIncrementCacheTrigger = jest.mocked(incrementCacheTrigger)

const flushPromises = () => new Promise<void>(resolve => setImmediate(resolve))

interface ControlledEnqueue {
  onProgress?: (progress: number) => void
  reject: (error: unknown) => void
  resolve: (value: string) => void
}

const createControlledEnqueue = (): ControlledEnqueue => {
  let resolve!: (value: string) => void
  let reject!: (error: unknown) => void
  const controlled: ControlledEnqueue = {
    onProgress: undefined,
    reject: error => reject(error),
    resolve: value => resolve(value),
  }
  mockEnqueueCache.mockImplementation(
    (_ctx, _url, _source, onProgress?: (progress: number) => void) => {
      controlled.onProgress = onProgress
      return new Promise<string>((res, rej) => {
        resolve = res
        reject = rej
      })
    },
  )
  return controlled
}

describe('BackgroundCachingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCtx = createCtx()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('empty audioUrl guard', () => {
    test('returns early without calling enqueueCache', () => {
      startBackgroundCaching('')
      expect(mockEnqueueCache).not.toHaveBeenCalled()
    })

    test('does not set downloading state for empty url', () => {
      startBackgroundCaching('')
      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('lazy global atom writes (M5)', () => {
    test('does not write global atoms at enqueue time', () => {
      mockEnqueueCache.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)

      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
    })

    test('claims the downloader state on the first progress tick', () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.5)

      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(TEST_URL)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.5)
    })
  })

  describe('progress updates', () => {
    test('updates global progress on every tick', () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.25)
      controlled.onProgress?.(0.75)

      expect(mockCtx.get(downloadProgressAtom)).toBe(0.75)
    })

    test('calls enqueueCache with the auto source and a progress callback', () => {
      mockEnqueueCache.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)

      expect(mockEnqueueCache).toHaveBeenCalledWith(mockCtx, TEST_URL, 'auto', expect.any(Function))
    })
  })

  describe('cleanup on success', () => {
    test('calls incrementCacheTrigger and resets progress to 0 after success', async () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.5)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.5)

      controlled.resolve(CACHED_URI)
      await flushPromises()

      expect(mockIncrementCacheTrigger).toHaveBeenCalledTimes(1)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
    })

    test('resets global downloading state after success', async () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.5)
      controlled.resolve(CACHED_URI)
      await flushPromises()

      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
    })
  })

  describe('cleanup on error', () => {
    test('does not call incrementCacheTrigger and resets global state', async () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.5)
      controlled.reject(DOWNLOAD_ERROR)
      await flushPromises()

      expect(mockIncrementCacheTrigger).not.toHaveBeenCalled()
      expect(mockCtx.get(isDownloadingAtom)).toBe(false)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBeNull()
      expect(mockCtx.get(downloadProgressAtom)).toBe(0)
    })

    test('does NOT open global error dialog on download failure (Issue #73)', async () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.reject(DOWNLOAD_ERROR)
      await flushPromises()

      expect(mockReportError).not.toHaveBeenCalled()
    })

    test('logs a cancelled download with console.warn, not error', async () => {
      const controlled = createControlledEnqueue()
      const warnSpy = jest.spyOn(console, 'warn')

      startBackgroundCaching(TEST_URL)
      controlled.reject(new CacheCancelledError(TEST_URL))
      await flushPromises()

      expect(warnSpy).toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('queue delegation', () => {
    test('calls enqueueCache for every start (dedup is the queue job)', () => {
      mockEnqueueCache.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)
      startBackgroundCaching(TEST_URL)

      expect(mockEnqueueCache).toHaveBeenCalledTimes(2)
    })

    test('enqueues different URLs (the queue serializes them)', () => {
      mockEnqueueCache.mockReturnValue(new Promise<string>(() => {}))

      startBackgroundCaching(TEST_URL)
      startBackgroundCaching(SECOND_URL)

      expect(mockEnqueueCache).toHaveBeenCalledTimes(2)
    })
  })

  describe('stale completion guard', () => {
    test('does not clobber a newer downloader when the old download settles', async () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.4)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.4)

      // A newer downloader claims the global state.
      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      // The old download completes — must not clobber the newer downloader.
      controlled.resolve(CACHED_URI)
      await flushPromises()

      expect(mockIncrementCacheTrigger).toHaveBeenCalledTimes(1)
      expect(mockCtx.get(downloadProgressAtom)).toBe(0.7)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(SECOND_URL)
      expect(mockCtx.get(isDownloadingAtom)).toBe(true)
    })

    test('late ticks after the downloader switched do not clobber global progress', () => {
      const controlled = createControlledEnqueue()

      startBackgroundCaching(TEST_URL)
      controlled.onProgress?.(0.4)

      downloadingAudioUrlAtom(mockCtx, SECOND_URL)
      downloadProgressAtom(mockCtx, 0.7)

      controlled.onProgress?.(0.8)
      controlled.onProgress?.(1.0)

      expect(mockCtx.get(downloadProgressAtom)).toBe(0.7)
      expect(mockCtx.get(downloadingAudioUrlAtom)).toBe(SECOND_URL)
    })
  })
})

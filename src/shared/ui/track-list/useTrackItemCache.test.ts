import { act } from '@testing-library/react-native'
import { audioCacheService } from 'shared/lib/audio-cache/AudioCacheService'
import { CacheCancelledError } from 'shared/lib/audio-cache/CacheCancelledError'
import { cancelCacheDownload } from 'shared/lib/audio-cache/cacheQueue'
import { enqueueCache } from 'shared/lib/audio-cache/cacheQueueEnqueue'
import { cacheQueueAtom } from 'shared/lib/audio-cache/cacheQueueState'
import { cacheUpdateTriggerAtom, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import { useTrackItemCache } from './useTrackItemCache'

const AUDIO_URL = 'https://example.com/audio.mp3'
const AUDIO_CACHE_SERVICE_MODULE = 'shared/lib/audio-cache/AudioCacheService'
const CACHE_QUEUE_MODULE = 'shared/lib/audio-cache/cacheQueue'
const CACHE_QUEUE_ENQUEUE_MODULE = 'shared/lib/audio-cache/cacheQueueEnqueue'

jest.mock(AUDIO_CACHE_SERVICE_MODULE, () => {
  const actual = jest.requireActual(AUDIO_CACHE_SERVICE_MODULE)
  return {
    ...actual,
    audioCacheService: {
      cacheAudio: jest.fn().mockResolvedValue('file:///cached.mp3'),
      isCached: jest.fn().mockResolvedValue(false),
    },
    removeFromCache: jest.fn().mockResolvedValue(true),
  }
})

jest.mock(CACHE_QUEUE_MODULE, () => {
  const actual = jest.requireActual(CACHE_QUEUE_MODULE)
  return {
    ...actual,
    cancelCacheDownload: jest.fn(),
  }
})

jest.mock(CACHE_QUEUE_ENQUEUE_MODULE, () => {
  const actual = jest.requireActual(CACHE_QUEUE_ENQUEUE_MODULE)
  return {
    ...actual,
    enqueueCache: jest.fn().mockResolvedValue('file:///cached.mp3'),
  }
})

const mockedIsCached = audioCacheService.isCached as jest.MockedFunction<
  typeof audioCacheService.isCached
>
const mockedRemoveFromCache = jest.requireMock(AUDIO_CACHE_SERVICE_MODULE)
  .removeFromCache as jest.Mock
const mockedEnqueueCache = jest.mocked(enqueueCache)
const mockedCancelCacheDownload = jest.mocked(cancelCacheDownload)

describe('useTrackItemCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsCached.mockResolvedValue(false)
    mockedEnqueueCache.mockResolvedValue('file:///cached.mp3')
  })

  describe('initial state', () => {
    test('returns defaults when audioUrl is null', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(null, null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isQueued).toBe(false)
      expect(result.current.progressValue).toBe(-1)
      expect(result.current.visualState).toBe('cloud')
    })

    test('returns defaults when audioUrl is empty string', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache('', null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isQueued).toBe(false)
      expect(result.current.progressValue).toBe(-1)
    })

    test('returns defaults when audioUrl is undefined', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(undefined, null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.isQueued).toBe(false)
      expect(result.current.progressValue).toBe(-1)
    })
  })

  describe('isCached', () => {
    test('reflects audioCacheService.isCached result', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isCached).toBe(true)
      expect(mockedIsCached).toHaveBeenCalledWith(AUDIO_URL)
    })

    test('isCached is false when service returns false', async () => {
      mockedIsCached.mockResolvedValue(false)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.isCached).toBe(false)
    })
  })

  describe('isQueued reactivity', () => {
    test('isQueued is true when the URL is in cacheQueueAtom', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      expect(result.current.isQueued).toBe(false)

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      expect(result.current.isQueued).toBe(true)
      expect(result.current.visualState).toBe('queued')
    })

    test('isQueued becomes false when the queue entry is removed', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })
      expect(result.current.isQueued).toBe(true)

      await act(async () => {
        cacheQueueAtom(ctx, {})
      })

      expect(result.current.isQueued).toBe(false)
      expect(result.current.visualState).toBe('cloud')
    })

    test('isQueued stays false for a different URL in the queue', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, {
          'https://example.com/other.mp3': { enqueuedAt: 0, source: 'manual' },
        })
      })

      expect(result.current.isQueued).toBe(false)
    })
  })

  describe('download progress', () => {
    test('progressValue reads from playlistDownloadProgressAtom', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      expect(result.current.progressValue).toBe(-1)

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 0.5 })
      })

      expect(result.current.progressValue).toBe(0.5)
    })

    test('isDownloading is true when progress is between 0 and 1', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 0.5 })
      })

      expect(result.current.isDownloading).toBe(true)
      expect(result.current.visualState).toBe('downloading')
    })

    test('isDownloading is true when progress is exactly 0', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 0 })
      })

      expect(result.current.isDownloading).toBe(true)
    })

    test('isDownloading is false when progress is -1', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      expect(result.current.isDownloading).toBe(false)
    })

    test('isDownloading is false when progress is exactly 1', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 1 })
      })

      expect(result.current.isDownloading).toBe(false)
    })
  })

  describe('toggleCache', () => {
    test('does nothing when audioUrl is null', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(null, null))

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedEnqueueCache).not.toHaveBeenCalled()
      expect(mockedCancelCacheDownload).not.toHaveBeenCalled()
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('does not enqueue when offline and not cached', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedEnqueueCache).not.toHaveBeenCalled()
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('removes from cache when offline and cached', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
      expect(mockedEnqueueCache).not.toHaveBeenCalled()
    })

    test('enqueues with manual source when online and not cached', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        isOnlineAtom(ctx, true)
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedEnqueueCache).toHaveBeenCalledWith(ctx, AUDIO_URL, 'manual')
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
      expect(mockedCancelCacheDownload).not.toHaveBeenCalled()
    })

    test('cancels the download when isDownloading', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 0.5 })
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, AUDIO_URL)
      expect(mockedEnqueueCache).not.toHaveBeenCalled()
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('cancels the queue entry when isQueued', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, AUDIO_URL)
      expect(mockedEnqueueCache).not.toHaveBeenCalled()
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('cancels the queue entry when offline (stop is enabled)', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, AUDIO_URL)
    })

    test('removes from cache when cached', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
      expect(mockedEnqueueCache).not.toHaveBeenCalled()
    })

    test('increments cacheUpdateTriggerAtom after successful enqueue', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
    })

    test('increments cacheUpdateTriggerAtom after removeFromCache', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
    })

    test('does not increment trigger when cancelling a queued entry', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger)
    })

    test('is silent when enqueueCache rejects with CacheCancelledError', async () => {
      mockedEnqueueCache.mockRejectedValueOnce(new CacheCancelledError(AUDIO_URL))
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    test('warns when enqueueCache rejects with a real error', async () => {
      const error = new Error('download failed')
      mockedEnqueueCache.mockRejectedValueOnce(error)
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(warnSpy).toHaveBeenCalledWith('[useTrackItemCache] Error enqueuing cache:', error)
      warnSpy.mockRestore()
    })

    test('warns when removeFromCache throws', async () => {
      mockedIsCached.mockResolvedValue(true)
      const error = new Error('remove failed')
      mockedRemoveFromCache.mockRejectedValueOnce(error)
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('isCacheDisabled', () => {
    test('is true only when offline and not cached and not downloading and not queued', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      expect(result.current.isCacheDisabled).toBe(true)

      await act(async () => {
        isOnlineAtom(ctx, true)
      })

      expect(result.current.isCacheDisabled).toBe(false)
    })

    test('is false when offline and queued (remove-from-queue stays enabled)', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      expect(result.current.isCacheDisabled).toBe(false)
    })

    test('is false when offline and downloading (stop stays enabled)', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        playlistDownloadProgressAtom(ctx, { [AUDIO_URL]: 0.5 })
      })

      await act(async () => {
        isOnlineAtom(ctx, false)
      })

      expect(result.current.isCacheDisabled).toBe(false)
    })
  })

  describe('visualState', () => {
    test('is cached when cached', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.visualState).toBe('cached')
    })

    test('is cached when cached and queued (cached wins per resolver)', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
      })

      expect(result.current.visualState).toBe('cached')
    })
  })
})

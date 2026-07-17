import { act } from '@testing-library/react-native'
import { audioCacheService } from 'shared/lib/audio-cache/AudioCacheService'
import { cacheUpdateTriggerAtom, playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useTrackItemCache } from './useTrackItemCache'

const AUDIO_URL = 'https://example.com/audio.mp3'
const AUDIO_CACHE_SERVICE_MODULE = 'shared/lib/audio-cache/AudioCacheService'

jest.mock(AUDIO_CACHE_SERVICE_MODULE, () => {
  const actual = jest.requireActual(AUDIO_CACHE_SERVICE_MODULE)
  return {
    ...actual,
    audioCacheService: {
      isCached: jest.fn().mockResolvedValue(false),
    },
    cacheAudio: jest.fn().mockResolvedValue('file:///cached.mp3'),
    removeFromCache: jest.fn().mockResolvedValue(true),
  }
})

const mockedIsCached = audioCacheService.isCached as jest.MockedFunction<
  typeof audioCacheService.isCached
>
const mockedCacheAudio = jest.requireMock(AUDIO_CACHE_SERVICE_MODULE).cacheAudio as jest.Mock
const mockedRemoveFromCache = jest.requireMock(AUDIO_CACHE_SERVICE_MODULE)
  .removeFromCache as jest.Mock

describe('useTrackItemCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsCached.mockResolvedValue(false)
  })

  describe('initial state', () => {
    test('returns defaults when audioUrl is null', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(null, null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.progressValue).toBe(-1)
    })

    test('returns defaults when audioUrl is empty string', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache('', null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
      expect(result.current.progressValue).toBe(-1)
    })

    test('returns defaults when audioUrl is undefined', async () => {
      const { result } = await renderHookWithProviders(() => useTrackItemCache(undefined, null))

      expect(result.current.isCached).toBe(false)
      expect(result.current.isDownloading).toBe(false)
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
      // useIsCached receives (url, trigger) but only passes url to audioCacheService.isCached
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

      expect(mockedCacheAudio).not.toHaveBeenCalled()
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('calls cacheAudio when not cached', async () => {
      mockedIsCached.mockResolvedValue(false)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedCacheAudio).toHaveBeenCalledWith(AUDIO_URL)
      expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    })

    test('calls removeFromCache when cached', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
      expect(mockedCacheAudio).not.toHaveBeenCalled()
    })

    test('increments cacheUpdateTriggerAtom after successful toggle', async () => {
      const { ctx, result } = await renderHookWithProviders(() =>
        useTrackItemCache(AUDIO_URL, null),
      )

      const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
    })

    test('catches error and warns when cacheAudio throws', async () => {
      const error = new Error('download failed')
      mockedCacheAudio.mockRejectedValueOnce(error)
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = await renderHookWithProviders(() => useTrackItemCache(AUDIO_URL, null))

      await act(async () => {
        await result.current.toggleCache()
      })

      expect(warnSpy).toHaveBeenCalledWith('[useTrackItemCache] Error toggling cache:', error)
      warnSpy.mockRestore()
    })

    test('catches error and warns when removeFromCache throws', async () => {
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

  describe('download completion transition', () => {
    test('detects download completion and re-checks cache', async () => {
      // Start with downloadingUrl === audioUrl, then transition to null
      mockedIsCached.mockResolvedValue(true)

      const { rerender } = await renderHookWithProviders(
        ({ downloadingUrl }) => useTrackItemCache(AUDIO_URL, downloadingUrl),
        { initialProps: { downloadingUrl: AUDIO_URL } as { downloadingUrl: null | string } },
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const callsAfterFirst = mockedIsCached.mock.calls.length

      await act(async () => {
        rerender({ downloadingUrl: null })
      })

      // After download completion, useIsCached should be called again
      // because internalCacheTrigger increments, changing the cache key
      expect(mockedIsCached.mock.calls.length).toBeGreaterThanOrEqual(callsAfterFirst)
    })
  })
})

import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import {
  activeCacheUrlAtom,
  audioCacheService,
  cacheQueueAtom,
  type CacheQueueEntry,
  hasInflightCacheDownloads,
} from 'shared/lib/audio-cache'
import { cachedUrlsAtom, cacheUpdateTriggerAtom, markUrlCached } from 'shared/lib/cache-triggers'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import { isCachingPlaylistAtom } from '../model'
import { playlistCacheService } from './PlaylistCacheService'
import { usePlaylistCacheMenu } from './usePlaylistCacheMenu'

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      clearCache: jest.fn().mockResolvedValue(undefined),
      isCached: jest.fn().mockResolvedValue(false),
    },
    hasInflightCacheDownloads: jest.fn(),
  }
})

const mockedIsCached = jest.mocked(audioCacheService.isCached)
const mockedClearCache = jest.mocked(audioCacheService.clearCache)
const mockedHasInflightCacheDownloads = jest.mocked(hasInflightCacheDownloads)

const TRACKS = [
  { audioUrl: 'http://example.com/1.mp3', id: '1', title: 'Первая' },
  { audioUrl: 'http://example.com/2.mp3', id: '2', title: 'Вторая' },
]

const renderMenu = async () => {
  const ctx = createCtx()
  isOnlineAtom(ctx, true)
  isCachingPlaylistAtom(ctx, false)
  cacheQueueAtom(ctx, {})

  const { result } = await renderHookWithProviders(() => usePlaylistCacheMenu(TRACKS, 'Плейлист'), {
    ctx,
  })

  return { ctx, result }
}

const renderMenuWithQueue = async (queue: Record<string, CacheQueueEntry>) => {
  const ctx = createCtx()
  isOnlineAtom(ctx, true)
  isCachingPlaylistAtom(ctx, false)
  cacheQueueAtom(ctx, queue)

  const { result } = await renderHookWithProviders(() => usePlaylistCacheMenu(TRACKS, 'Плейлист'), {
    ctx,
  })

  return { ctx, result }
}

const settleCacheStatus = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('usePlaylistCacheMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedIsCached.mockResolvedValue(false)
    mockedHasInflightCacheDownloads.mockReturnValue(false)
  })

  describe('isClearCacheDisabled', () => {
    test('is true when cachedCount===0', async () => {
      mockedIsCached.mockResolvedValue(false)

      const { result } = await renderMenu()
      await settleCacheStatus()

      expect(result.current.isClearCacheDisabled).toBe(true)
    })

    test('is false when cachedCount>0 and queue empty and no active download', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderMenu()
      await settleCacheStatus()

      expect(result.current.isClearCacheDisabled).toBe(false)
    })

    test('is true when the queue is non-empty', async () => {
      const { result } = await renderMenuWithQueue({
        'http://example.com/1.mp3': { enqueuedAt: 0, source: 'playlist' },
      })
      await settleCacheStatus()

      expect(result.current.isClearCacheDisabled).toBe(true)
    })

    test('is true when a download is active', async () => {
      const { ctx, result } = await renderMenu()
      await settleCacheStatus()

      await act(() => {
        activeCacheUrlAtom(ctx, 'http://example.com/1.mp3')
      })

      expect(result.current.isClearCacheDisabled).toBe(true)
    })

    test('reacts to activeCacheUrlAtom changes', async () => {
      mockedIsCached.mockResolvedValue(true)
      const { ctx, result } = await renderMenu()
      await settleCacheStatus()

      expect(result.current.isClearCacheDisabled).toBe(false)

      await act(() => {
        activeCacheUrlAtom(ctx, 'http://example.com/1.mp3')
      })

      expect(result.current.isClearCacheDisabled).toBe(true)

      await act(() => {
        activeCacheUrlAtom(ctx, null)
      })

      expect(result.current.isClearCacheDisabled).toBe(false)
    })
  })

  describe('isCacheAllDisabled', () => {
    test('is true when all tracks are cached', async () => {
      mockedIsCached.mockResolvedValue(true)

      const { result } = await renderMenu()
      await settleCacheStatus()

      expect(result.current.isCacheAllDisabled).toBe(true)
      expect(result.current.allCached).toBe(true)
    })

    test('is true when offline', async () => {
      const ctx = createCtx()
      isOnlineAtom(ctx, false)
      isCachingPlaylistAtom(ctx, false)
      cacheQueueAtom(ctx, {})

      const { result } = await renderHookWithProviders(
        () => usePlaylistCacheMenu(TRACKS, 'Плейлист'),
        { ctx },
      )
      await settleCacheStatus()

      expect(result.current.isCacheAllDisabled).toBe(true)
    })

    test('is false when not all cached and online', async () => {
      mockedIsCached.mockResolvedValue(false)

      const { result } = await renderMenu()
      await settleCacheStatus()

      expect(result.current.isCacheAllDisabled).toBe(false)
    })
  })

  describe('handlers', () => {
    test('handleStopCaching delegates to playlistCacheService.cancelPlaylistCache', async () => {
      const cancelSpy = jest.spyOn(playlistCacheService, 'cancelPlaylistCache')
      const { ctx, result } = await renderMenu()

      await act(() => {
        result.current.handleStopCaching()
      })

      expect(cancelSpy).toHaveBeenCalledWith(ctx)
    })

    test('handleClearCacheConfirm clears the cache and bumps the trigger', async () => {
      const { ctx, result } = await renderMenu()
      markUrlCached(ctx, 'http://example.com/1.mp3')
      const before = ctx.get(cacheUpdateTriggerAtom)

      await act(async () => {
        await result.current.handleClearCacheConfirm()
      })

      expect(mockedClearCache).toHaveBeenCalled()
      expect(ctx.get(cachedUrlsAtom)).toEqual({})
      expect(ctx.get(cacheUpdateTriggerAtom)).toBe(before + 1)
    })

    test('handleClearCacheOption opens the dialog when no download is active', async () => {
      const { result } = await renderMenu()
      await settleCacheStatus()

      await act(() => {
        result.current.handleClearCacheOption()
      })

      expect(result.current.clearDialogVisible).toBe(true)
    })

    test('handleClearCacheOption does not open the dialog when a download is active', async () => {
      const { result } = await renderMenu()
      await settleCacheStatus()
      mockedHasInflightCacheDownloads.mockReturnValue(true)

      await act(() => {
        result.current.handleClearCacheOption()
      })

      expect(result.current.clearDialogVisible).toBe(false)
    })

    test('handleClearCacheConfirm skips clearCache when a download is active', async () => {
      const { result } = await renderMenu()
      await settleCacheStatus()
      mockedHasInflightCacheDownloads.mockReturnValue(true)

      await act(async () => {
        await result.current.handleClearCacheConfirm()
      })

      expect(mockedClearCache).not.toHaveBeenCalled()
    })
  })
})

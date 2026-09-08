import { type Atom, createCtx } from '@reatom/framework'
import {
  activeCacheUrlAtom,
  cancelAllCacheDownloads,
  cancelCacheDownload,
  enqueueCache,
  getCacheRequesters,
  removeFromQueueBySource,
} from 'shared/lib/audio-cache'
import { CacheCancelledError } from 'shared/lib/audio-cache/CacheCancelledError'
import { playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { waitForOnline } from 'shared/lib/network'
import { isCachingPlaylistAtom, playlistCacheErrorAtom } from '../model'
import { isNetworkError } from './isNetworkError'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { playlistCacheService } from './PlaylistCacheService'

jest.mock('shared/lib/network', () => ({
  waitForOnline: jest.fn(),
}))

// Simulates the real stopper registry: stoppers registered by playlist runs,
// invoked by the global stop.
const __stoppers = (jest.requireMock('shared/lib/audio-cache') as { __stoppers: Set<() => void> })
  .__stoppers

jest.mock('shared/lib/audio-cache', () => {
  const { atom: reatomAtom } = jest.requireActual('@reatom/framework') as {
    atom: (init: null | string, name?: string) => Atom<null | string>
  }
  const stoppers = new Set<() => void>()
  return {
    __stoppers: stoppers,
    activeCacheUrlAtom: reatomAtom(null, 'activeCacheUrlAtom'),
    cancelAllCacheDownloads: jest.fn(),
    cancelCacheDownload: jest.fn(),
    enqueueCache: jest.fn(),
    getCacheRequesters: jest.fn(() => new Set()),
    isCacheCancelledError: jest.requireActual('shared/lib/audio-cache/CacheCancelledError')
      .isCacheCancelledError,
    registerPlaylistRunStopper: jest.fn((stopper: () => void) => {
      stoppers.add(stopper)
    }),
    removeFromQueueBySource: jest.fn(),
    unregisterPlaylistRunStopper: jest.fn((stopper: () => void) => {
      stoppers.delete(stopper)
    }),
  }
})

jest.mock('./PlaylistCacheNotifications', () => ({
  playlistCacheNotifications: {
    hideCachingNotification: jest.fn().mockResolvedValue(undefined),
    showCachingNotification: jest.fn().mockResolvedValue('notification-id'),
    showCompletionNotification: jest.fn().mockResolvedValue('notification-id'),
    showErrorNotification: jest.fn().mockResolvedValue('notification-id'),
    updateCachingNotification: jest.fn().mockResolvedValue('notification-id'),
  },
}))

const TRACKS = [
  { audioUrl: 'http://example.com/1.mp3', id: '1', title: 'Первая' },
  { audioUrl: 'http://example.com/2.mp3', id: '2', title: 'Вторая' },
  { audioUrl: 'http://example.com/3.mp3', id: '3', title: 'Третья' },
]

const mockedEnqueueCache = jest.mocked(enqueueCache)
const mockedCancelAllCacheDownloads = jest.mocked(cancelAllCacheDownloads)
const mockedCancelCacheDownload = jest.mocked(cancelCacheDownload)
const mockedGetCacheRequesters = jest.mocked(getCacheRequesters)
const mockedRemoveFromQueueBySource = jest.mocked(removeFromQueueBySource)
const mockedWaitForOnline = jest.mocked(waitForOnline)
const mockedNotifications = jest.mocked(playlistCacheNotifications)

const flushPromises = () => new Promise<void>(resolve => setImmediate(resolve))

describe('playlistCacheService.cachePlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedWaitForOnline.mockResolvedValue(true)
    mockedEnqueueCache.mockImplementation(async (_ctx, url) => url)
  })

  test('enqueues all tracks upfront with the playlist source', async () => {
    const ctx = createCtx()

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedEnqueueCache).toHaveBeenCalledTimes(3)
    expect(mockedEnqueueCache.mock.calls.map(call => call[1])).toEqual([
      'http://example.com/1.mp3',
      'http://example.com/2.mp3',
      'http://example.com/3.mp3',
    ])
    expect(mockedEnqueueCache.mock.calls.every(call => call[2] === 'playlist')).toBe(true)
    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
  })

  test('awaits each per-URL promise in FIFO order', async () => {
    const ctx = createCtx()
    const controlled = new Map<
      string,
      { reject: (e: unknown) => void; resolve: (v: string) => void }
    >()
    mockedEnqueueCache.mockImplementation((_ctx, url: string) => {
      let resolve!: (v: string) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<string>((res, rej) => {
        resolve = res
        reject = rej
      })
      controlled.set(url, { reject, resolve })
      return promise
    })

    const run = playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')
    await flushPromises()

    // Resolving the second track first must not advance the run past the first.
    controlled.get(TRACKS[1].audioUrl)?.resolve(TRACKS[1].audioUrl)
    await flushPromises()
    expect(mockedNotifications.updateCachingNotification).not.toHaveBeenCalled()

    controlled.get(TRACKS[0].audioUrl)?.resolve(TRACKS[0].audioUrl)
    await flushPromises()
    expect(mockedNotifications.updateCachingNotification).toHaveBeenCalledWith(
      'notification-id',
      1,
      3,
      'Плейлист',
    )

    controlled.get(TRACKS[2].audioUrl)?.resolve(TRACKS[2].audioUrl)
    await run
    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
  })

  test('continues past a failed track and reports partial failure count', async () => {
    const ctx = createCtx()
    mockedEnqueueCache.mockImplementation(async (_ctx, url) => {
      if (url === TRACKS[1].audioUrl) throw new Error('download failed')
      return url
    })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    const reportedError = mockedNotifications.showErrorNotification.mock.calls[0][0]
    expect(reportedError.message).toBe('Не удалось скачать 1 из 3')
  })

  test('skips a cancelled track without counting it as failed', async () => {
    const ctx = createCtx()
    mockedEnqueueCache.mockImplementation(async (_ctx, url) => {
      if (url === TRACKS[1].audioUrl) throw new CacheCancelledError(url)
      return url
    })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
  })

  test('aborts run when offline before a track and swallows network error', async () => {
    const ctx = createCtx()
    mockedWaitForOnline.mockResolvedValue(false)

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedEnqueueCache).toHaveBeenCalledTimes(3)
    const reportedError = mockedNotifications.showErrorNotification.mock.calls[0][0]
    expect(reportedError.message).toBe('Нет подключения к интернету')
    expect(ctx.get(playlistCacheErrorAtom)).toBeNull()
    expect(mockedNotifications.hideCachingNotification).toHaveBeenCalled()
  })

  test('cancelled run shows no success/error notifications', async () => {
    const ctx = createCtx()
    const controlled = new Map<
      string,
      { reject: (e: unknown) => void; resolve: (v: string) => void }
    >()
    mockedEnqueueCache.mockImplementation((_ctx, url: string) => {
      let resolve!: (v: string) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<string>((res, rej) => {
        resolve = res
        reject = rej
      })
      // The real queue attaches a sentinel catch to every deferred promise
      // (cacheQueueState.createDeferred); mimic it so orphaned promises do not
      // surface as unhandled rejections when the run loop breaks early.
      promise.catch(() => {})
      controlled.set(url, { reject, resolve })
      return promise
    })

    const run = playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')
    await flushPromises()

    playlistCacheService.cancelPlaylistCache(ctx)

    // Simulate removeFromQueueBySource rejecting the pending promises.
    for (const { reject } of controlled.values())
      reject(new CacheCancelledError('http://example.com/1.mp3'))

    await run

    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
    expect(mockedRemoveFromQueueBySource).toHaveBeenCalledWith(ctx, 'playlist')
    expect(ctx.get(isCachingPlaylistAtom)).toBe(false)
  })

  test('resets isCachingPlaylistAtom in finally after a successful run', async () => {
    const ctx = createCtx()

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(ctx.get(isCachingPlaylistAtom)).toBe(false)
    expect(mockedRemoveFromQueueBySource).toHaveBeenCalledWith(ctx, 'playlist')
  })

  test('returns early when already caching', async () => {
    const ctx = createCtx()
    isCachingPlaylistAtom(ctx, true)

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedEnqueueCache).not.toHaveBeenCalled()
  })

  test('returns early for empty tracks', async () => {
    const ctx = createCtx()

    await playlistCacheService.cachePlaylist(ctx, [], 'Плейлист')

    expect(mockedEnqueueCache).not.toHaveBeenCalled()
  })

  test('filters tracks without an audioUrl', async () => {
    const ctx = createCtx()
    const tracks = [...TRACKS, { id: '4', title: 'Без URL' }]

    await playlistCacheService.cachePlaylist(ctx, tracks, 'Плейлист')

    expect(mockedEnqueueCache).toHaveBeenCalledTimes(3)
    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
  })

  test('leaves no run-owned progress entries after a successful run', async () => {
    const ctx = createCtx()

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('preserves a foreign progress entry from a concurrent manual download', async () => {
    const ctx = createCtx()
    playlistDownloadProgressAtom(ctx, { 'http://other.com/manual.mp3': 0.42 })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({ 'http://other.com/manual.mp3': 0.42 })
  })

  test('treats offline abort as network error', () => {
    expect(isNetworkError(new Error('Нет подключения к интернету'))).toBe(true)
  })
})

describe('playlistCacheService.cancelPlaylistCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __stoppers.clear()
  })

  test('cancels the active download when only the playlist is interested', () => {
    const ctx = createCtx()
    isCachingPlaylistAtom(ctx, true)
    activeCacheUrlAtom(ctx, TRACKS[0].audioUrl)
    mockedGetCacheRequesters.mockReturnValue(new Set(['playlist']))

    playlistCacheService.cancelPlaylistCache(ctx)

    expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, TRACKS[0].audioUrl)
    expect(mockedRemoveFromQueueBySource).toHaveBeenCalledWith(ctx, 'playlist')
  })

  test('does not cancel the active download when a foreign joiner exists', () => {
    const ctx = createCtx()
    isCachingPlaylistAtom(ctx, true)
    activeCacheUrlAtom(ctx, TRACKS[0].audioUrl)
    mockedGetCacheRequesters.mockReturnValue(new Set(['auto', 'playlist']))

    playlistCacheService.cancelPlaylistCache(ctx)

    expect(mockedCancelCacheDownload).not.toHaveBeenCalled()
    expect(mockedRemoveFromQueueBySource).toHaveBeenCalledWith(ctx, 'playlist')
  })

  test('is a no-op when not caching', () => {
    const ctx = createCtx()

    playlistCacheService.cancelPlaylistCache(ctx)

    expect(mockedCancelCacheDownload).not.toHaveBeenCalled()
    expect(mockedRemoveFromQueueBySource).not.toHaveBeenCalled()
  })
})

describe('global stop (cancelAllCacheDownloads)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    __stoppers.clear()
    mockedWaitForOnline.mockResolvedValue(true)
    mockedEnqueueCache.mockImplementation(async (_ctx, url) => url)
  })

  test('aborts a running playlist cache and shows no notifications', async () => {
    const ctx = createCtx()
    const controlled = new Map<
      string,
      { reject: (e: unknown) => void; resolve: (v: string) => void }
    >()
    mockedEnqueueCache.mockImplementation((_ctx, url: string) => {
      let resolve!: (v: string) => void
      let reject!: (e: unknown) => void
      const promise = new Promise<string>((res, rej) => {
        resolve = res
        reject = rej
      })
      promise.catch(() => {})
      controlled.set(url, { reject, resolve })
      return promise
    })
    // The real action invokes every registered run stopper (aborting the run
    // controller) and rejects every queued promise; simulate both effects.
    mockedCancelAllCacheDownloads.mockImplementation(() => {
      for (const stopper of __stoppers) stopper()
      for (const { reject } of controlled.values())
        reject(new CacheCancelledError('http://example.com/1.mp3'))
    })

    const run = playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')
    await flushPromises()

    cancelAllCacheDownloads(ctx)

    await run

    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
    expect(ctx.get(isCachingPlaylistAtom)).toBe(false)
    expect(__stoppers.size).toBe(0)
  })

  test('abort during the pre-enqueue notification window enqueues nothing', async () => {
    const ctx = createCtx()
    let resolveNotification!: (id: string) => void
    mockedNotifications.showCachingNotification.mockReturnValueOnce(
      new Promise<string>(resolve => {
        resolveNotification = resolve
      }),
    )
    mockedCancelAllCacheDownloads.mockImplementation(() => {
      for (const stopper of __stoppers) stopper()
    })

    const run = playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')
    await flushPromises()
    expect(mockedEnqueueCache).not.toHaveBeenCalled()

    cancelAllCacheDownloads(ctx)
    resolveNotification('notification-id')
    await run

    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
    expect(mockedNotifications.hideCachingNotification).toHaveBeenCalled()
    expect(mockedRemoveFromQueueBySource).toHaveBeenCalledWith(ctx, 'playlist')
    expect(ctx.get(isCachingPlaylistAtom)).toBe(false)
  })
})

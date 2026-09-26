import { createCtx, type Ctx } from '@reatom/framework'
import { audioCacheService } from './AudioCacheService'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'
import { CacheCancelledError } from './CacheCancelledError'
import {
  _resetCacheQueueForTesting,
  cancelAllCacheDownloads,
  cancelCacheDownload,
  isUrlQueued,
  removeFromQueue,
  removeFromQueueBySource,
} from './cacheQueue'
import { enqueueCache } from './cacheQueueEnqueue'
import { getCacheRequesters } from './cacheQueueRegistries'
import {
  activeCacheUrlAtom,
  cacheQueueAtom,
  registerPlaylistRunStopper,
  unregisterPlaylistRunStopper,
} from './cacheQueueState'
import { inflightCache, resetInflightCache } from './inflightCache'
import { createInflightDownload } from './inflightDownload'

jest.mock('./cacheAudioWithProgress', () => ({
  cacheAudioWithProgress: jest.fn(),
}))

jest.mock('./AudioCacheService', () => {
  const actual = jest.requireActual('./AudioCacheService')
  return {
    audioCacheService: {
      ...actual.audioCacheService,
      cancelAudioDownload: jest.fn(),
    },
  }
})

const URL_A = 'http://example.com/a.mp3'
const URL_B = 'http://example.com/b.mp3'
const URL_C = 'http://example.com/c.mp3'
const MANUAL_SOURCE = 'manual'
const PLAYLIST_SOURCE = 'playlist'

const mockedCacheAudioWithProgress = jest.mocked(cacheAudioWithProgress)
const mockedCancelAudioDownload = jest.mocked(audioCacheService.cancelAudioDownload)

interface ControlledDownload {
  promise: Promise<string>
  reject: (error: unknown) => void
  resolve: (uri: string) => void
}

const createControlledDownload = (): ControlledDownload => {
  let resolve!: (uri: string) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, reject, resolve }
}

let ctx: Ctx

beforeEach(() => {
  ctx = createCtx()
  jest.resetAllMocks()
  _resetCacheQueueForTesting()
  resetInflightCache()
})

describe('enqueueCache', () => {
  test('adds the entry to the queue and starts the download', async () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
    expect(mockedCacheAudioWithProgress.mock.calls[0][1]).toBe(URL_A)
    await expect(result).resolves.toBe(URL_A)
  })

  test('records the source and a monotonically increasing enqueuedAt', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)

    expect(ctx.get(cacheQueueAtom)).toEqual({
      [URL_B]: { enqueuedAt: 1, source: PLAYLIST_SOURCE },
    })

    firstDownload.resolve(URL_A)
    await first
    await second
  })

  test('deduplicates a URL that is already queued', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    const third = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)

    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
    firstDownload.resolve(URL_A)
    await first
    await expect(second).resolves.toBe(URL_B)
    await expect(third).resolves.toBe(URL_B)
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(2)
  })

  test('joins an inflight download instead of starting a second one', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    inflightCache.set(URL_A, entry)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    expect(mockedCacheAudioWithProgress).not.toHaveBeenCalled()
    download.resolve('/cache/a.mp3')
    await expect(result).resolves.toBe('/cache/a.mp3')
  })

  test('treats an aborted inflight entry as fresh instead of joining it (Bug B)', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    entry.aborted = true
    inflightCache.set(URL_A, entry)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    // A fresh download starts; the dying (aborted) promise is not joined.
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
    await expect(result).resolves.toBe(URL_A)
  })

  test('rejects when the download fails', async () => {
    const error = new Error('network down')
    mockedCacheAudioWithProgress.mockRejectedValue(error)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    await expect(result).rejects.toBe(error)
  })

  test('throws when the URL is empty', () => {
    expect(() => enqueueCache(ctx, '', MANUAL_SOURCE)).toThrow('[cacheQueue] audioUrl is required')
  })

  test('downloads strictly one at a time', async () => {
    let active = 0
    let maxActive = 0
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => {
      active++
      maxActive = Math.max(maxActive, active)
      await Promise.resolve()
      active--
      return url
    })

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    await Promise.all([first, second])

    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(2)
    expect(maxActive).toBe(1)
  })

  test('processes entries in FIFO invocation order', async () => {
    const order: string[] = []
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => {
      order.push(url)
      return url
    })

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    await Promise.all([first, second])

    expect(order).toEqual([URL_A, URL_B])
  })

  test('isUrlQueued reflects the queue state', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    expect(isUrlQueued(ctx, URL_A)).toBe(false)

    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    expect(isUrlQueued(ctx, URL_B)).toBe(true)

    firstDownload.resolve(URL_A)
    await first
    await second
  })
})

describe('removeFromQueue', () => {
  test('removes a queued entry and rejects its promise', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    removeFromQueue(ctx, URL_B)

    expect(isUrlQueued(ctx, URL_B)).toBe(false)
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    firstDownload.resolve(URL_A)
    await expect(first).resolves.toBe(URL_A)
  })

  test('does not cancel an active download', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    removeFromQueue(ctx, URL_A)

    firstDownload.resolve(URL_A)
    await expect(result).resolves.toBe(URL_A)
  })
})

describe('removeFromQueueBySource', () => {
  test('removes every queued entry with the source and rejects their promises', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)
    const third = enqueueCache(ctx, URL_C, PLAYLIST_SOURCE)

    removeFromQueueBySource(ctx, PLAYLIST_SOURCE)

    expect(isUrlQueued(ctx, URL_B)).toBe(false)
    expect(isUrlQueued(ctx, URL_C)).toBe(false)
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(third).rejects.toBeInstanceOf(CacheCancelledError)
    firstDownload.resolve(URL_A)
    await expect(first).resolves.toBe(URL_A)
  })

  test('is a no-op when no entry has the source', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    removeFromQueueBySource(ctx, PLAYLIST_SOURCE)

    firstDownload.resolve(URL_A)
    await expect(first).resolves.toBe(URL_A)
  })
})

describe('cancelCacheDownload', () => {
  test('cancels a queued entry', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    cancelCacheDownload(ctx, URL_B)

    expect(isUrlQueued(ctx, URL_B)).toBe(false)
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    firstDownload.resolve(URL_A)
    await expect(first).resolves.toBe(URL_A)
  })

  test('rejects the promise of an active download', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    inflightCache.set(URL_A, entry)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    cancelCacheDownload(ctx, URL_A)
    download.reject(new CacheCancelledError(URL_A))

    await expect(result).rejects.toBeInstanceOf(CacheCancelledError)
  })
})

describe('requester registry', () => {
  test('tracks requesters across queued dedupe and clears on settle', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    const third = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)

    expect(getCacheRequesters(URL_B)).toEqual(new Set([MANUAL_SOURCE, PLAYLIST_SOURCE]))

    firstDownload.resolve(URL_A)
    await first
    await second
    await third

    expect(getCacheRequesters(URL_B)).toEqual(new Set())
  })

  test('tracks requesters across an inflight join and clears on settle', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    inflightCache.set(URL_A, entry)

    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE)

    expect(getCacheRequesters(URL_A)).toEqual(new Set([MANUAL_SOURCE]))

    download.resolve('/cache/a.mp3')
    await result

    expect(getCacheRequesters(URL_A)).toEqual(new Set())
  })

  test('removeFromQueueBySource drops only that source and deletes the key when empty', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)
    const third = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    removeFromQueueBySource(ctx, PLAYLIST_SOURCE)

    expect(getCacheRequesters(URL_B)).toEqual(new Set([MANUAL_SOURCE]))

    removeFromQueue(ctx, URL_B)

    expect(getCacheRequesters(URL_B)).toEqual(new Set())
    firstDownload.resolve(URL_A)
    await first
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(third).rejects.toBeInstanceOf(CacheCancelledError)
  })

  test('removeFromQueue clears requesters of a queued entry', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    removeFromQueue(ctx, URL_B)

    expect(getCacheRequesters(URL_B)).toEqual(new Set())
    firstDownload.resolve(URL_A)
    await first
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
  })
})

describe('enqueueCache onProgress', () => {
  test('forwards progress to a queued entry once the runner starts', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url, onProgress) => {
      onProgress?.(0.5)
      return url
    })

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const progress: number[] = []
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE, p => progress.push(p))

    expect(progress).toEqual([])

    firstDownload.resolve(URL_A)
    await first
    await second

    expect(progress).toEqual([0.5])
  })

  test('seeds an inflight joiner with the retroactive progress', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    inflightCache.set(URL_A, entry)
    entry.emit(0.42)

    const progress: number[] = []
    const result = enqueueCache(ctx, URL_A, MANUAL_SOURCE, p => progress.push(p))

    expect(progress).toEqual([0.42])

    download.resolve('/cache/a.mp3')
    await result
  })
})

describe('activeCacheUrlAtom', () => {
  test('reflects the processed URL and returns to null when idle', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const seen: (null | string)[] = []
    ctx.subscribe(activeCacheUrlAtom, url => seen.push(url))

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    expect(ctx.get(activeCacheUrlAtom)).toBe(URL_A)

    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    expect(ctx.get(activeCacheUrlAtom)).toBe(URL_A)

    firstDownload.resolve(URL_A)
    await first
    await second

    expect(ctx.get(activeCacheUrlAtom)).toBeNull()
    // Initial subscribe fires once (null), then each processed URL with an idle
    // gap between entries, then idle.
    expect(seen).toEqual([null, URL_A, null, URL_B, null])
  })

  test('stays null when the queue is idle', () => {
    expect(ctx.get(activeCacheUrlAtom)).toBeNull()
  })
})

describe('cancelAllCacheDownloads', () => {
  test('cancels the active download and rejects every queued entry', async () => {
    const activeDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => {
      if (url === URL_A) return activeDownload.promise
      return url
    })
    // The active download is cancelled via cancelCacheDownload → cancelAudioDownload.
    mockedCancelAudioDownload.mockImplementation(() => {
      activeDownload.reject(new CacheCancelledError(URL_A))
      return true
    })

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    const third = enqueueCache(ctx, URL_C, PLAYLIST_SOURCE)

    cancelAllCacheDownloads(ctx)

    await expect(first).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(third).rejects.toBeInstanceOf(CacheCancelledError)
    expect(mockedCancelAudioDownload).toHaveBeenCalledWith(URL_A)
    expect(ctx.get(cacheQueueAtom)).toEqual({})
    expect(ctx.get(activeCacheUrlAtom)).toBeNull()
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
  })

  test('is a no-op when the queue is idle even with a registered stopper', () => {
    const stopper = jest.fn()
    registerPlaylistRunStopper(stopper)

    expect(() => cancelAllCacheDownloads(ctx)).not.toThrow()
    expect(ctx.get(cacheQueueAtom)).toEqual({})
    expect(ctx.get(activeCacheUrlAtom)).toBeNull()
    expect(stopper).not.toHaveBeenCalled()
  })

  test('clears requesters and progress for cancelled queued entries', async () => {
    const activeDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => {
      if (url === URL_A) return activeDownload.promise
      return url
    })
    mockedCancelAudioDownload.mockImplementation(() => {
      activeDownload.reject(new CacheCancelledError(URL_A))
      return true
    })

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    const third = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)
    void enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    expect(getCacheRequesters(URL_B)).toEqual(new Set([MANUAL_SOURCE, PLAYLIST_SOURCE]))

    cancelAllCacheDownloads(ctx)

    expect(getCacheRequesters(URL_B)).toEqual(new Set())
    await expect(first).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
    await expect(third).rejects.toBeInstanceOf(CacheCancelledError)
  })

  test('invokes every registered playlist run stopper', () => {
    const stopperA = jest.fn()
    const stopperB = jest.fn()
    registerPlaylistRunStopper(stopperA)
    registerPlaylistRunStopper(stopperB)
    activeCacheUrlAtom(ctx, URL_A)

    cancelAllCacheDownloads(ctx)

    expect(stopperA).toHaveBeenCalledTimes(1)
    expect(stopperB).toHaveBeenCalledTimes(1)
  })

  test('unregister removes only that stopper (identity-based)', () => {
    const stopperA = jest.fn()
    const stopperB = jest.fn()
    registerPlaylistRunStopper(stopperA)
    registerPlaylistRunStopper(stopperB)
    unregisterPlaylistRunStopper(stopperA)
    activeCacheUrlAtom(ctx, URL_A)

    cancelAllCacheDownloads(ctx)

    expect(stopperA).not.toHaveBeenCalled()
    expect(stopperB).toHaveBeenCalledTimes(1)
  })
})

describe('lost-kick guard', () => {
  test('entry enqueued while the runner is finishing is not stranded', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    // Resolve A and enqueue B in the same synchronous block — the runner is
    // finishing A while B arrives.
    firstDownload.resolve(URL_A)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

    await expect(first).resolves.toBe(URL_A)
    await expect(second).resolves.toBe(URL_B)
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(2)
  })
})

describe('mixed sources', () => {
  test('processes manual, playlist and auto strictly serially in FIFO order', async () => {
    const order: string[] = []
    let active = 0
    let maxActive = 0
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => {
      active++
      maxActive = Math.max(maxActive, active)
      order.push(url)
      await Promise.resolve()
      active--
      return url
    })

    const manual = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const playlist = enqueueCache(ctx, URL_B, PLAYLIST_SOURCE)
    const auto = enqueueCache(ctx, URL_C, 'auto')
    await Promise.all([manual, playlist, auto])

    expect(order).toEqual([URL_A, URL_B, URL_C])
    expect(maxActive).toBe(1)
  })
})

describe('sentinel catch', () => {
  test('a rejection with a late awaiter does not surface as unhandled', async () => {
    const unhandled: unknown[] = []
    const listener = (reason: unknown) => {
      unhandled.push(reason)
    }
    process.on('unhandledRejection', listener)
    try {
      const firstDownload = createControlledDownload()
      mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
      mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

      const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
      const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)

      // Cancel B — its deferred rejects before any awaiter attaches.
      removeFromQueue(ctx, URL_B)

      // Give Node a chance to flag the rejection as unhandled.
      await new Promise(resolve => setTimeout(resolve, 0))

      await expect(second).rejects.toBeInstanceOf(CacheCancelledError)
      expect(unhandled).toEqual([])
      firstDownload.resolve(URL_A)
      await expect(first).resolves.toBe(URL_A)
    } finally {
      process.removeListener('unhandledRejection', listener)
    }
  })
})

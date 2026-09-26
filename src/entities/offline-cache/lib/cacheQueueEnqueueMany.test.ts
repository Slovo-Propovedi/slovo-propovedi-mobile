import { createCtx, type Ctx } from '@reatom/framework'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'
import { _resetCacheQueueForTesting } from './cacheQueue'
import { enqueueCache } from './cacheQueueEnqueue'
import { enqueueCacheMany } from './cacheQueueEnqueueMany'
import { getCacheRequesters } from './cacheQueueRegistries'
import { cacheQueueAtom } from './cacheQueueState'
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

describe('enqueueCacheMany', () => {
  test('writes the cacheQueueAtom exactly once for many URLs', () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)
    let writes = 0
    let isInitial = true
    ctx.subscribe(cacheQueueAtom, () => {
      if (isInitial) {
        isInitial = false
        return
      }
      writes++
    })

    enqueueCacheMany(ctx, [URL_A, URL_B, URL_C], PLAYLIST_SOURCE)

    expect(writes).toBe(1)
  })

  test('assigns enqueuedAt in array order (FIFO)', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const results = enqueueCacheMany(ctx, [URL_A, URL_B, URL_C], PLAYLIST_SOURCE)

    // The runner picks URL_A (enqueuedAt 0) and removes it from the atom.
    expect(ctx.get(cacheQueueAtom)).toEqual({
      [URL_B]: { enqueuedAt: 1, source: PLAYLIST_SOURCE },
      [URL_C]: { enqueuedAt: 2, source: PLAYLIST_SOURCE },
    })

    firstDownload.resolve(URL_A)
    await Promise.all(results)
  })

  test('returns one promise per input URL in input order', async () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const results = enqueueCacheMany(ctx, [URL_A, URL_B, URL_C], PLAYLIST_SOURCE)

    expect(results).toHaveLength(3)
    await expect(results[0]).resolves.toBe(URL_A)
    await expect(results[1]).resolves.toBe(URL_B)
    await expect(results[2]).resolves.toBe(URL_C)
  })

  test('shares the first occurrence promise for in-batch duplicates', async () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const results = enqueueCacheMany(ctx, [URL_A, URL_A, URL_B], PLAYLIST_SOURCE)

    expect(results[0]).toBe(results[1])
    expect(results[0]).not.toBe(results[2])
    await Promise.all(results)
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(2)
  })

  test('joins an already-queued URL from a previous enqueue', async () => {
    const firstDownload = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(firstDownload.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const second = enqueueCache(ctx, URL_B, MANUAL_SOURCE)
    const results = enqueueCacheMany(ctx, [URL_B, URL_C], PLAYLIST_SOURCE)

    // B is still queued (the runner is busy with A) → the batch joins B's
    // queued promise instead of starting a second download.
    expect(results[0]).toBe(second)
    firstDownload.resolve(URL_A)
    await Promise.all([first, second, ...results])
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(3)
  })

  test('joins a non-aborted inflight download', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    inflightCache.set(URL_A, entry)

    const results = enqueueCacheMany(ctx, [URL_A], PLAYLIST_SOURCE)

    expect(mockedCacheAudioWithProgress).not.toHaveBeenCalled()
    download.resolve(URL_A)
    await expect(results[0]).resolves.toBe(URL_A)
  })

  test('treats an aborted inflight entry as fresh (Bug B)', async () => {
    const download = createControlledDownload()
    const { entry } = createInflightDownload(undefined, undefined, () => download.promise)
    entry.aborted = true
    inflightCache.set(URL_A, entry)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const results = enqueueCacheMany(ctx, [URL_A], PLAYLIST_SOURCE)

    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
    await expect(results[0]).resolves.toBe(URL_A)
  })

  test('handles 150 URLs without stranding any promise', async () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)
    const urls = Array.from({ length: 150 }, (_, i) => `http://example.com/${i}.mp3`)

    const results = enqueueCacheMany(ctx, urls, PLAYLIST_SOURCE)

    expect(results).toHaveLength(150)
    await expect(Promise.all(results)).resolves.toEqual(urls)
  })

  test('pre-validates the whole array before any mutation', async () => {
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    // A mid-array empty URL must throw WITHOUT stranding the earlier URLs.
    expect(() => enqueueCacheMany(ctx, ['ok-url', '', 'other'], PLAYLIST_SOURCE)).toThrow(
      '[cacheQueue] audioUrl is required',
    )

    // Zero side effects: the queue atom stays empty and no earlier URL was
    // registered into pendingPromises/requesters.
    expect(ctx.get(cacheQueueAtom)).toEqual({})

    // Re-enqueueing the earlier 'ok-url' starts a FRESH download that actually
    // settles — it did not join a stranded (forever-pending) deferred.
    const results = enqueueCacheMany(ctx, ['ok-url'], PLAYLIST_SOURCE)
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledTimes(1)
    await expect(results[0]).resolves.toBe('ok-url')
  })

  test('registers requesters for joined queued entries', async () => {
    const download = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValueOnce(download.promise)
    mockedCacheAudioWithProgress.mockImplementation(async (_ctx, url) => url)

    const first = enqueueCache(ctx, URL_A, MANUAL_SOURCE)
    const results = enqueueCacheMany(ctx, [URL_A], PLAYLIST_SOURCE)

    expect(getCacheRequesters(URL_A)).toEqual(new Set([MANUAL_SOURCE, PLAYLIST_SOURCE]))

    download.resolve(URL_A)
    await first
    await results[0]
  })
})

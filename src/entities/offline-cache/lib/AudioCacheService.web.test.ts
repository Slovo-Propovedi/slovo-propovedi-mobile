import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  _resetInflightCacheForTesting,
  audioCacheService,
  cacheAudio,
  removeFromCache,
} from './AudioCacheService.web'
import { CacheCancelledError } from './CacheCancelledError'
import { inflightCache } from './inflightCache'
import { commitAudioUrl } from './webCacheManifest'
import * as webDownloadJournal from './webDownloadJournal'

const AUDIO_URL = 'https://cdn.example.com/sermon-1.mp3'
const OTHER_URL = 'https://cdn.example.com/sermon-2.mp3'

class FakeCache {
  private readonly store = new Map<string, Response>()

  public match = jest.fn(async (request: Request | string) => {
    const stored = this.store.get(keyOf(request))
    // Mirror the real Cache API: each match returns a fresh copy, so reading a
    // body (e.g. the manifest `.json()`) never consumes the stored response.
    return stored ? stored.clone() : undefined
  })
  public put = jest.fn(async (request: Request | string, response: Response) => {
    this.store.set(keyOf(request), response)
  })
  public delete = jest.fn(async (request: Request | string) => this.store.delete(keyOf(request)))
  public keys = jest.fn(async () => [...this.store.keys()].map(url => new Request(url)))
  public add = jest.fn(async () => undefined)
  public addAll = jest.fn(async () => undefined)
  public matchAll = jest.fn(async () => [])
}

class FakeCacheStorage {
  public readonly buckets = new Map<string, FakeCache>()

  public open = jest.fn(async (name: string) => {
    const existing = this.buckets.get(name)
    if (existing) return existing
    const created = new FakeCache()
    this.buckets.set(name, created)
    return created
  })
  public delete = jest.fn(async (name: string) => this.buckets.delete(name))
}

const keyOf = (request: Request | string): string => {
  const url = typeof request === 'string' ? request : request.url
  // The real Cache API resolves relative keys (e.g. the `__manifest__` entry)
  // against the document base URL; mirror that so `keys()` yields valid URLs.
  return new URL(url, 'https://cache.test').href
}

const bucket = (): FakeCache => cacheStorage.buckets.get('audio-cache-v1') as FakeCache

const readManifest = async (): Promise<string[]> => {
  const entry = await bucket().match('__manifest__')
  if (!entry) return []
  const manifest = JSON.parse(await entry.text())
  return Array.isArray(manifest.urls) ? manifest.urls : []
}

let cacheStorage: FakeCacheStorage
let unhandledRejectionSpy: jest.Mock | null = null

const mp3Body = (bytes: number): Blob => new Blob([new Uint8Array(bytes).fill(1)] as BlobPart[])

const corsResponse = (bytes: number): Response =>
  new Response(mp3Body(bytes), {
    headers: { 'Content-Length': String(bytes), 'Content-Type': 'audio/mpeg' },
    status: 200,
  })

// Each fetch call must return a FRESH response — a shared one would have its
// body consumed by the first download's progress read (mirrors real fetches).
const mockFetchOk = (bytes: number): jest.SpyInstance =>
  jest.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(corsResponse(bytes)))

const waitForFetchCall = async (spy: jest.SpyInstance): Promise<void> => {
  for (let i = 0; i < 100; i++) {
    if (spy.mock.calls.length > 0) return
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  throw new Error('fetch was never called')
}

const waitForProgress = async (progress: number[], expected: number): Promise<void> => {
  for (let i = 0; i < 100; i++) {
    if (progress.includes(expected)) return
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  throw new Error(`progress ${expected} was never reported`)
}

beforeEach(() => {
  _resetInflightCacheForTesting()
  cacheStorage = new FakeCacheStorage()
  ;(globalThis as { caches: unknown }).caches = cacheStorage
  jest.restoreAllMocks()
  return AsyncStorage.clear()
})

afterEach(() => {
  delete (globalThis as { caches?: unknown }).caches
  if (unhandledRejectionSpy) {
    process.off('unhandledRejection', unhandledRejectionSpy)
    unhandledRejectionSpy = null
  }
})

describe('AudioCacheService.web', () => {
  test('nothing is cached before a download', async () => {
    mockFetchOk(1024)

    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
    await expect(audioCacheService.getCachedUri(AUDIO_URL)).resolves.toBeNull()
  })

  test('cacheAudio downloads, reports 0..1 progress and stores the file', async () => {
    mockFetchOk(4096)
    const progress: number[] = []

    const result = await cacheAudio(AUDIO_URL, p => progress.push(p))

    expect(result).toBe(AUDIO_URL)
    expect(progress[0]).toBe(0)
    expect(progress.at(-1)).toBe(1)
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(true)
    await expect(audioCacheService.getCacheInfo()).resolves.toEqual({
      fileCount: 1,
      totalSize: 4096,
    })
  })

  test('falls back to an opaque no-cors response when CORS is refused', async () => {
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('CORS'))
      .mockResolvedValueOnce(new Response(mp3Body(2048), { status: 200 }))
    const progress: number[] = []

    await cacheAudio(AUDIO_URL, p => progress.push(p))

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      AUDIO_URL,
      expect.objectContaining({ mode: 'cors' }),
    )
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      AUDIO_URL,
      expect.objectContaining({ mode: 'no-cors' }),
    )
    expect(progress).toEqual([0, 1])
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(true)
  })

  test('concurrent cacheAudio calls for the same url share one download', async () => {
    const fetchSpy = mockFetchOk(1024)

    const [a, b] = await Promise.all([cacheAudio(AUDIO_URL), cacheAudio(AUDIO_URL)])

    expect(a).toBe(b)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test('late joiner immediately receives the current progress value', async () => {
    const totalBytes = 1024
    const halfBytes = totalBytes / 2
    let controller!: ReadableStreamDefaultController<Uint8Array>
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c
      },
    })
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, {
        headers: { 'Content-Length': String(totalBytes), 'Content-Type': 'audio/mpeg' },
        status: 200,
      }),
    )

    const progressA: number[] = []
    const promiseA = cacheAudio(AUDIO_URL, p => progressA.push(p))
    await waitForFetchCall(fetchSpy)

    // Deliver half the bytes but keep the stream open, so the download stays
    // in flight at a partial fraction.
    controller.enqueue(new Uint8Array(halfBytes).fill(1))
    await waitForProgress(progressA, 0.5)

    // A late caller joins the still-inflight download and gets the current
    // fraction synchronously — no waiting for the next tick.
    const progressB: number[] = []
    const promiseB = cacheAudio(AUDIO_URL, p => progressB.push(p))
    expect(progressB[0]).toBe(0.5)

    controller.close()
    await expect(promiseA).resolves.toBe(AUDIO_URL)
    await expect(promiseB).resolves.toBe(AUDIO_URL)
    expect(progressA.at(-1)).toBe(1)
    expect(progressB.at(-1)).toBe(1)
  })

  test('clears the journal row and stops the heartbeat when fetch fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))
    const removeSpy = jest.spyOn(webDownloadJournal, 'removeActiveDownload')

    await expect(cacheAudio(AUDIO_URL)).rejects.toThrow('network down')

    expect(removeSpy).toHaveBeenCalledWith(AUDIO_URL)
    await expect(webDownloadJournal.getActiveDownloads()).resolves.toEqual([])
  })

  test('cancelAudioDownload aborts the fetch, deletes the entry and rejects with CacheCancelledError', async () => {
    let fetchSignal: AbortSignal | undefined
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_url: RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          fetchSignal = init?.signal ?? undefined
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')))
        }),
    )

    const promise = cacheAudio(AUDIO_URL)
    await waitForFetchCall(fetchSpy)

    expect(audioCacheService.cancelAudioDownload(AUDIO_URL)).toBe(true)

    await expect(promise).rejects.toBeInstanceOf(CacheCancelledError)
    expect(fetchSignal?.aborted).toBe(true)
    expect(bucket().delete).toHaveBeenCalledWith(AUDIO_URL, { ignoreVary: true })
  })

  test('cancelAudioDownload returns false when nothing is inflight', () => {
    expect(audioCacheService.cancelAudioDownload(AUDIO_URL)).toBe(false)
  })

  test('marks the inflight entry aborted so re-enqueue treats it as non-joinable (Bug B)', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_url: RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')))
        }),
    )

    const promise = cacheAudio(AUDIO_URL)
    await waitForFetchCall(fetchSpy)

    expect(audioCacheService.cancelAudioDownload(AUDIO_URL)).toBe(true)

    // Synchronously after cancel the dying entry is still present but marked
    // aborted — the queue's inflightIsJoinable then starts a fresh download.
    expect(inflightCache.get(AUDIO_URL)?.aborted).toBe(true)
    await expect(promise).rejects.toBeInstanceOf(CacheCancelledError)
  })

  test('starts a fresh download when the inflight entry is aborted (Bug B chokepoint)', async () => {
    // A dying inflight entry created through cacheAudio, then cancelled so it
    // is marked aborted but has not settled yet.
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(
      (_url: RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')))
        }),
    )
    const dying = cacheAudio(AUDIO_URL)
    await waitForFetchCall(fetchSpy)
    expect(audioCacheService.cancelAudioDownload(AUDIO_URL)).toBe(true)
    expect(inflightCache.get(AUDIO_URL)?.aborted).toBe(true)

    // A fresh cacheAudio must NOT join the dying promise.
    const freshFetchSpy = mockFetchOk(1024)
    const fresh = cacheAudio(AUDIO_URL)

    expect(fresh).not.toBe(dying)
    expect(freshFetchSpy).toHaveBeenCalledTimes(1)

    // Let the dying entry settle (reject) — its identity-guarded cleanup must
    // NOT delete the fresh entry from the inflight cache.
    await expect(dying).rejects.toBeInstanceOf(CacheCancelledError)
    expect(inflightCache.get(AUDIO_URL)).toBeDefined()

    await expect(fresh).resolves.toBe(AUDIO_URL)
  })

  test('removeFromCache and clearCache drop entries', async () => {
    mockFetchOk(1024)
    await cacheAudio(AUDIO_URL)
    await cacheAudio(OTHER_URL)

    await expect(removeFromCache(AUDIO_URL)).resolves.toBe(true)
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
    await expect(audioCacheService.isCached(OTHER_URL)).resolves.toBe(true)

    await audioCacheService.clearCache()
    expect(cacheStorage.delete).toHaveBeenCalledWith('audio-cache-v1')
  })

  test('clearCache also clears the active-downloads journal', async () => {
    mockFetchOk(1024)
    await cacheAudio(AUDIO_URL)
    await webDownloadJournal.addActiveDownload(OTHER_URL)
    await expect(webDownloadJournal.getActiveDownloads()).resolves.toContainEqual(
      expect.objectContaining({ url: OTHER_URL }),
    )

    await audioCacheService.clearCache()

    await expect(webDownloadJournal.getActiveDownloads()).resolves.toEqual([])
  })

  test('cacheAudio rejects an empty url', () => {
    expect(() => cacheAudio('')).toThrow('audioUrl is required')
  })

  test('degrades to "not cached" when Cache Storage is unavailable', async () => {
    delete (globalThis as { caches?: unknown }).caches

    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
    await expect(audioCacheService.getCacheInfo()).resolves.toEqual({ fileCount: 0, totalSize: 0 })
  })

  test('removeFromCache on an unknown url resolves false', async () => {
    mockFetchOk(1024)
    await expect(removeFromCache(OTHER_URL)).resolves.toBe(false)
  })

  test('bucket keeps a single entry per url', async () => {
    mockFetchOk(1024)
    await cacheAudio(AUDIO_URL)
    // A sequential re-cache of the same url now hits the skip path — no re-put.
    bucket().put.mockClear()
    await cacheAudio(AUDIO_URL)

    expect(bucket().put).not.toHaveBeenCalled()
    await expect(audioCacheService.getCacheInfo()).resolves.toEqual({
      fileCount: 1,
      totalSize: 1024,
    })
  })

  test('skips download when track is committed in the manifest', async () => {
    const fetchSpy = mockFetchOk(1024)
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    await bucket().put(
      '__manifest__',
      new Response(JSON.stringify({ urls: [AUDIO_URL], version: 1 })),
    )
    bucket().put.mockClear()
    const progress: number[] = []

    const result = await cacheAudio(AUDIO_URL, p => progress.push(p))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(bucket().put).not.toHaveBeenCalled()
    expect(progress).toEqual([1])
    expect(result).toBe(AUDIO_URL)
  })

  test('skip path does not journal the url', async () => {
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    await bucket().put(
      '__manifest__',
      new Response(JSON.stringify({ urls: [AUDIO_URL], version: 1 })),
    )
    const fetchSpy = mockFetchOk(1024)

    await cacheAudio(AUDIO_URL)

    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(webDownloadJournal.getActiveDownloads()).resolves.toEqual([])
  })

  test('journals the url during download and clears it after success', async () => {
    let resolveFetch!: (value: Response) => void
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>(resolve => {
        resolveFetch = resolve
      }),
    )

    const promise = cacheAudio(AUDIO_URL)
    await waitForFetchCall(fetchSpy)

    await expect(webDownloadJournal.getActiveDownloads()).resolves.toEqual([
      expect.objectContaining({ url: AUDIO_URL }),
    ])

    resolveFetch(corsResponse(1024))
    await promise
    await expect(webDownloadJournal.getActiveDownloads()).resolves.toEqual([])
  })

  test('journals the url before starting the fetch', async () => {
    const fetchSpy = mockFetchOk(1024)
    const addSpy = jest.spyOn(webDownloadJournal, 'addActiveDownloadWithHeartbeat')

    await cacheAudio(AUDIO_URL)

    expect(addSpy).toHaveBeenCalledWith(AUDIO_URL)
    expect(addSpy.mock.invocationCallOrder[0]).toBeLessThan(fetchSpy.mock.invocationCallOrder[0])
  })

  test('re-downloads and deletes a stale entry that is present but uncommitted', async () => {
    mockFetchOk(1024)
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    await bucket().put('__manifest__', new Response(JSON.stringify({ urls: [], version: 1 })))
    bucket().delete.mockClear()
    bucket().put.mockClear()

    const result = await cacheAudio(AUDIO_URL)

    expect(bucket().delete).toHaveBeenCalledWith(AUDIO_URL, { ignoreVary: true })
    expect(bucket().put).toHaveBeenCalledWith(AUDIO_URL, expect.any(Response))
    expect(result).toBe(AUDIO_URL)
    const manifest = await readManifest()
    expect(manifest).toContain(AUDIO_URL)
  })

  test('legacy migration builds the manifest on first commit', async () => {
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    bucket().put.mockClear()

    await commitAudioUrl(bucket(), AUDIO_URL)

    const manifest = await readManifest()
    expect(manifest).toContain(AUDIO_URL)
  })

  test('removeFromCache uncommits the url', async () => {
    mockFetchOk(1024)
    await cacheAudio(AUDIO_URL)

    await removeFromCache(AUDIO_URL)

    const manifest = await readManifest()
    expect(manifest).not.toContain(AUDIO_URL)
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
  })

  test('removeFromCache with no manifest does not enumerate the bucket', async () => {
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    bucket().keys.mockClear()
    bucket().put.mockClear()

    await expect(removeFromCache(AUDIO_URL)).resolves.toBe(true)

    expect(bucket().keys).not.toHaveBeenCalled()
    expect(bucket().put).not.toHaveBeenCalled()
  })

  test('summarize excludes the manifest entry', async () => {
    mockFetchOk(1024)
    await cacheAudio(AUDIO_URL)
    await cacheAudio(OTHER_URL)

    await expect(audioCacheService.getCacheInfo()).resolves.toEqual({
      fileCount: 2,
      totalSize: 2048,
    })
  })

  test('parallel isCached calls on a legacy bucket never build the manifest', async () => {
    await cacheStorage.open('audio-cache-v1')
    await bucket().put(AUDIO_URL, corsResponse(1024))
    bucket().keys.mockClear()
    bucket().put.mockClear()

    const [a, b] = await Promise.all([
      audioCacheService.isCached(AUDIO_URL),
      audioCacheService.isCached(AUDIO_URL),
    ])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(bucket().keys).not.toHaveBeenCalled()
    expect(bucket().put).not.toHaveBeenCalled()
  })

  test('recovers cache bucket when open fails once', async () => {
    const fetchSpy = mockFetchOk(1024)
    cacheStorage.open.mockRejectedValueOnce(new TypeError('corrupt bucket'))

    await cacheAudio(AUDIO_URL)

    expect(cacheStorage.delete).toHaveBeenCalledWith('audio-cache-v1')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(bucket().put).toHaveBeenCalledWith(AUDIO_URL, expect.any(Response))
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(true)
  })

  test('rejects cleanly when cache storage is unusable', async () => {
    cacheStorage.open.mockRejectedValue(new TypeError('corrupt bucket'))
    unhandledRejectionSpy = jest.fn()
    process.on('unhandledRejection', unhandledRejectionSpy)

    await expect(cacheAudio(AUDIO_URL)).rejects.toBeInstanceOf(Error)

    // Flush microtasks/timers so any unhandled rejection would have fired by now.
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(unhandledRejectionSpy).not.toHaveBeenCalled()
  })
})

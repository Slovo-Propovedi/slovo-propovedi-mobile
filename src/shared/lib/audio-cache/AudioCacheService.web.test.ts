import {
  _resetInflightCacheForTesting,
  audioCacheService,
  cacheAudio,
  removeFromCache,
} from './AudioCacheService.web'

const AUDIO_URL = 'https://cdn.example.com/sermon-1.mp3'
const OTHER_URL = 'https://cdn.example.com/sermon-2.mp3'

class FakeCache {
  private readonly store = new Map<string, Response>()

  public match = jest.fn(async (request: Request | string) => this.store.get(keyOf(request)))
  public put = jest.fn(async (request: Request | string, response: Response) => {
    this.store.set(keyOf(request), response)
  })
  public delete = jest.fn(async (request: Request | string) => this.store.delete(keyOf(request)))
  public keys = jest.fn(async () => [...this.store.keys()].map(url => new Request(url)))
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

const keyOf = (request: Request | string): string =>
  typeof request === 'string' ? request : request.url

const bucket = (): FakeCache => cacheStorage.buckets.get('audio-cache-v1') as FakeCache

let cacheStorage: FakeCacheStorage

const mp3Body = (bytes: number): Blob => new Blob([new Uint8Array(bytes).fill(1)] as BlobPart[])

const corsResponse = (bytes: number): Response =>
  new Response(mp3Body(bytes), {
    headers: { 'Content-Length': String(bytes), 'Content-Type': 'audio/mpeg' },
    status: 200,
  })

beforeEach(() => {
  _resetInflightCacheForTesting()
  cacheStorage = new FakeCacheStorage()
  ;(globalThis as { caches: unknown }).caches = cacheStorage
  jest.restoreAllMocks()
})

afterEach(() => {
  delete (globalThis as { caches?: unknown }).caches
})

describe('AudioCacheService.web', () => {
  test('nothing is cached before a download', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(1024))

    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
    await expect(audioCacheService.getCachedUri()).resolves.toBeNull()
  })

  test('cacheAudio downloads, reports 0..1 progress and stores the file', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(4096))
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

    expect(fetchSpy).toHaveBeenNthCalledWith(1, AUDIO_URL, { mode: 'cors' })
    expect(fetchSpy).toHaveBeenNthCalledWith(2, AUDIO_URL, { mode: 'no-cors' })
    expect(progress).toEqual([0, 1])
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(true)
  })

  test('concurrent cacheAudio calls for the same url share one download', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(1024))

    const [a, b] = await Promise.all([cacheAudio(AUDIO_URL), cacheAudio(AUDIO_URL)])

    expect(a).toBe(b)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test('removeFromCache and clearCache drop entries', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(1024))
    await cacheAudio(AUDIO_URL)
    await cacheAudio(OTHER_URL)

    await expect(removeFromCache(AUDIO_URL)).resolves.toBe(true)
    await expect(audioCacheService.isCached(AUDIO_URL)).resolves.toBe(false)
    await expect(audioCacheService.isCached(OTHER_URL)).resolves.toBe(true)

    await audioCacheService.clearCache()
    expect(cacheStorage.delete).toHaveBeenCalledWith('audio-cache-v1')
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
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(1024))
    await expect(removeFromCache(OTHER_URL)).resolves.toBe(false)
  })

  test('bucket keeps a single entry per url', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(corsResponse(1024))
    await cacheAudio(AUDIO_URL)
    await cacheAudio(AUDIO_URL)

    expect(bucket().put).toHaveBeenCalledTimes(2)
    await expect(audioCacheService.getCacheInfo()).resolves.toEqual({
      fileCount: 1,
      totalSize: 1024,
    })
  })
})

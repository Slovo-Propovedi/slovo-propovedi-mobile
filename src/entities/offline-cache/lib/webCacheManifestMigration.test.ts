import { commitAudioUrl, readCommittedUrls, uncommitAudioUrl } from './webCacheManifest'
import { migrateAudioManifest, resumeAudioManifestMigration } from './webCacheManifestMigration'
import { readManifestState } from './webCacheManifestRead'
import { writeManifestState } from './webCacheManifestStore'

const AUDIO_URL = 'https://cdn.example.com/sermon-1.mp3'
const OTHER_URL = 'https://cdn.example.com/sermon-2.mp3'
const THIRD_URL = 'https://cdn.example.com/sermon-3.mp3'
const ORIGIN_URL = 'https://cache.test'
const MANIFEST_URL = ORIGIN_URL + '/__manifest__'
const CACHE_NAME = 'audio-cache-v1'
const AUDIO_CONTENT_TYPE = 'audio/mpeg'

class FakeCache {
  private readonly store = new Map<string, Response>()

  public match = jest.fn(async (request: Request | string) => {
    const stored = this.store.get(keyOf(request))
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
  return new URL(url, ORIGIN_URL).href
}

const completeResponse = (bytes: number): Response =>
  new Response(new Blob([new Uint8Array(bytes).fill(1)]), {
    headers: { 'Content-Length': String(bytes), 'Content-Type': AUDIO_CONTENT_TYPE },
    status: 200,
  })

const sizedResponse = (bodyBytes: number, declaredBytes: number): Response =>
  new Response(new Blob([new Uint8Array(bodyBytes).fill(1)]), {
    headers: { 'Content-Length': String(declaredBytes), 'Content-Type': AUDIO_CONTENT_TYPE },
    status: 200,
  })

const responseWithoutLength = (bodyBytes: number): Response =>
  new Response(new Blob([new Uint8Array(bodyBytes).fill(1)]), {
    headers: { 'Content-Type': AUDIO_CONTENT_TYPE },
    status: 200,
  })

const storedManifest = async (): Promise<{
  unverified: string[]
  urls: string[]
  version: number
}> => {
  const entry = await bucket().match(MANIFEST_URL)
  return entry ? entry.json() : { unverified: [], urls: [], version: 0 }
}

let cacheStorage: FakeCacheStorage
let originalNavigator: PropertyDescriptor | undefined

const bucket = (): FakeCache => cacheStorage.buckets.get(CACHE_NAME) as FakeCache

const openBucket = (): Promise<FakeCache> => cacheStorage.open(CACHE_NAME) as Promise<FakeCache>

beforeEach(async () => {
  cacheStorage = new FakeCacheStorage()
  ;(globalThis as { caches: unknown }).caches = cacheStorage
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { origin: ORIGIN_URL },
  })
  originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Reflect.deleteProperty(globalThis, 'navigator')
  await openBucket()
})

afterEach(() => {
  delete (globalThis as { caches?: unknown }).caches
  Reflect.deleteProperty(globalThis, 'location')
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  else Reflect.deleteProperty(globalThis, 'navigator')
})

describe('migrateAudioManifest', () => {
  test('commits a complete legacy entry after the commit path marks it unverified', async () => {
    await bucket().put(AUDIO_URL, completeResponse(128))

    // No manifest yet: the first commit must NOT trust the legacy bucket entry.
    await commitAudioUrl(bucket(), OTHER_URL)

    const before = await readManifestState(bucket())
    expect(before.unverified).toEqual([AUDIO_URL])
    expect(await readCommittedUrls(bucket())).toEqual(new Set([OTHER_URL]))

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    const committed = await readCommittedUrls(bucket())
    expect(committed).toEqual(new Set([AUDIO_URL, OTHER_URL]))
    expect((await readManifestState(bucket())).unverified).toEqual([])
  })

  test('deletes and does not commit a truncated entry', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])
    await bucket().put(AUDIO_URL, sizedResponse(100, 200))

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect(await readCommittedUrls(bucket())).toEqual(new Set())
    expect(bucket().delete).toHaveBeenCalledWith(AUDIO_URL, { ignoreVary: true })
    await expect(bucket().match(AUDIO_URL)).resolves.toBeUndefined()
  })

  test('deletes and does not commit a body longer than its declared length', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])
    await bucket().put(AUDIO_URL, sizedResponse(200, 100))

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect(await readCommittedUrls(bucket())).toEqual(new Set())
    expect(bucket().delete).toHaveBeenCalledWith(AUDIO_URL, { ignoreVary: true })
    await expect(bucket().match(AUDIO_URL)).resolves.toBeUndefined()
  })

  test('deletes and does not commit a bodied entry without Content-Length', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])
    await bucket().put(AUDIO_URL, responseWithoutLength(128))

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect(await readCommittedUrls(bucket())).toEqual(new Set())
    expect(bucket().delete).toHaveBeenCalledWith(AUDIO_URL, { ignoreVary: true })
    await expect(bucket().match(AUDIO_URL)).resolves.toBeUndefined()
  })

  test('deletes and does not commit an entry with an unreadable body', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])
    await bucket().put(AUDIO_URL, Response.error())

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect(await readCommittedUrls(bucket())).toEqual(new Set())
    await expect(bucket().match(AUDIO_URL)).resolves.toBeUndefined()
  })

  test('silently drops an unverified url whose entry is missing', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect((await readManifestState(bucket())).unverified).toEqual([])
  })

  test('persists progress and resumes after a budget interruption', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL, OTHER_URL])
    await bucket().put(AUDIO_URL, completeResponse(64))
    await bucket().put(OTHER_URL, completeResponse(64))
    let ticks = 0
    const now = (): number => (ticks += 1000)

    await expect(migrateAudioManifest(bucket(), 1000, now)).resolves.toBe(false)

    const interrupted = await readManifestState(bucket())
    expect(interrupted.urls).toEqual(new Set([AUDIO_URL]))
    expect(interrupted.unverified).toEqual([OTHER_URL])

    await expect(migrateAudioManifest(bucket(), 1000, now)).resolves.toBe(true)

    const finished = await readManifestState(bucket())
    expect(finished.urls).toEqual(new Set([AUDIO_URL, OTHER_URL]))
    expect(finished.unverified).toEqual([])
  })

  test('upgrades a v1 manifest by re-verifying its trusted urls', async () => {
    await bucket().put(
      MANIFEST_URL,
      new Response(JSON.stringify({ urls: [AUDIO_URL], version: 1 })),
    )
    await bucket().put(AUDIO_URL, completeResponse(256))

    // v1 trust is gone as soon as the manifest is read.
    expect(await readCommittedUrls(bucket())).toEqual(new Set())

    await expect(migrateAudioManifest(bucket())).resolves.toBe(true)

    expect(await readCommittedUrls(bucket())).toEqual(new Set([AUDIO_URL]))
    const manifest = await storedManifest()
    expect(manifest.version).toBe(2)
    expect(manifest.unverified).toEqual([])
  })

  test('commitAudioUrl removes the url from unverified', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])

    await commitAudioUrl(bucket(), AUDIO_URL)

    const state = await readManifestState(bucket())
    expect(state.urls).toEqual(new Set([AUDIO_URL]))
    expect(state.unverified).toEqual([])
  })

  test('uncommitAudioUrl removes the url from unverified too', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])

    await uncommitAudioUrl(bucket(), AUDIO_URL)

    const state = await readManifestState(bucket())
    expect(state.urls).toEqual(new Set())
    expect(state.unverified).toEqual([])
  })

  test('merges a commit that lands while another entry is being verified', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL, OTHER_URL])
    await bucket().put(AUDIO_URL, completeResponse(64))
    await bucket().put(OTHER_URL, completeResponse(64))
    const cache = bucket()
    const realMatch = cache.match.getMockImplementation()
    if (!realMatch) throw new Error('FakeCache.match lost its implementation')
    let interleaved = false
    // commit THIRD_URL after this pass decided its state but before it persists A
    cache.match.mockImplementation(async request => {
      if (!interleaved && keyOf(request) === AUDIO_URL) {
        interleaved = true
        await commitAudioUrl(cache, THIRD_URL)
      }
      return realMatch(request)
    })
    let ticks = 0
    const now = (): number => (ticks += 1000)

    await expect(migrateAudioManifest(cache, 1000, now)).resolves.toBe(false)

    const interrupted = await readManifestState(cache)
    expect(interrupted.urls).toEqual(new Set([AUDIO_URL, THIRD_URL]))
    expect(interrupted.unverified).toEqual([OTHER_URL])

    await expect(migrateAudioManifest(cache, 1000, now)).resolves.toBe(true)

    const finished = await readManifestState(cache)
    expect(finished.urls).toEqual(new Set([AUDIO_URL, OTHER_URL, THIRD_URL]))
    expect(finished.unverified).toEqual([])
  })

  test('shares one in-flight pass between concurrent callers', async () => {
    await writeManifestState(bucket(), new Set(), [AUDIO_URL])
    await bucket().put(AUDIO_URL, completeResponse(64))

    const first = migrateAudioManifest(bucket())
    const second = migrateAudioManifest(bucket())

    expect(second).toBe(first)
    await expect(first).resolves.toBe(true)
  })
})

describe('manifest write lock', () => {
  test('runs a commit through navigator.locks when available', async () => {
    const request = jest.fn((_name: string, callback: () => Promise<void>) => callback())
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { locks: { request } },
    })

    await commitAudioUrl(bucket(), AUDIO_URL)

    expect(request).toHaveBeenCalledWith('audio-manifest', expect.any(Function))
    expect(await readCommittedUrls(bucket())).toEqual(new Set([AUDIO_URL]))
  })

  test('falls back to a sequential write without navigator.locks', async () => {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} })

    await expect(commitAudioUrl(bucket(), AUDIO_URL)).resolves.toBeUndefined()
    expect(await readCommittedUrls(bucket())).toEqual(new Set([AUDIO_URL]))
  })

  test('resumeAudioManifestMigration never throws when Cache Storage is unavailable', async () => {
    delete (globalThis as { caches?: unknown }).caches

    await expect(resumeAudioManifestMigration()).resolves.toBeUndefined()
  })
})

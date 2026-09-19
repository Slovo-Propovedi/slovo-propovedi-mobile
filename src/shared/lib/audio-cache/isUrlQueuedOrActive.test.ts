import { ctx } from '../reatom-ctx'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'
import { _resetCacheQueueForTesting } from './cacheQueue'
import { enqueueCache } from './cacheQueueEnqueue'
import { activeCacheUrlAtom, cacheQueueAtom } from './cacheQueueState'
import { resetInflightCache } from './inflightCache'
import { isUrlQueuedOrActive } from './isUrlQueuedOrActive'

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

const URL = 'https://example.com/audio.mp3'

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

describe('isUrlQueuedOrActive', () => {
  beforeEach(() => {
    cacheQueueAtom(ctx, {})
    activeCacheUrlAtom(ctx, null)
  })

  test('true while the URL waits in the serial queue', () => {
    cacheQueueAtom(ctx, { [URL]: { enqueuedAt: Date.now(), source: 'auto' } })

    expect(isUrlQueuedOrActive(URL)).toBe(true)
  })

  test('true while the URL is the active download', () => {
    activeCacheUrlAtom(ctx, URL)

    expect(isUrlQueuedOrActive(URL)).toBe(true)
  })

  test('false when the URL is neither queued nor active', () => {
    expect(isUrlQueuedOrActive(URL)).toBe(false)
  })
})

describe('queue to active handoff gate', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    _resetCacheQueueForTesting()
    resetInflightCache()
    cacheQueueAtom(ctx, {})
    activeCacheUrlAtom(ctx, null)
  })

  test('isUrlQueuedOrActive stays true after the runner dequeues into the active download', async () => {
    const download = createControlledDownload()
    mockedCacheAudioWithProgress.mockReturnValue(download.promise)

    const result = enqueueCache(ctx, URL, 'auto')

    // The runner dequeues synchronously: the URL left the queue and became active.
    expect(ctx.get(cacheQueueAtom)).toEqual({})
    expect(ctx.get(activeCacheUrlAtom)).toBe(URL)
    expect(isUrlQueuedOrActive(URL)).toBe(true)

    download.resolve('/cache/audio.mp3')
    await result
  })
})

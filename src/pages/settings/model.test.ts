import { createCtx } from '@reatom/framework'
import { audioCacheService, hasInflightCacheDownloads } from 'shared/lib/audio-cache'
import { cachedUrlsAtom, cacheUpdateTriggerAtom, markUrlCached } from 'shared/lib/cache-triggers'
import { clearCacheAction } from './model'

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    audioCacheService: {
      ...actual.audioCacheService,
      clearCache: jest.fn().mockResolvedValue(undefined),
    },
    hasInflightCacheDownloads: jest.fn(),
  }
})

const mockedClearCache = jest.mocked(audioCacheService.clearCache)
const mockedHasInflightCacheDownloads = jest.mocked(hasInflightCacheDownloads)

describe('clearCacheAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedHasInflightCacheDownloads.mockReturnValue(false)
  })

  test('clears the cache, drops the overlay and bumps the trigger', async () => {
    const ctx = createCtx()
    markUrlCached(ctx, 'http://example.com/1.mp3')
    const before = ctx.get(cacheUpdateTriggerAtom)

    const result = await clearCacheAction(ctx)

    expect(mockedClearCache).toHaveBeenCalled()
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(before + 1)
    expect(result).toEqual({ success: true })
  })

  test('returns an error result when clearing fails', async () => {
    const ctx = createCtx()
    mockedClearCache.mockRejectedValueOnce(new Error('clear failed'))

    const result = await clearCacheAction(ctx)

    expect(result).toEqual({ error: expect.any(Error), success: false })
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(0)
  })

  test('skips clearing entirely when a download is inflight', async () => {
    const ctx = createCtx()
    markUrlCached(ctx, 'http://example.com/1.mp3')
    const before = ctx.get(cacheUpdateTriggerAtom)
    mockedHasInflightCacheDownloads.mockReturnValue(true)

    const result = await clearCacheAction(ctx)

    expect(mockedClearCache).not.toHaveBeenCalled()
    expect(ctx.get(cachedUrlsAtom)).toEqual({ 'http://example.com/1.mp3': true })
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(before)
    expect(result).toEqual({ success: false })
  })
})

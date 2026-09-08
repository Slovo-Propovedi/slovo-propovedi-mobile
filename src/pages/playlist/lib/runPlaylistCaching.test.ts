import { createCtx } from '@reatom/framework'
import { enqueueCacheMany } from 'shared/lib/audio-cache'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { waitForOnline } from 'shared/lib/network'
import { playlistCacheProgressAtom } from '../model'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { runPlaylistCaching } from './runPlaylistCaching'

jest.mock('shared/lib/network', () => ({
  waitForOnline: jest.fn(),
}))

jest.mock('shared/lib/audio-cache', () => ({
  enqueueCacheMany: jest.fn(),
  isCacheCancelledError: jest.requireActual('shared/lib/audio-cache/CacheCancelledError')
    .isCacheCancelledError,
}))

jest.mock('./PlaylistCacheNotifications', () => ({
  playlistCacheNotifications: {
    hideCachingNotification: jest.fn().mockResolvedValue(undefined),
    showCachingNotification: jest.fn().mockResolvedValue('notification-id'),
    updateCachingNotification: jest.fn().mockResolvedValue('notification-id'),
  },
}))

const TRACKS = [
  { audioUrl: 'http://example.com/1.mp3', id: '1', title: 'Первая' },
  { audioUrl: 'http://example.com/2.mp3', id: '2', title: 'Вторая' },
]

const mockedEnqueueCacheMany = jest.mocked(enqueueCacheMany)
const mockedWaitForOnline = jest.mocked(waitForOnline)
const mockedNotifications = jest.mocked(playlistCacheNotifications)

describe('runPlaylistCaching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedWaitForOnline.mockResolvedValue(true)
    mockedEnqueueCacheMany.mockImplementation((_ctx, urls) => urls.map(url => Promise.resolve(url)))
  })

  test('does not increment cacheUpdateTriggerAtom', async () => {
    const ctx = createCtx()
    const before = ctx.get(cacheUpdateTriggerAtom)

    await runPlaylistCaching(ctx, TRACKS, 'Плейлист', new AbortController().signal)

    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(before)
  })

  test('updates the playlist progress atom through the run', async () => {
    const ctx = createCtx()

    await runPlaylistCaching(ctx, TRACKS, 'Плейлист', new AbortController().signal)

    expect(ctx.get(playlistCacheProgressAtom)).toEqual({ current: 2, total: 2 })
    expect(mockedNotifications.updateCachingNotification).toHaveBeenCalledTimes(2)
  })

  test('returns the failed count and hides the notification', async () => {
    const ctx = createCtx()
    mockedEnqueueCacheMany.mockImplementation((_ctx, urls: string[]) =>
      urls.map(url => {
        if (url === TRACKS[1].audioUrl) {
          const rejected = Promise.reject(new Error('download failed'))
          void rejected.catch(() => {})
          return rejected
        }
        return Promise.resolve(url)
      }),
    )

    const failedCount = await runPlaylistCaching(
      ctx,
      TRACKS,
      'Плейлист',
      new AbortController().signal,
    )

    expect(failedCount).toBe(1)
    expect(mockedNotifications.hideCachingNotification).toHaveBeenCalled()
  })
})

import { createCtx } from '@reatom/framework'
import { audioCacheService } from 'shared/lib/audio-cache'
import { playlistDownloadProgressAtom } from 'shared/lib/cache-triggers'
import { waitForOnline } from 'shared/lib/network'
import { playlistCacheErrorAtom } from '../model'
import { isNetworkError } from './isNetworkError'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { playlistCacheService } from './PlaylistCacheService'

jest.mock('shared/lib/network', () => ({
  waitForOnline: jest.fn(),
}))

jest.mock('shared/lib/audio-cache/AudioCacheService', () => ({
  audioCacheService: { cacheAudio: jest.fn() },
}))

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

const mockedCacheAudio = jest.mocked(audioCacheService.cacheAudio)
const mockedWaitForOnline = jest.mocked(waitForOnline)
const mockedNotifications = jest.mocked(playlistCacheNotifications)

describe('playlistCacheService.cachePlaylist', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedWaitForOnline.mockResolvedValue(true)
    mockedCacheAudio.mockImplementation(async audioUrl => audioUrl ?? '')
  })

  test('caches tracks strictly sequentially (one active download at a time)', async () => {
    const ctx = createCtx()
    let active = 0
    let maxActive = 0
    mockedCacheAudio.mockImplementation(async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await Promise.resolve()
      active--
      return ''
    })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(3)
    expect(maxActive).toBe(1)
  })

  test('completes without error notification when all tracks cached', async () => {
    await playlistCacheService.cachePlaylist(createCtx(), TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(3)
    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
  })

  test('continues past a failed track and reports partial failure count', async () => {
    const ctx = createCtx()
    mockedCacheAudio.mockImplementation(async audioUrl => {
      if (audioUrl === TRACKS[1].audioUrl) throw new Error('download failed')
      return audioUrl ?? ''
    })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(3)
    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    const reportedError = mockedNotifications.showErrorNotification.mock.calls[0][0]
    expect(reportedError.message).toBe('Не удалось скачать 1 из 3')
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('aborts run when offline before a track and swallows network error', async () => {
    const ctx = createCtx()
    mockedWaitForOnline.mockResolvedValue(false)

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedCacheAudio).not.toHaveBeenCalled()
    const reportedError = mockedNotifications.showErrorNotification.mock.calls[0][0]
    expect(reportedError.message).toBe('Нет подключения к интернету')
    expect(ctx.get(playlistCacheErrorAtom)).toBeNull()
    expect(mockedNotifications.hideCachingNotification).toHaveBeenCalled()
  })

  test('leaves no run-owned progress entries after a successful run', async () => {
    const ctx = createCtx()

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('leaves no run-owned progress entries after an offline abort mid-run', async () => {
    const ctx = createCtx()
    mockedWaitForOnline.mockResolvedValueOnce(true).mockResolvedValue(false)

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(1)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('preserves a foreign progress entry from a concurrent manual download', async () => {
    const ctx = createCtx()
    playlistDownloadProgressAtom(ctx, { 'http://other.com/manual.mp3': 0.42 })

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({ 'http://other.com/manual.mp3': 0.42 })
  })

  test('preserves a foreign progress entry after an offline abort mid-run', async () => {
    const ctx = createCtx()
    playlistDownloadProgressAtom(ctx, { 'http://other.com/manual.mp3': 0.42 })
    mockedWaitForOnline.mockResolvedValueOnce(true).mockResolvedValue(false)

    await playlistCacheService.cachePlaylist(ctx, TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(1)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({ 'http://other.com/manual.mp3': 0.42 })
  })

  test('treats offline abort as network error', () => {
    expect(isNetworkError(new Error('Нет подключения к интернету'))).toBe(true)
  })
})

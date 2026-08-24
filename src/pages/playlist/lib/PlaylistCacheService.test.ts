import { createCtx } from '@reatom/framework'
import { audioCacheService } from 'shared/lib/audio-cache'
import { waitForOnline } from 'shared/lib/network'
import { playlistCacheErrorAtom } from '../model'
import { isNetworkError } from './isNetworkError'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { playlistCacheService } from './PlaylistCacheService'

jest.mock('shared/lib/network', () => ({
  waitForOnline: jest.fn(),
}))

jest.mock('shared/lib/audio-cache', () => ({
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

  test('completes without error notification when all tracks cached', async () => {
    await playlistCacheService.cachePlaylist(createCtx(), TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(3)
    expect(mockedNotifications.showCompletionNotification).toHaveBeenCalledWith(3, 'Плейлист')
    expect(mockedNotifications.showErrorNotification).not.toHaveBeenCalled()
  })

  test('continues past a failed track and reports partial failure count', async () => {
    mockedCacheAudio.mockImplementation(async audioUrl => {
      if (audioUrl === TRACKS[1].audioUrl) throw new Error('download failed')
      return audioUrl ?? ''
    })

    await playlistCacheService.cachePlaylist(createCtx(), TRACKS, 'Плейлист')

    expect(mockedCacheAudio).toHaveBeenCalledTimes(3)
    expect(mockedNotifications.showCompletionNotification).not.toHaveBeenCalled()
    const reportedError = mockedNotifications.showErrorNotification.mock.calls[0][0]
    expect(reportedError.message).toBe('Не удалось скачать 1 из 3')
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

  test('treats offline abort as network error', () => {
    expect(isNetworkError(new Error('Нет подключения к интернету'))).toBe(true)
  })
})

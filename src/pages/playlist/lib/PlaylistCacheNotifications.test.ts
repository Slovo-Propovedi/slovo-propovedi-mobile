import {
  hideNotification,
  requestPermissions,
  scheduleNotification,
} from 'shared/lib/notifications'
import {
  ALERT_CHANNEL_ID,
  CACHING_TITLE,
  COMPLETION_TITLE,
  ERROR_TITLE,
  FIXED_NOTIFICATION_ID,
  SILENT_CHANNEL_ID,
} from './notificationConstants'
import { playlistCacheNotifications } from './PlaylistCacheNotifications'
import { ensurePlaylistNotificationChannels } from './playlistChannelIds'

jest.mock('shared/lib/notifications', () => ({
  hideNotification: jest.fn().mockResolvedValue(undefined),
  requestPermissions: jest.fn().mockResolvedValue(true),
  scheduleNotification: jest.fn().mockResolvedValue('notification-id'),
}))

jest.mock('./playlistChannelIds', () => ({
  ensurePlaylistNotificationChannels: jest.fn().mockResolvedValue(undefined),
}))

const mockedScheduleNotification = jest.mocked(scheduleNotification)
const mockedEnsurePlaylistNotificationChannels = jest.mocked(ensurePlaylistNotificationChannels)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PlaylistCacheNotifications channel routing', () => {
  test('showCachingNotification uses silent channel', async () => {
    await playlistCacheNotifications.showCachingNotification('Плейлист')

    expect(mockedEnsurePlaylistNotificationChannels).toHaveBeenCalled()
    expect(mockedScheduleNotification).toHaveBeenCalledWith(
      {
        body: 'Плейлист: Скачивание началось',
        sound: false,
        title: CACHING_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      'playlist-cache',
      SILENT_CHANNEL_ID,
    )
  })

  test('updateCachingNotification uses silent channel', async () => {
    await playlistCacheNotifications.updateCachingNotification('id', 5, 10, 'Плейлист')

    expect(mockedScheduleNotification).toHaveBeenCalledWith(
      {
        body: 'Плейлист: Скачано 5 из 10',
        sound: false,
        title: CACHING_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      'playlist-cache',
      SILENT_CHANNEL_ID,
    )
  })

  test('showCompletionNotification uses alert channel with sound', async () => {
    await playlistCacheNotifications.showCompletionNotification(10, 'Плейлист')

    expect(mockedScheduleNotification).toHaveBeenCalledWith(
      {
        body: 'Плейлист: Скачано 10 проповедей',
        sound: true,
        title: COMPLETION_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      'playlist-cache',
      ALERT_CHANNEL_ID,
    )
  })

  test('showErrorNotification uses alert channel with sound', async () => {
    await playlistCacheNotifications.showErrorNotification(
      new Error('Не удалось скачать 3 из 5'),
      'Плейлист',
    )

    expect(mockedScheduleNotification).toHaveBeenCalledWith(
      {
        body: 'Плейлист: Не удалось скачать 3 из 5',
        sound: true,
        title: ERROR_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      'playlist-cache',
      ALERT_CHANNEL_ID,
    )
  })

  test('showCachingNotification requests permissions first', async () => {
    await playlistCacheNotifications.showCachingNotification('Плейлист')

    expect(requestPermissions).toHaveBeenCalled()
  })

  test('hideCachingNotification hides by fixed ID', async () => {
    await playlistCacheNotifications.hideCachingNotification('any-id')

    expect(hideNotification).toHaveBeenCalledWith(FIXED_NOTIFICATION_ID)
  })
})

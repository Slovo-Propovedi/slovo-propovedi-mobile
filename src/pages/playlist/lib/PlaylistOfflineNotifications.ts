import { debugConfig } from 'shared/config'
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
import { ensurePlaylistNotificationChannels } from './playlistChannelIds'

const NOTIFICATION_GROUP = 'playlist-cache'

const log = debugConfig.enablePlaylistCacheLogs
  ? (...args: unknown[]) => console.warn('[PlaylistOfflineNotifications]', ...args)
  : () => {}

class PlaylistOfflineNotifications {
  public async showCachingNotification(playlistTitle: string): Promise<string> {
    await requestPermissions()
    await ensurePlaylistNotificationChannels()
    return scheduleNotification(
      {
        body: `${playlistTitle}: Добавление в офлайн началось`,
        sound: false,
        title: CACHING_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      SILENT_CHANNEL_ID,
    )
  }

  public async updateCachingNotification(
    _id: string,
    current: number,
    total: number,
    playlistTitle: string,
  ): Promise<string> {
    // Relies on the silent channel already existing: showCachingNotification
    // always runs first (runPlaylistCaching.ts:39) and Android channels persist
    // across restarts.
    return scheduleNotification(
      {
        body: `${playlistTitle}: Добавлено в офлайн ${current} из ${total}`,
        sound: false,
        title: CACHING_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      SILENT_CHANNEL_ID,
    )
  }

  public async showCompletionNotification(total: number, playlistTitle: string): Promise<string> {
    return scheduleNotification(
      {
        body: `${playlistTitle}: Добавлено в офлайн ${total} проповедей`,
        sound: true,
        title: COMPLETION_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      ALERT_CHANNEL_ID,
    )
  }

  public async showErrorNotification(error: Error, playlistTitle: string): Promise<string> {
    log('Error:', { error: error.message, playlistTitle })
    return scheduleNotification(
      {
        body: `${playlistTitle}: ${error.message}`,
        sound: true,
        title: ERROR_TITLE,
      },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      ALERT_CHANNEL_ID,
    )
  }

  public async hideCachingNotification(_id: string): Promise<void> {
    await hideNotification(FIXED_NOTIFICATION_ID)
  }
}

export const playlistOfflineNotifications = new PlaylistOfflineNotifications()

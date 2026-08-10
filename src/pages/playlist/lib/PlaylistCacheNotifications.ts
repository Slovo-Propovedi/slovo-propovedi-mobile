import { debugConfig } from 'shared/config'
import {
  hideNotification,
  requestPermissions,
  scheduleNotification,
} from 'shared/lib/notifications'
import {
  CACHING_TITLE,
  COMPLETION_TITLE,
  ERROR_TITLE,
  FIXED_NOTIFICATION_ID,
} from './notificationConstants'

const NOTIFICATION_GROUP = 'playlist-cache'

const log = debugConfig.enablePlaylistCacheLogs
  ? (...args: unknown[]) => console.warn('[PlaylistCacheNotifications]', ...args)
  : () => {}

class PlaylistCacheNotifications {
  public async showCachingNotification(playlistTitle: string): Promise<string> {
    await requestPermissions()
    return scheduleNotification(
      { body: `${playlistTitle}: Скачивание началось`, title: CACHING_TITLE },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )
  }

  public async updateCachingNotification(
    _id: string,
    current: number,
    total: number,
    playlistTitle: string,
  ): Promise<string> {
    return scheduleNotification(
      { body: `${playlistTitle}: Скачано ${current} из ${total}`, title: CACHING_TITLE },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )
  }

  public async showCompletionNotification(total: number, playlistTitle: string): Promise<string> {
    return scheduleNotification(
      { body: `${playlistTitle}: Скачано ${total} проповедей`, title: COMPLETION_TITLE },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )
  }

  public async showErrorNotification(error: Error, playlistTitle: string): Promise<string> {
    log('Error:', { error: error.message, playlistTitle })
    return scheduleNotification(
      { body: `${playlistTitle}: ${error.message}`, title: ERROR_TITLE },
      FIXED_NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )
  }

  public async hideCachingNotification(_id: string): Promise<void> {
    await hideNotification(FIXED_NOTIFICATION_ID)
  }
}

export const playlistCacheNotifications = new PlaylistCacheNotifications()

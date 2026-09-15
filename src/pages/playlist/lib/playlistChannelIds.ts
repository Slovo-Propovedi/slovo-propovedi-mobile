import { Platform } from 'react-native'
import { ensureNotifications } from 'shared/lib/notifications'
import {
  ALERT_CHANNEL_ID,
  ALERT_CHANNEL_NAME,
  NOTIFICATION_IMPORTANCE_HIGH,
  NOTIFICATION_IMPORTANCE_LOW,
  SILENT_CHANNEL_ID,
  SILENT_CHANNEL_NAME,
} from './notificationConstants'

let channelsPromise: null | Promise<void> = null

/**
 * Creates Android notification channels for playlist caching (once per session).
 * Silent progress channel: no sound during download progress.
 * Alert channel: system default notification sound on completion/error.
 * No-op on non-Android platforms — iOS ignores channels.
 */
export const ensurePlaylistNotificationChannels = (): Promise<void> => {
  if (Platform.OS !== 'android') return Promise.resolve()
  if (channelsPromise) return channelsPromise

  channelsPromise = (async () => {
    const api = await ensureNotifications()
    if (!api) return

    try {
      await api.setNotificationChannelAsync(SILENT_CHANNEL_ID, {
        importance: NOTIFICATION_IMPORTANCE_LOW,
        name: SILENT_CHANNEL_NAME,
        sound: null,
      })
      await api.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
        importance: NOTIFICATION_IMPORTANCE_HIGH,
        name: ALERT_CHANNEL_NAME,
        sound: 'default',
      })
    } catch (error) {
      // Reset so the next notification retries — a failed setup must not be
      // memoized forever (posting to a missing channel falls back to the
      // default channel WITH sound, silently reintroducing Issue #101).
      channelsPromise = null
      console.warn('[notifications] Failed to setup playlist cache channels:', error)
    }
  })()

  return channelsPromise
}

import type { NotificationsApi } from './NotificationsApi'

let notificationsApi: NotificationsApi | null = null
let isInitialized = false

const log = (...args: unknown[]) => console.log('[PlaylistCacheNotifications]', ...args)

export const ensureNotifications = async (): Promise<NotificationsApi | null> => {
  if (notificationsApi && isInitialized) {
    log('Reusing API')
    return notificationsApi
  }
  try {
    log('Importing expo-notifications...')
    const mod = await import('expo-notifications')
    log('Loaded expo-notifications')
    if (!isInitialized) {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      })
      isInitialized = true
      log('Handler configured')
    }
    notificationsApi = mod as unknown as NotificationsApi
    return notificationsApi
  } catch (e) {
    log('Failed to import:', e)
    return null
  }
}

export const scheduleNotification = async (
  content: { body?: string; title: string },
  identifier: string,
): Promise<string> => {
  const api = await ensureNotifications()
  if (!api) {
    log('No API, skipping')
    return ''
  }
  try {
    const id = await api.scheduleNotificationAsync({
      content: { ...content, data: { groupId: 'playlist-cache' }, sound: null },
      identifier,
      trigger: null,
    })
    log('Shown, id:', id)
    return id
  } catch (e) {
    log('Failed:', e)
    return ''
  }
}

export const requestPermissions = async (): Promise<boolean> => {
  const api = await ensureNotifications()
  if (!api) {
    log('No API, skipping permission request')
    return false
  }
  try {
    const { granted } = await api.requestPermissionsAsync({ android: {} })
    log('Permission granted:', granted)
    return granted
  } catch (e) {
    log('Permission request failed:', e)
    return false
  }
}

export const hideNotification = async (): Promise<void> => {
  log('hideCachingNotification')
  const api = await ensureNotifications()
  if (!api) {
    log('No API, skipping hide')
    return
  }
  try {
    await api.cancelScheduledNotificationAsync('playlist-cache-notification')
    log('Hidden:', 'playlist-cache-notification')
  } catch (e) {
    log('Failed hide:', e)
  }
}

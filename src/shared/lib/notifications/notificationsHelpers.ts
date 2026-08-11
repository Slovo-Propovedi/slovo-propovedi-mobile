import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import type { NotificationsApi } from './NotificationsApi'
import { setupUpdateNotificationCategory } from './notificationActions'

let notificationsApi: NotificationsApi | null = null
let isInitialized = false
let initPromise: null | Promise<NotificationsApi | null> = null

export const ensureNotifications = (): Promise<NotificationsApi | null> => {
  if (notificationsApi && isInitialized) return Promise.resolve(notificationsApi)
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const mod = await import('expo-notifications')
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
      }
      void setupUpdateNotificationCategory()
      notificationsApi = mod as unknown as NotificationsApi
      return notificationsApi
    } catch (error) {
      console.error('[notifications] Failed to load expo-notifications:', error)
      return null
    }
  })()

  return initPromise
}

export const scheduleNotification = async (
  content: {
    body?: string
    categoryIdentifier?: string
    data?: Record<string, string>
    title: string
  },
  identifier: string,
  groupId: string,
): Promise<string> => {
  if (isExpoGo) return ''

  const api = await ensureNotifications()
  if (!api) return ''

  try {
    return await api.scheduleNotificationAsync({
      content: { ...content, data: { ...content.data, groupId }, sound: null },
      identifier,
      trigger: null,
    })
  } catch (error) {
    console.warn('[notifications] Failed to schedule notification:', error)
    return ''
  }
}

export const requestPermissions = async (): Promise<boolean> => {
  if (isExpoGo) return false

  const api = await ensureNotifications()
  if (!api) return false

  try {
    const { granted } = await api.requestPermissionsAsync({ android: {} })
    return granted
  } catch (error) {
    console.warn('[notifications] Failed to request permissions:', error)
    return false
  }
}

export const hideNotification = async (identifier: string): Promise<void> => {
  if (isExpoGo) return

  const api = await ensureNotifications()
  if (!api) return

  try {
    await api.cancelScheduledNotificationAsync(identifier)
  } catch (error) {
    console.warn('[notifications] Failed to hide notification:', error)
  }
}

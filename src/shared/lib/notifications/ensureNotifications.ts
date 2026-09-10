import type { NotificationsApi } from './NotificationsApi'
import {
  getMissingNotificationsApiMethods,
  isValidNotificationsApi,
} from './isValidNotificationsApi'

let notificationsModule: NotificationsApi | null = null
let isInitialized = false
let initPromise: null | Promise<NotificationsApi | null> = null

export const ensureNotifications = (): Promise<NotificationsApi | null> => {
  if (notificationsModule && isInitialized) return Promise.resolve(notificationsModule)
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const mod = await import('expo-notifications')

      if (!isValidNotificationsApi(mod)) {
        const missing = getMissingNotificationsApiMethods(mod)
        console.error(
          `[notifications] expo-notifications module shape invalid: missing [${missing.join(', ')}]`,
        )
        return null
      }

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

      notificationsModule = mod
      return notificationsModule
    } catch (error) {
      console.error('[notifications] Failed to load expo-notifications:', error)
      return null
    }
  })()

  return initPromise
}

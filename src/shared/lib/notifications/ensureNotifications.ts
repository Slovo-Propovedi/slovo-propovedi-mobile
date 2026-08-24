import type { NotificationsApi } from './NotificationsApi'

let notificationsModule: NotificationsApi | null = null
let isInitialized = false
let initPromise: null | Promise<NotificationsApi | null> = null

export const ensureNotifications = (): Promise<NotificationsApi | null> => {
  if (notificationsModule && isInitialized) return Promise.resolve(notificationsModule)
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
      notificationsModule = mod as unknown as NotificationsApi
      return notificationsModule
    } catch (error) {
      console.error('[notifications] Failed to load expo-notifications:', error)
      return null
    }
  })()

  return initPromise
}

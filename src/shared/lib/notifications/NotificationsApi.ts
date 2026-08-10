export interface NotificationsApi {
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>
  requestPermissionsAsync: (permissions?: { android?: object }) => Promise<{ granted: boolean }>
  scheduleNotificationAsync: (request: {
    content: { body?: string; data?: Record<string, string>; sound: null; title: string }
    identifier?: string
    trigger: null
  }) => Promise<string>
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldPlaySound: boolean
      shouldSetBadge: boolean
      shouldShowBanner: boolean
      shouldShowList: boolean
    }>
  }) => void
}

export interface NotificationsApi {
  addNotificationResponseReceivedListener: (
    listener: (response: {
      actionIdentifier: string | undefined
      notification: {
        request: {
          content: { data: Record<string, string> }
        }
      }
    }) => void,
  ) => { remove: () => void }
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>
  requestPermissionsAsync: (permissions?: { android?: object }) => Promise<{ granted: boolean }>
  scheduleNotificationAsync: (request: {
    content: {
      body?: string
      categoryIdentifier?: string
      data?: Record<string, string>
      sound: null
      title: string
    }
    identifier?: string
    trigger: null
  }) => Promise<string>
  setNotificationCategoryAsync: (
    identifier: string,
    actions: Array<{
      buttonTitle: string
      identifier: string
      options: { opensAppToForeground?: boolean; showUserInterface?: boolean }
    }>,
  ) => Promise<string>
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      description?: string
      importance: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
      lightColor?: string
      lockscreenVisibility?: number
      name: string
      showBadge?: boolean
      sound?: null | string
      vibrationPattern?: number[]
    },
  ) => Promise<void>
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldPlaySound: boolean
      shouldSetBadge: boolean
      shouldShowBanner: boolean
      shouldShowList: boolean
    }>
  }) => void
}

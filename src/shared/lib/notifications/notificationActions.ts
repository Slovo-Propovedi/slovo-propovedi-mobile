import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import { ensureNotifications } from './ensureNotifications'

export const setupUpdateNotificationCategory = async (): Promise<void> => {
  const api = await ensureNotifications()
  if (!api) return

  try {
    await api.setNotificationCategoryAsync('app-update', [
      {
        buttonTitle: 'Обновить',
        identifier: 'start-in-app-update',
        options: { opensAppToForeground: true, showUserInterface: true },
      },
      {
        buttonTitle: 'Перейти',
        identifier: 'open-release-url',
        options: { opensAppToForeground: true, showUserInterface: true },
      },
    ])
    await api.setNotificationChannelAsync('app-update', {
      importance: 6,
      name: 'Обновления приложения',
    })
  } catch (error) {
    console.warn('[notifications] Failed to setup update category:', error)
  }
}

export const addNotificationResponseListener = (
  callback: (response: {
    actionIdentifier: string | undefined
    notification: {
      request: {
        content: { data: Record<string, string> }
      }
    }
  }) => void,
): (() => void) => {
  let subscription: { remove: () => void } | null = null

  void (async () => {
    if (isExpoGo) return

    const api = await ensureNotifications()
    if (!api) return

    subscription = api.addNotificationResponseReceivedListener(callback)
  })()

  return () => subscription?.remove()
}

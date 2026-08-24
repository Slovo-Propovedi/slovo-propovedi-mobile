import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import { ensureNotifications } from './ensureNotifications'
import { setupUpdateNotificationCategory } from './notificationActions'

let categorySetupPromise: null | Promise<void> = null

/** Registers the update notification category once per session (memoized promise). */
const ensureCategory = (): Promise<void> => {
  if (!categorySetupPromise) categorySetupPromise = setupUpdateNotificationCategory()

  return categorySetupPromise
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
  await ensureCategory()

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

  void ensureCategory()

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
  await ensureCategory()

  try {
    await api.cancelScheduledNotificationAsync(identifier)
  } catch (error) {
    console.warn('[notifications] Failed to hide notification:', error)
  }
}

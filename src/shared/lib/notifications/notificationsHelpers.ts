import { Platform } from 'react-native'
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
    sound?: boolean | null | string
    title: string
  },
  identifier: string,
  groupId: string,
  channelId?: string,
): Promise<string> => {
  if (isExpoGo) return ''

  const api = await ensureNotifications()
  if (!api) return ''
  await ensureCategory()

  try {
    const trigger =
      Platform.OS === 'android' && channelId ? { channelId, type: 'channel' as const } : null
    return await api.scheduleNotificationAsync({
      content: { ...content, data: { ...content.data, groupId }, sound: content.sound ?? null },
      identifier,
      trigger,
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

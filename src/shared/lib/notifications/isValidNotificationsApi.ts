import type { NotificationsApi } from './NotificationsApi'

/** Validates that all 7 methods used by this module are present as functions. */
const REQUIRED_METHODS = [
  'addNotificationResponseReceivedListener',
  'cancelScheduledNotificationAsync',
  'requestPermissionsAsync',
  'scheduleNotificationAsync',
  'setNotificationCategoryAsync',
  'setNotificationChannelAsync',
  'setNotificationHandler',
] as const

export const getMissingNotificationsApiMethods = (mod: unknown): string[] => {
  if (typeof mod !== 'object' || mod === null) return [...REQUIRED_METHODS]

  return REQUIRED_METHODS.filter(method => {
    const descriptor = Object.getOwnPropertyDescriptor(mod, method)
    return typeof descriptor?.value !== 'function'
  })
}

export const isValidNotificationsApi = (mod: unknown): mod is NotificationsApi =>
  getMissingNotificationsApiMethods(mod).length === 0

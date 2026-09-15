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

  // Reflect.get triggers getters and walks the prototype chain — the same access
  // semantics as the calling code (mod.setNotificationHandler(...)), unlike
  // Object.getOwnPropertyDescriptor which misses Metro's ESM getter exports.
  return REQUIRED_METHODS.filter(method => typeof Reflect.get(mod, method) !== 'function')
}

export const isValidNotificationsApi = (mod: unknown): mod is NotificationsApi =>
  getMissingNotificationsApiMethods(mod).length === 0

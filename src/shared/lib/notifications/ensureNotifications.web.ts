import type { NotificationsApi } from './NotificationsApi'

/**
 * Web has no usable `expo-notifications` (no push tokens, no scheduled local
 * notifications — it only logs "not supported" warnings). Resolve to `null` so
 * every caller no-ops, and keep the package out of the web bundle entirely —
 * this also removes the one dynamic `import()` that Metro's lazy web dev
 * bundling chokes on.
 */
export const ensureNotifications = (): Promise<NotificationsApi | null> => Promise.resolve(null)

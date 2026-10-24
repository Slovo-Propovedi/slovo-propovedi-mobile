// expo-updates is native-only, so it is loaded lazily: web builds must never
// evaluate it (see the Platform.OS guard in checkForUpdateAction — the PWA
// updates itself through the service worker). Kept as a one-line seam so tests
// can substitute the import outcome: Jest's CommonJS VM cannot intercept a
// native dynamic import() (same limitation as ensureNotifications).
// The return type lists only the members the update gate consumes.
export const loadExpoUpdates = (): Promise<{
  checkForUpdateAsync: () => Promise<{ isAvailable: boolean }>
  isEmbeddedLaunch: boolean
  manifest: unknown
}> => import('expo-updates')

import { APP_VERSION } from '../config/version'
import { loadExpoUpdates } from './loadExpoUpdates'
import { getRunningManifestVersion, resolveEffectiveAppVersion } from './updateOtaGate'

// expo-updates is native-only, so it is imported lazily through
// loadExpoUpdates: web builds must never evaluate it (see the Platform.OS guard
// in checkForUpdateAction — the PWA updates itself through the service worker).
// A failed import (Expo Go, web bundle) falls back to the baked version, i.e.
// the pre-OTA behavior.
export const readRunningAppVersion = async (): Promise<string> => {
  try {
    const { isEmbeddedLaunch, manifest } = await loadExpoUpdates()

    return resolveEffectiveAppVersion({
      appVersion: APP_VERSION,
      isEmbeddedLaunch,
      manifestVersion: getRunningManifestVersion(manifest),
    })
  } catch (error) {
    console.warn('[update] expo-updates unavailable, using APP_VERSION:', error)
    return APP_VERSION
  }
}

// Whether the OTA server already has a bundle for THIS build's runtimeVersion.
// Asked only on the rare newer-release path: checkForUpdateAsync performs its own
// manifest request (the same one expo-updates already runs on launch). Any
// failure counts as "no OTA" — the APK dialog is the safe fallback.
export const isOtaUpdateAvailable = async (): Promise<boolean> => {
  try {
    const { checkForUpdateAsync } = await loadExpoUpdates()
    const { isAvailable } = await checkForUpdateAsync()

    return isAvailable
  } catch (error) {
    console.warn('[update] OTA check failed, falling back to the APK dialog:', error)
    return false
  }
}

import { compareVersions } from '../lib/version-check/compareVersions'

// Version published in the running expo-updates manifest (extra.expoClient.version).
// The manifest is external data (embedded and remote variants differ), so every
// level is parsed at runtime; anything unexpected counts as "no version".
export const getRunningManifestVersion = (manifest: unknown): null | string => {
  if (!manifest || typeof manifest !== 'object') return null
  if (!('extra' in manifest)) return null

  const { extra } = manifest
  if (!extra || typeof extra !== 'object') return null
  if (!('expoClient' in extra)) return null

  const { expoClient } = extra
  if (!expoClient || typeof expoClient !== 'object') return null
  if (!('version' in expoClient)) return null

  const { version } = expoClient
  return typeof version === 'string' ? version : null
}

// Version of the code that is actually running: an embedded launch runs the bundle
// baked into the APK, an OTA launch runs the bundle from its manifest. Falling back
// to the baked version keeps the check working on launches without a manifest.
export const resolveEffectiveAppVersion = ({
  appVersion,
  isEmbeddedLaunch,
  manifestVersion,
}: {
  appVersion: string
  isEmbeddedLaunch: boolean
  manifestVersion: null | string
}): string => {
  if (isEmbeddedLaunch) return appVersion
  if (!manifestVersion) return appVersion

  return manifestVersion
}

// True when the published release is newer than the code that is actually running.
// Comparing against the effective version stops the APK dialog from nagging users
// whose running OTA bundle already contains the fix.
export const isReleaseNewerThanRunning = (
  releaseVersion: string,
  runningVersion: string,
): boolean => compareVersions(releaseVersion, runningVersion) === 1

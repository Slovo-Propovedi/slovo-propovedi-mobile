import fs from 'fs'
import path from 'path'
import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins'

const APP_BUILD_GRADLE_RELATIVE_PATH = path.join('app', 'build.gradle')

// Verbatim markers unique to this plugin's injected output. The guards must
// detect our own previously-injected lines, not generic Gradle vocabulary that
// a future Expo template could legitimately contain.
const RELEASE_STORE_ENV_MARKER = 'def releaseStoreFile = System.getenv("RELEASE_STORE_FILE")'
const RELEASE_BUILD_TYPE_MARKER =
  'signingConfig releaseStoreFile ? signingConfigs.release : signingConfigs.debug'

const SIGNING_CONFIGS_ANCHOR = '    signingConfigs {'
const DEBUG_SIGNING_LINE = '            signingConfig signingConfigs.debug'
const RELEASE_BUILD_TYPE_SIGNING_LINE =
  '            signingConfig releaseStoreFile ? signingConfigs.release : signingConfigs.debug'

const RELEASE_STORE_DECLARATION = `    ${RELEASE_STORE_ENV_MARKER}`

const RELEASE_SIGNING_CONFIG_BLOCK = `        release {
            if (releaseStoreFile) {
                storeFile file(releaseStoreFile)
                storePassword System.getenv("RELEASE_STORE_PASSWORD")
                keyAlias System.getenv("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("RELEASE_KEY_PASSWORD")
            }
        }`

// Fails loudly when the generated Gradle file drifts from the template shape this
// plugin patches, instead of silently emitting an unsigned or debug-signed release.
const requireAnchor = (contents: string, anchor: string): void => {
  if (!contents.includes(anchor))
    throw new Error(`withReleaseSigning: anchor not found in android/app/build.gradle: ${anchor}`)
}

// The env is read at Gradle *configuration* time, so RELEASE_STORE_FILE unset (or
// empty) leaves the release signingConfig empty and the release buildType falls
// back to the debug key. Debug builds are untouched.
const applyReleaseSigningConfig = (contents: string): string => {
  if (contents.includes(RELEASE_STORE_ENV_MARKER)) return contents

  requireAnchor(contents, SIGNING_CONFIGS_ANCHOR)

  return contents.replace(
    SIGNING_CONFIGS_ANCHOR,
    `${RELEASE_STORE_DECLARATION}\n${SIGNING_CONFIGS_ANCHOR}\n${RELEASE_SIGNING_CONFIG_BLOCK}`,
  )
}

const applyReleaseBuildTypeSigning = (contents: string): string => {
  if (contents.includes(RELEASE_BUILD_TYPE_MARKER)) return contents

  // Two occurrences must exist: the debug buildType and the release buildType, in
  // that order. The last one belongs to release. Any other count means the
  // generated Gradle drifted from the template this plugin patches.
  const occurrences = contents.split(DEBUG_SIGNING_LINE).length - 1
  if (occurrences !== 2)
    throw new Error(
      `withReleaseSigning: expected exactly 2 "${DEBUG_SIGNING_LINE.trim()}" lines in android/app/build.gradle (debug + release buildTypes), found ${occurrences}`,
    )

  const releaseSigningIndex = contents.lastIndexOf(DEBUG_SIGNING_LINE)

  return (
    contents.slice(0, releaseSigningIndex) +
    RELEASE_BUILD_TYPE_SIGNING_LINE +
    contents.slice(releaseSigningIndex + DEBUG_SIGNING_LINE.length)
  )
}

const applyReleaseSigning = (contents: string): string =>
  applyReleaseBuildTypeSigning(applyReleaseSigningConfig(contents))

// Makes release builds signable with a real keystore supplied via environment
// variables at Gradle configuration time (RELEASE_STORE_FILE / RELEASE_STORE_PASSWORD /
// RELEASE_KEY_ALIAS / RELEASE_KEY_PASSWORD). When RELEASE_STORE_FILE is absent the
// release buildType keeps signing with the canonical debug key, so local builds and
// CI without the release secret stay green. Runs as a dangerous mod (first, before
// the appBuildGradle provider writes the file) and is idempotent: it only writes
// when the generated content actually changes.
export const withReleaseSigning: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const { platformProjectRoot } = dangerousConfig.modRequest
      const buildGradlePath = path.join(platformProjectRoot, APP_BUILD_GRADLE_RELATIVE_PATH)

      if (!fs.existsSync(buildGradlePath))
        throw new Error(`withReleaseSigning: generated ${buildGradlePath} not found`)

      const original = fs.readFileSync(buildGradlePath, 'utf8')
      const patched = applyReleaseSigning(original)

      if (patched === original) return dangerousConfig

      fs.writeFileSync(buildGradlePath, patched)

      return dangerousConfig
    },
  ])

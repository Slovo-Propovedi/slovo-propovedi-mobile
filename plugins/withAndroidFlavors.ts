import fs from 'fs'
import path from 'path'
import { type ConfigPlugin, withAppBuildGradle, withDangerousMod } from '@expo/config-plugins'
import {
  ANDROID_RESOURCES_BLOCK,
  APP_FLAVORS_BLOCK,
  APP_LINT_BLOCK,
  DEBUGGABLE_VARIANTS_ACTIVE,
  DEBUGGABLE_VARIANTS_COMMENTED,
  DEV_APP_NAME_STRINGS,
  DEV_FLAVOR_MANIFEST,
  LEGACY_PACKAGING_ANCHOR,
  PACKAGING_OPTIONS_ANCHOR,
  PROD_APP_NAME_STRINGS,
  PROD_FLAVOR_MANIFEST,
  WORKLETS_PICK_FIRSTS_BLOCK,
} from './gradleSnippets.ts'

const UNCOMMENTED_DEBUGGABLE_VARIANTS = /^\s*debuggableVariants\s*=\s*\[/m

// Verbatim markers unique to this plugin's injected output. The guards must
// detect our own previously-injected blocks, not generic Gradle vocabulary that
// a future Expo template could legitimately contain.
const APP_FLAVORS_MARKER = 'applicationIdSuffix ".dev"'
const APP_LINT_MARKER = 'checkReleaseBuilds = false'
const WORKLETS_PICK_FIRSTS_MARKER = 'lib/arm64-v8a/libworklets.so'

const APP_NAME_PATH = 'res/values/strings.xml'
const MANIFEST_PATH = 'AndroidManifest.xml'

const insertBefore = (contents: string, anchor: string, block: string): string => {
  if (!contents.includes(anchor))
    throw new Error(`withAndroidFlavors: anchor not found in generated Gradle file: ${anchor}`)

  return contents.replace(anchor, `${block}${anchor}`)
}

const insertAfter = (contents: string, anchor: string, block: string): string => {
  if (!contents.includes(anchor))
    throw new Error(`withAndroidFlavors: anchor not found in generated Gradle file: ${anchor}`)

  return contents.replace(anchor, `${anchor}\n${block}`)
}

const applyDebuggableVariants = (contents: string): string => {
  if (UNCOMMENTED_DEBUGGABLE_VARIANTS.test(contents)) return contents
  if (!contents.includes(DEBUGGABLE_VARIANTS_COMMENTED))
    throw new Error(
      'withAndroidFlavors: debuggableVariants template line not found in android/app/build.gradle',
    )

  return contents.replace(DEBUGGABLE_VARIANTS_COMMENTED, DEBUGGABLE_VARIANTS_ACTIVE)
}

const applyAppFlavors = (contents: string): string => {
  const withFlavors = contents.includes(APP_FLAVORS_MARKER)
    ? contents
    : insertBefore(contents, PACKAGING_OPTIONS_ANCHOR, APP_FLAVORS_BLOCK)

  return withFlavors.includes(APP_LINT_MARKER)
    ? withFlavors
    : insertAfter(withFlavors, ANDROID_RESOURCES_BLOCK, APP_LINT_BLOCK)
}

const applyWorkletsPickFirsts = (contents: string): string => {
  if (contents.includes(WORKLETS_PICK_FIRSTS_MARKER)) return contents
  return insertAfter(contents, LEGACY_PACKAGING_ANCHOR, WORKLETS_PICK_FIRSTS_BLOCK)
}

const withFlavoredAppBuildGradle: ConfigPlugin = config =>
  withAppBuildGradle(config, gradleConfig => {
    gradleConfig.modResults.contents = [
      applyDebuggableVariants,
      applyAppFlavors,
      applyWorkletsPickFirsts,
    ].reduce((contents, apply) => apply(contents), gradleConfig.modResults.contents)

    return gradleConfig
  })

const writeFlavorSourceSetFile = (
  projectRoot: string,
  flavor: string,
  relativePath: string,
  content: string,
): void => {
  const filePath = path.join(projectRoot, 'app', 'src', flavor, relativePath)
  const existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''

  if (existingContent === content) return

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

const withFlavorAppNames: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const { platformProjectRoot } = dangerousConfig.modRequest

      writeFlavorSourceSetFile(platformProjectRoot, 'dev', APP_NAME_PATH, DEV_APP_NAME_STRINGS)
      writeFlavorSourceSetFile(platformProjectRoot, 'prod', APP_NAME_PATH, PROD_APP_NAME_STRINGS)

      return dangerousConfig
    },
  ])

// Dev and prod used to share the one scheme Expo generated from app.config
// `scheme`. Main now carries `slovo-propovedi-dev` (via withDevClientScheme);
// per-flavor VIEW schemes stay separate so parallel installs stay unambiguous.
const withFlavorSchemes: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const { platformProjectRoot } = dangerousConfig.modRequest

      writeFlavorSourceSetFile(platformProjectRoot, 'dev', MANIFEST_PATH, DEV_FLAVOR_MANIFEST)
      writeFlavorSourceSetFile(platformProjectRoot, 'prod', MANIFEST_PATH, PROD_FLAVOR_MANIFEST)

      return dangerousConfig
    },
  ])

// Adds the dev/prod product flavors, per-flavor application names, per-flavor
// custom URL schemes and the worklets pickFirsts that local + CI Android builds
// rely on. Runs during `expo prebuild` so a wiped android/ directory is restored
// automatically.
export const withAndroidFlavors: ConfigPlugin = config =>
  withFlavorSchemes(withFlavorAppNames(withFlavoredAppBuildGradle(config)))

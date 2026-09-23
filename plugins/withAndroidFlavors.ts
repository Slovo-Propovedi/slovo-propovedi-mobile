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
  LEGACY_PACKAGING_ANCHOR,
  PACKAGING_OPTIONS_ANCHOR,
  PROD_APP_NAME_STRINGS,
  WORKLETS_PICK_FIRSTS_BLOCK,
} from './gradleSnippets.ts'

const UNCOMMENTED_DEBUGGABLE_VARIANTS = /^\s*debuggableVariants\s*=\s*\[/m

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
  const withFlavors = contents.includes('productFlavors')
    ? contents
    : insertBefore(contents, PACKAGING_OPTIONS_ANCHOR, APP_FLAVORS_BLOCK)

  return withFlavors.includes('checkReleaseBuilds')
    ? withFlavors
    : insertAfter(withFlavors, ANDROID_RESOURCES_BLOCK, APP_LINT_BLOCK)
}

const applyWorkletsPickFirsts = (contents: string): string => {
  if (contents.includes('libworklets')) return contents
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

const writeFlavorAppName = (projectRoot: string, flavor: string, xml: string): void => {
  const filePath = path.join(projectRoot, 'app', 'src', flavor, 'res', 'values', 'strings.xml')
  const existingContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''

  if (existingContent === xml) return

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, xml)
}

const withFlavorAppNames: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const { platformProjectRoot } = dangerousConfig.modRequest

      writeFlavorAppName(platformProjectRoot, 'dev', DEV_APP_NAME_STRINGS)
      writeFlavorAppName(platformProjectRoot, 'prod', PROD_APP_NAME_STRINGS)

      return dangerousConfig
    },
  ])

// Adds the dev/prod product flavors, per-flavor application names and the
// worklets pickFirsts that local + CI Android builds rely on. Runs during
// `expo prebuild` so a wiped android/ directory is restored automatically.
export const withAndroidFlavors: ConfigPlugin = config =>
  withFlavorAppNames(withFlavoredAppBuildGradle(config))

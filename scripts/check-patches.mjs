#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PATCHES_DIR = 'patches'
const EXPO_AUDIO = 'expo-audio'
const EXPO_AUDIO_MODULE_PATH =
  'node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioModule.kt'
const EXPO_AUDIO_SEEK_INTERVAL_PATH =
  'node_modules/expo-audio/android/src/main/java/expo/modules/audio/service/SeekInterval.kt'
const EXPO_INTENT_LAUNCHER_MODULE_PATH =
  'node_modules/expo-intent-launcher/android/src/main/java/expo/modules/intentlauncher/IntentLauncherModule.kt'
const PACKAGE_JSON_PATH = 'package.json'
const PATCH_MARKER = 'PATCH(patch-package)'
const LOOP_PROPERTY = 'Property("loop")'
const SEEK_INTERVAL_HARDENING_SIGNATURE = 'it > 0.0'

// Per-package probes for the tri-state check. `fixSignature` is the upstream
// equivalent of the patched code: seeing it without the marker means the
// package fixed the issue itself and the patch must be deleted.
const PATCH_PROBES = {
  'expo-audio': {
    files: [EXPO_AUDIO_MODULE_PATH],
  },
  'expo-font': {
    files: ['node_modules/expo-font/build/FontLoader.web.js'],
    fixSignature: 'ExpoFontLoader.loadAsync(name, input).catch',
  },
  'expo-intent-launcher': {
    files: [EXPO_INTENT_LAUNCHER_MODULE_PATH],
    requiresSourceBuild: true,
  },
  'react-native-gesture-handler': {
    files: [
      'node_modules/react-native-gesture-handler/src/web/tools/PointerEventManager.ts',
      'node_modules/react-native-gesture-handler/lib/module/web/tools/PointerEventManager.js',
    ],
    fixSignature: 'catch',
  },
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

const fail = message => {
  console.error(`${RED}✗ ${message}${RESET}`)
  process.exit(1)
}

// patch-package encodes scoped package names as "@scope+name+version.patch",
// so split on the last "+" and turn the scope separator back into "/".
export const parsePatchFileName = fileName => {
  const base = fileName.slice(0, -'.patch'.length)
  const lastPlus = base.lastIndexOf('+')

  if (lastPlus === -1) {
    throw new Error(`Cannot parse "${fileName}" (expected "<package>+<version>.patch")`)
  }

  const rawName = base.slice(0, lastPlus)
  const version = base.slice(lastPlus + 1)
  const packageName = rawName.startsWith('@') ? rawName.replace('+', '/') : rawName

  return { packageName, version }
}

const readInstalledVersion = packageName => {
  const manifestPath = join('node_modules', packageName, 'package.json')

  if (!existsSync(manifestPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8')).version
  } catch {
    return null
  }
}

const sliceBetween = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + 1)

  if (start === -1 || end === -1) {
    return null
  }

  return source.slice(start, end)
}

const findLoopGetter = source => {
  const markerIndex = source.indexOf(PATCH_MARKER)
  const loopIndex =
    markerIndex === -1
      ? source.lastIndexOf(LOOP_PROPERTY)
      : source.indexOf(LOOP_PROPERTY, markerIndex)

  return loopIndex === -1 ? null : sliceBetween(source.slice(loopIndex), LOOP_PROPERTY, '.set')
}

const readFileOrNull = path => {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return null
  }
}

const readJsonOrNull = path => {
  try {
    return JSON.parse(readFileOrNull(path))
  } catch {
    return null
  }
}

export const collectFileProblems = ({ filePath, source, fixSignature }) => {
  if (!source) {
    return [`${filePath}: target not found — package layout changed, review the patch`]
  }

  if (source.includes(PATCH_MARKER)) {
    return []
  }

  if (fixSignature && source.includes(fixSignature)) {
    return [
      `${filePath}: upstream fix detected without a patch marker — delete the patch if it covers this`,
    ]
  }

  return [
    `${filePath}: patch signature missing — patch did not apply (reinstall or re-create)`,
  ]
}

const collectSeekIntervalProblems = seekIntervalSource => {
  if (!seekIntervalSource) {
    return ['expo-audio SeekInterval.kt not found — cannot verify the seek-interval patch']
  }

  const problems = []

  if (!seekIntervalSource.includes(PATCH_MARKER)) {
    problems.push('patch marker PATCH(patch-package) missing in SeekInterval.kt')
  }

  if (!seekIntervalSource.includes(SEEK_INTERVAL_HARDENING_SIGNATURE)) {
    problems.push(
      'seekIntervalMs does not fall back to the default on non-positive input — ' +
        'the patch did not apply',
    )
  }

  return problems
}

/**
 * A node_modules patch only reaches the APK when the package is built from
 * source; otherwise autolinking pulls the prebuilt AAR and the patch is inert.
 */
const collectSourceBuildProblems = ({ packageJson, packageName }) => {
  if (!packageJson) {
    return ['cannot read package.json — cannot verify the source-build invariant']
  }

  const buildFromSource = packageJson.expo?.autolinking?.buildFromSource

  if (!Array.isArray(buildFromSource) || !buildFromSource.includes(packageName)) {
    return [
      `${packageName} is not in expo.autolinking.buildFromSource — the patch is inert (prebuilt AAR)`,
    ]
  }

  return []
}

export const collectExpoAudioProblems = ({ audioModuleSource, seekIntervalSource, packageJson }) => {
  if (!audioModuleSource) {
    return ['expo-audio AudioModule.kt not found — cannot verify the loop-getter patch']
  }

  const problems = []

  if (!audioModuleSource.includes(PATCH_MARKER)) {
    problems.push('patch marker PATCH(patch-package) missing in AudioModule.kt')
  }

  // AudioModule.kt has two "loop" properties; anchor to the patched AudioPlaylist one
  // when the marker is present so the earlier player getter cannot mask a regression.
  const loopGetter = findLoopGetter(audioModuleSource)

  if (!loopGetter?.includes('runOnMain')) {
    problems.push('Property("loop") getter is not wrapped in runOnMain — the patch did not apply')
  }

  problems.push(...collectSeekIntervalProblems(seekIntervalSource))
  problems.push(...collectSourceBuildProblems({ packageJson, packageName: EXPO_AUDIO }))

  return problems
}

export const verifyPatch = file => {
  let parsed

  try {
    parsed = parsePatchFileName(file)
  } catch (error) {
    return [error.message]
  }

  const { packageName, version: patchVersion } = parsed
  const installedVersion = readInstalledVersion(packageName)

  if (!installedVersion) {
    return [
      `package ${packageName} not installed or unreadable; patch ${file} is stale — ` +
        `reinstall deps or remove the patch`,
    ]
  }

  if (installedVersion !== patchVersion) {
    return [
      `Patch ${file} targets ${patchVersion} but ${installedVersion} is installed. ` +
        `If upstream fixed the issue, delete the patch and run: yarn patch-package ${packageName}  ` +
        `(recreate only if still needed). See docs/debt.md.`,
    ]
  }

  const probe = PATCH_PROBES[packageName]
  const probeProblems = probe
    ? probe.files.flatMap(filePath =>
        collectFileProblems({
          filePath,
          source: readFileOrNull(filePath),
          fixSignature: probe.fixSignature,
        }),
      )
    : []

  if (probe?.requiresSourceBuild) {
    probeProblems.push(
      ...collectSourceBuildProblems({
        packageJson: readJsonOrNull(PACKAGE_JSON_PATH),
        packageName,
      }),
    )
  }

  if (packageName !== EXPO_AUDIO) {
    return probeProblems
  }

  return collectExpoAudioProblems({
    audioModuleSource: readFileOrNull(EXPO_AUDIO_MODULE_PATH),
    seekIntervalSource: readFileOrNull(EXPO_AUDIO_SEEK_INTERVAL_PATH),
    packageJson: readJsonOrNull(PACKAGE_JSON_PATH),
  }).map(problem => `${file}: ${problem}`)
}

const main = () => {
  if (!existsSync(PATCHES_DIR)) {
    fail(`patches directory "${PATCHES_DIR}" not found`)
  }

  const patchFiles = readdirSync(PATCHES_DIR)
    .filter(name => name.endsWith('.patch'))
    .sort()
  const errors = patchFiles.flatMap(verifyPatch)

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`${RED}✗ ${error}${RESET}`)
    }
    process.exit(1)
  }

  console.log(`${GREEN}✓ patches OK (${patchFiles.length} patch(es) verified)${RESET}`)
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isMain) {
  main()
}

#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PATCHES_DIR = 'patches'
const EXPO_AUDIO = 'expo-audio'
const EXPO_AUDIO_MODULE_PATH =
  'node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioModule.kt'
const PATCH_MARKER = 'PATCH(patch-package)'

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

const fail = message => {
  console.error(`${RED}✗ ${message}${RESET}`)
  process.exit(1)
}

// patch-package encodes scoped package names as "@scope+name+version.patch",
// so split on the last "+" and turn the scope separator back into "/".
const parsePatchFileName = fileName => {
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

  return JSON.parse(readFileSync(manifestPath, 'utf-8')).version
}

const sliceBetween = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return source.slice(start, end)
}

const collectExpoAudioProblems = source => {
  const problems = []
  const markerCount = source.split(PATCH_MARKER).length - 1

  if (markerCount < 2) {
    problems.push(`expected at least 2 "${PATCH_MARKER}" markers, found ${markerCount}`)
  }

  if (!source.includes('setUsage(AudioAttributes.USAGE_MEDIA)')) {
    problems.push('missing setUsage(AudioAttributes.USAGE_MEDIA)')
  }

  const shouldReleaseFocus = sliceBetween(
    source,
    'private fun shouldReleaseFocus',
    'private fun shouldPlayInSilentMode'
  )
  if (!shouldReleaseFocus?.includes('Player.STATE_BUFFERING')) {
    problems.push('shouldReleaseFocus() does not keep focus on Player.STATE_BUFFERING')
  }

  const requestAudioFocus = sliceBetween(
    source,
    'private fun requestAudioFocus',
    'private fun releaseAudioFocus'
  )
  if (!requestAudioFocus) {
    problems.push('requestAudioFocus() body not found')
    return problems
  }

  // A bare AUDIOFOCUS_GAIN_TRANSIENT (not the _MAY_DUCK variant, which is still
  // used for MIX_WITH_OTHERS paths) means the DO_NOT_MIX override was lost.
  if (!/AudioManager\.AUDIOFOCUS_GAIN\s*$/m.test(requestAudioFocus)) {
    problems.push('requestAudioFocus() missing permanent AudioManager.AUDIOFOCUS_GAIN')
  }
  if (/AUDIOFOCUS_GAIN_TRANSIENT(?!_MAY_DUCK)/.test(requestAudioFocus)) {
    problems.push('requestAudioFocus() still uses bare AUDIOFOCUS_GAIN_TRANSIENT for DO_NOT_MIX')
  }

  return problems
}

const verifyPatch = file => {
  let parsed

  try {
    parsed = parsePatchFileName(file)
  } catch (error) {
    return [error.message]
  }

  const { packageName, version: patchVersion } = parsed
  const installedVersion = readInstalledVersion(packageName)

  if (!installedVersion) {
    return [`package ${packageName} not installed; patch ${file} is stale — remove it or reinstall`]
  }

  if (installedVersion !== patchVersion) {
    return [
      `Patch ${file} targets ${patchVersion} but ${installedVersion} is installed. ` +
        `If upstream fixed the issue, delete the patch and run: yarn patch-package ${packageName}  ` +
        `(recreate only if still needed). See docs/debt.md.`,
    ]
  }

  if (packageName !== EXPO_AUDIO) {
    return []
  }

  if (!existsSync(EXPO_AUDIO_MODULE_PATH)) {
    return [`${EXPO_AUDIO_MODULE_PATH} not found — cannot verify ${file}`]
  }

  return collectExpoAudioProblems(readFileSync(EXPO_AUDIO_MODULE_PATH, 'utf-8')).map(
    problem => `${file}: ${problem}`
  )
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

main()

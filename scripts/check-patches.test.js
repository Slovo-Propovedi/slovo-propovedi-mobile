import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from '@jest/globals'

const REPO_ROOT = resolve(__dirname, '..')
const PATCH_FILE = resolve(REPO_ROOT, 'patches/expo-audio+57.0.5.patch')
const PATCH_PACKAGE_VERSION = '57.0.5'
const PATCH_MARKER = 'PATCH(patch-package)'
const AUDIO_MODULE_PATH = resolve(
  REPO_ROOT,
  'node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioModule.kt',
)
const EXPO_AUDIO_MANIFEST = resolve(REPO_ROOT, 'node_modules/expo-audio/package.json')

const sliceBetween = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)

  if (start === -1 || end === -1 || end <= start) return null

  return source.slice(start, end)
}

describe('expo-audio audio-focus patch', () => {
  test('patch file exists', () => {
    expect(existsSync(PATCH_FILE)).toBe(true)
  })

  test('installed expo-audio version matches the patch file name', () => {
    const manifest = JSON.parse(readFileSync(EXPO_AUDIO_MANIFEST, 'utf-8'))

    expect(manifest.version).toBe(PATCH_PACKAGE_VERSION)
  })

  test('AudioModule.kt keeps focus while buffering and uses permanent focus attributes', () => {
    const source = readFileSync(AUDIO_MODULE_PATH, 'utf-8')
    const markerCount = source.split(PATCH_MARKER).length - 1

    expect(markerCount).toBeGreaterThanOrEqual(2)
    expect(source).toContain('setUsage(AudioAttributes.USAGE_MEDIA)')

    const shouldReleaseFocus = sliceBetween(
      source,
      'private fun shouldReleaseFocus',
      'private fun shouldPlayInSilentMode',
    )

    expect(shouldReleaseFocus).toContain('Player.STATE_BUFFERING')
  })

  test('requestAudioFocus no longer uses bare AUDIOFOCUS_GAIN_TRANSIENT for DO_NOT_MIX', () => {
    const source = readFileSync(AUDIO_MODULE_PATH, 'utf-8')
    const requestAudioFocus = sliceBetween(
      source,
      'private fun requestAudioFocus',
      'private fun releaseAudioFocus',
    )

    expect(requestAudioFocus).not.toBeNull()
    expect(requestAudioFocus).toMatch(/AudioManager\.AUDIOFOCUS_GAIN\s*$/m)
    expect(requestAudioFocus).not.toMatch(/AUDIOFOCUS_GAIN_TRANSIENT(?!_MAY_DUCK)/)
  })
})

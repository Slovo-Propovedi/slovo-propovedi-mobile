import {
  decideUpdatePrompt,
  getRunningManifestVersion,
  isReleaseNewerThanRunning,
  resolveEffectiveAppVersion,
} from './updateOtaGate'

const BAKED_VERSION = '0.29.0'
const RELEASE_VERSION = '0.30.0'

// Mirrors the production composition in checkForUpdateAction: the release is
// compared against the version of the code that is actually running.
const isGateOpen = (input: {
  isEmbeddedLaunch: boolean
  manifestVersion: null | string
  releaseVersion?: string
}): boolean =>
  isReleaseNewerThanRunning(
    input.releaseVersion ?? RELEASE_VERSION,
    resolveEffectiveAppVersion({
      appVersion: BAKED_VERSION,
      isEmbeddedLaunch: input.isEmbeddedLaunch,
      manifestVersion: input.manifestVersion,
    }),
  )

describe('resolveEffectiveAppVersion', () => {
  test('uses the baked version on an embedded launch', () => {
    const version = resolveEffectiveAppVersion({
      appVersion: BAKED_VERSION,
      isEmbeddedLaunch: true,
      manifestVersion: '0.31.0',
    })

    expect(version).toBe(BAKED_VERSION)
  })

  test('uses the manifest version on an OTA launch', () => {
    const version = resolveEffectiveAppVersion({
      appVersion: BAKED_VERSION,
      isEmbeddedLaunch: false,
      manifestVersion: '0.30.0',
    })

    expect(version).toBe('0.30.0')
  })

  test('falls back to the baked version when the manifest has no version', () => {
    const version = resolveEffectiveAppVersion({
      appVersion: BAKED_VERSION,
      isEmbeddedLaunch: false,
      manifestVersion: null,
    })

    expect(version).toBe(BAKED_VERSION)
  })
})

describe('getRunningManifestVersion', () => {
  test('reads extra.expoClient.version', () => {
    expect(getRunningManifestVersion({ extra: { expoClient: { version: '0.30.0' } } })).toBe(
      '0.30.0',
    )
  })

  test('returns null for a missing manifest', () => {
    expect(getRunningManifestVersion(null)).toBeNull()
  })

  test('returns null when the manifest has no extra (embedded manifest)', () => {
    expect(getRunningManifestVersion({})).toBeNull()
  })

  test('returns null when extra has no expoClient config', () => {
    expect(getRunningManifestVersion({ extra: {} })).toBeNull()
  })

  test('treats a non-string version as absent', () => {
    expect(getRunningManifestVersion({ extra: { expoClient: { version: 42 } } })).toBeNull()
  })

  test('returns null when expoClient is null', () => {
    expect(getRunningManifestVersion({ extra: { expoClient: null } })).toBeNull()
  })

  test('returns null when extra is an array', () => {
    expect(getRunningManifestVersion({ extra: [] })).toBeNull()
  })
})

describe('OTA-aware update gate', () => {
  test('opens for an embedded launch when the release is newer than the baked version', () => {
    expect(isGateOpen({ isEmbeddedLaunch: true, manifestVersion: null })).toBe(true)
  })

  test('stays closed when the running OTA bundle already equals the release', () => {
    expect(
      isGateOpen({
        isEmbeddedLaunch: false,
        manifestVersion: RELEASE_VERSION,
        releaseVersion: RELEASE_VERSION,
      }),
    ).toBe(false)
  })

  test('opens when the running OTA bundle is older than the release', () => {
    expect(isGateOpen({ isEmbeddedLaunch: false, manifestVersion: '0.29.5' })).toBe(true)
  })

  test('stays closed when the running OTA bundle is newer than the release', () => {
    expect(isGateOpen({ isEmbeddedLaunch: false, manifestVersion: '0.31.0' })).toBe(false)
  })

  test('falls back to the baked version when the running manifest has no version', () => {
    expect(isGateOpen({ isEmbeddedLaunch: false, manifestVersion: null })).toBe(true)
    expect(
      isGateOpen({
        isEmbeddedLaunch: false,
        manifestVersion: null,
        releaseVersion: BAKED_VERSION,
      }),
    ).toBe(false)
  })

  test('falls back to the baked version for malformed manifest shapes', () => {
    for (const manifest of [{ extra: { expoClient: null } }, { extra: [] }]) {
      const manifestVersion = getRunningManifestVersion(manifest)

      expect(isGateOpen({ isEmbeddedLaunch: false, manifestVersion })).toBe(true)
      expect(
        isGateOpen({
          isEmbeddedLaunch: false,
          manifestVersion,
          releaseVersion: BAKED_VERSION,
        }),
      ).toBe(false)
    }
  })
})

describe('decideUpdatePrompt', () => {
  test('skips the APK dialog when the newer release is also available over OTA', () => {
    expect(decideUpdatePrompt({ otaAvailable: true, releaseIsNewer: true })).toBe(false)
  })

  test('prompts when the newer release has no OTA bundle for this runtime', () => {
    expect(decideUpdatePrompt({ otaAvailable: false, releaseIsNewer: true })).toBe(true)
  })

  test('never prompts when the release is not newer, whatever OTA says', () => {
    expect(decideUpdatePrompt({ otaAvailable: true, releaseIsNewer: false })).toBe(false)
    expect(decideUpdatePrompt({ otaAvailable: false, releaseIsNewer: false })).toBe(false)
  })

  test('prompts when OTA availability is unknown (failed check is passed as false)', () => {
    // checkForUpdateAsync throwing maps to `otaAvailable: false` in
    // checkForUpdateAction: fail open to the dialog instead of dropping the release.
    expect(decideUpdatePrompt({ otaAvailable: false, releaseIsNewer: true })).toBe(true)
  })
})

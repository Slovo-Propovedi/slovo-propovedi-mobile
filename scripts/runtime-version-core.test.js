import { describe, expect, test } from '@jest/globals'
import { rewriteAndroidRuntimeVersion, rewriteIosRuntimeVersion } from './runtime-version-core.mjs'

const ANDROID_XML = `<resources>
  <string name="app_name">Слово.Проповеди</string>
  <string name="expo_runtime_version">0.33.1</string>
  <string name="expo_splash_screen_resize_mode" translatable="false">contain</string>
</resources>
`

const IOS_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>EXUpdatesCheckOnLaunch</key>
    <string>ALWAYS</string>
    <key>EXUpdatesEnabled</key>
    <false/>
    <key>EXUpdatesLaunchWaitMs</key>
    <integer>0</integer>
    <key>EXUpdatesRuntimeVersion</key>
    <string>1.0.0</string>
    <key>EXUpdatesURL</key>
    <string>https://u.expo.dev/ddf9e2dd-b431-490b-afed-1340eed6137a</string>
  </dict>
</plist>
`

const EXPECTED_ANDROID_XML = ANDROID_XML.replace('>0.33.1<', '>1.2.3<')
const EXPECTED_IOS_PLIST = IOS_PLIST.replace('>1.0.0<', '>1.2.3<')

describe('rewriteAndroidRuntimeVersion', () => {
  test('replaces the expo_runtime_version value', () => {
    expect(rewriteAndroidRuntimeVersion(ANDROID_XML, '1.2.3')).toBe(EXPECTED_ANDROID_XML)
  })

  test('replaces any stale value including non-semver', () => {
    const staleXml = ANDROID_XML.replace('>0.33.1<', '>stale<')

    expect(rewriteAndroidRuntimeVersion(staleXml, '1.2.3')).toBe(EXPECTED_ANDROID_XML)
  })

  test('returns null when the tag is missing', () => {
    const xmlWithoutRuntime = ANDROID_XML.replace(
      '  <string name="expo_runtime_version">0.33.1</string>\n',
      '',
    )

    expect(rewriteAndroidRuntimeVersion(xmlWithoutRuntime, '1.2.3')).toBeNull()
  })
})

describe('rewriteIosRuntimeVersion', () => {
  test('replaces the EXUpdatesRuntimeVersion value', () => {
    expect(rewriteIosRuntimeVersion(IOS_PLIST, '1.2.3')).toBe(EXPECTED_IOS_PLIST)
  })

  test('returns null when the key is missing', () => {
    const plistWithoutRuntime = IOS_PLIST.replace(
      '    <key>EXUpdatesRuntimeVersion</key>\n    <string>1.0.0</string>\n',
      '',
    )

    expect(rewriteIosRuntimeVersion(plistWithoutRuntime, '1.2.3')).toBeNull()
  })
})

import { decidePermissionResume } from './updateInstall'

describe('decidePermissionResume', () => {
  test('waits when install permission is still not granted', () => {
    expect(decidePermissionResume(false, true)).toBe('wait')
    expect(decidePermissionResume(false, false)).toBe('wait')
  })

  test('installs when permission is granted and the APK is still on disk', () => {
    expect(decidePermissionResume(true, true)).toBe('install')
  })

  test('restarts the flow when permission is granted but the APK was cleaned up', () => {
    expect(decidePermissionResume(true, false)).toBe('restart')
  })
})

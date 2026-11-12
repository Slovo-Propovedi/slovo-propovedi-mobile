import { type ComponentRef, createRef } from 'react'
import { Platform, type View } from 'react-native'
import {
  ANDROID_BLUR_MIN_SDK,
  BLUR_TARGET_ROUTES,
  type BlurTargetRef,
  getBlurTarget,
  registerBlurTarget,
  subscribeBlurTargets,
  supportsAndroidBackdropBlur,
  unregisterBlurTarget,
} from './blurTargets'

const createTargetRef = (): BlurTargetRef => createRef<ComponentRef<typeof View>>()

const setPlatform = (os: 'android' | 'ios', version?: number) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os })
  Object.defineProperty(Platform, 'Version', { configurable: true, value: version })
}

afterEach(() => setPlatform('ios', undefined))

describe('BLUR_TARGET_ROUTES', () => {
  test('covers tab roots plus nested listen-stack and admin routes', () => {
    expect(BLUR_TARGET_ROUTES).toMatchObject({
      adminHome: '/admin',
      adminPlaylists: '/admin/playlists',
      adminSections: '/admin/sections',
      adminSermons: '/admin/sermons',
      listen: '/listen',
      more: '/more',
      myPlaylists: '/listen/my-playlists',
      playlist: '/listen/playlist',
      playlistEdit: '/listen/playlist-edit',
      playlistList: '/listen/playlist-list',
      read: '/read',
    })
  })
})

describe('blur target registry', () => {
  test('resolves a registered target by its route key', () => {
    const target = createTargetRef()

    registerBlurTarget(BLUR_TARGET_ROUTES.listen, target)

    expect(getBlurTarget(BLUR_TARGET_ROUTES.listen)).toBe(target)
    expect(getBlurTarget(BLUR_TARGET_ROUTES.more)).toBeNull()

    unregisterBlurTarget(BLUR_TARGET_ROUTES.listen, target)
  })

  test('notifies subscribers when the target set changes', () => {
    const target = createTargetRef()
    const listener = jest.fn()
    const unsubscribe = subscribeBlurTargets(listener)

    registerBlurTarget('/listen', target)
    unregisterBlurTarget('/listen', target)
    unsubscribe()
    registerBlurTarget('/listen', target)

    expect(listener).toHaveBeenCalledTimes(2)

    unregisterBlurTarget('/listen', target)
  })

  test('ignores a repeated registration of the same ref', () => {
    const target = createTargetRef()
    const listener = jest.fn()
    const unsubscribe = subscribeBlurTargets(listener)

    registerBlurTarget('/listen', target)
    registerBlurTarget('/listen', target)
    unsubscribe()

    expect(listener).toHaveBeenCalledTimes(1)

    unregisterBlurTarget('/listen', target)
  })

  test('keeps the newer target when an older page unregisters late', () => {
    const staleTarget = createTargetRef()
    const freshTarget = createTargetRef()

    registerBlurTarget('/listen', staleTarget)
    registerBlurTarget('/listen', freshTarget)
    unregisterBlurTarget('/listen', staleTarget)

    expect(getBlurTarget('/listen')).toBe(freshTarget)

    unregisterBlurTarget('/listen', freshTarget)
  })
})

describe('supportsAndroidBackdropBlur', () => {
  test('is enabled on Android 12+', () => {
    setPlatform('android', ANDROID_BLUR_MIN_SDK)

    expect(supportsAndroidBackdropBlur()).toBe(true)
  })

  test('is disabled below Android 12 and on other platforms', () => {
    setPlatform('android', ANDROID_BLUR_MIN_SDK - 1)
    expect(supportsAndroidBackdropBlur()).toBe(false)

    setPlatform('ios', ANDROID_BLUR_MIN_SDK)
    expect(supportsAndroidBackdropBlur()).toBe(false)
  })
})

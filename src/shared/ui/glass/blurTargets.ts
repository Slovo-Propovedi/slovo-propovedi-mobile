import { type ComponentRef, type RefObject } from 'react'
import { Platform, type View } from 'react-native'

// The bottom chrome (tab island, search circle, mini pill, search pill and its
// close circle) can only blur content it is NOT a descendant of: expo-blur's
// Android `BlurTargetView` captures whatever renders inside it, so a BlurView
// inside the target would capture itself. The chrome therefore lives outside the
// pages and looks their target up here, keyed by the page route.
export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>

/** Dimezis hardware blur is reliable from Android 12 (API 31) up. */
export const ANDROID_BLUR_MIN_SDK = 31

/** Route keys of the pages that expose their content as a blur target. */
export const BLUR_TARGET_ROUTES = {
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
  searchResults: '/listen/search-results',
} as const

const targets = new Map<string, BlurTargetRef>()
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const supportsAndroidBackdropBlur = (): boolean =>
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= ANDROID_BLUR_MIN_SDK

/**
 * Publishes a page's laid-out target view. Called from the target's layout, so
 * a registered ref always points at a measured view; repeating the same
 * registration (layout can fire more than once) does not notify anyone.
 * Keys are exact `usePathname()` values: Expo Router strips route groups
 * (`(tabs)`) and query params, so a route with params maps to its stable path
 * (`/listen/playlist`), not to the `/listen` tab root.
 * @param routeKey - Page route the chrome resolves this target by.
 * @param target - Ref of the page's native target view.
 */
export const registerBlurTarget = (routeKey: string, target: BlurTargetRef) => {
  if (targets.get(routeKey) === target) return

  targets.set(routeKey, target)
  notify()
}

/**
 * Drops a page target. Only the owner can unregister it: a page that has
 * already been replaced by a newer instance of the same route must not remove
 * the newcomer's target in its unmount cleanup.
 * @param routeKey - Page route that owns the target.
 * @param target - Ref the owner registered for that route.
 */
export const unregisterBlurTarget = (routeKey: string, target: BlurTargetRef) => {
  if (targets.get(routeKey) !== target) return

  targets.delete(routeKey)
  notify()
}

export const getBlurTarget = (routeKey: string): BlurTargetRef | null =>
  targets.get(routeKey) ?? null

export const subscribeBlurTargets = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

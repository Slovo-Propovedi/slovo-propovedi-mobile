import { type ComponentRef, type RefObject } from 'react'
import { Platform, type View } from 'react-native'

// The bottom chrome (tab island, search circle, mini pill, search pill and its
// close circle) can only blur content it is NOT a descendant of: expo-blur's
// Android `BlurTargetView` captures whatever renders inside it, so a BlurView
// inside the target would capture itself. The chrome therefore lives outside the
// pages and looks their target up here, keyed by the page route.
//
// Each route keeps a STACK of targets: the page publishes its content, and a
// full-cover overlay (the search gate) may publish its own on top while it is
// open. The chrome always blurs the top target, and closing the overlay restores
// the page target without waiting for the page to relayout.
//
// The bottom chrome also owns a dedicated backdrop of its own: the always-mounted
// `BarBackdropShade` gradient registers under `BOTTOM_CHROME_SHADE_KEY` while the
// search page is open, and `getChromeBlurTarget` prefers it over any route
// target. Capturing the shade instead of the page keeps the white search
// background out of the glass and makes the backdrop immune to route/overlay
// registration churn during transitions.
export type BlurTargetRef = RefObject<ComponentRef<typeof View> | null>

/** Dimezis hardware blur is reliable from Android 12 (API 31) up. */
export const ANDROID_BLUR_MIN_SDK = 31

/**
 * Registry key of the bottom chrome's own backdrop: the `BarBackdropShade`
 * gradient region. It is not a route — the chrome resolves it ahead of the
 * current page while it is registered.
 */
export const BOTTOM_CHROME_SHADE_KEY = 'bottom-chrome-shade'

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
  preacher: '/listen/preacher',
  read: '/read',
} as const

const targets = new Map<string, BlurTargetRef[]>()
const listeners = new Set<() => void>()

const notify = () => {
  for (const listener of listeners) listener()
}

export const supportsAndroidBackdropBlur = (): boolean =>
  Platform.OS === 'android' &&
  typeof Platform.Version === 'number' &&
  Platform.Version >= ANDROID_BLUR_MIN_SDK

/**
 * Publishes a laid-out target view on top of its route's target stack. Called
 * from the target's layout, so a registered ref always points at a measured
 * view; repeating the same registration (layout can fire more than once) does
 * not notify anyone. Keys are exact `usePathname()` values: Expo Router strips
 * route groups (`(tabs)`) and query params, so a route with params maps to its
 * stable path (`/listen/playlist`), not to the `/listen` tab root.
 * @param routeKey - Route the chrome resolves this target by.
 * @param target - Ref of the page's (or overlay's) native target view.
 */
export const registerBlurTarget = (routeKey: string, target: BlurTargetRef) => {
  const stack = targets.get(routeKey) ?? []

  // Already on the stack: a repeated layout (or a covered page re-registering
  // under an overlay) must not reorder the stack.
  if (stack.includes(target)) return

  targets.set(routeKey, [...stack, target])
  notify()
}

/**
 * Drops a target from its route's stack. Only the owner can unregister it: a
 * page that has already been replaced by a newer instance of the same route
 * must not remove the newcomer's target in its unmount cleanup. Removing the
 * top target promotes the one below, so an overlay closing restores the page's
 * blur backdrop without a relayout.
 * @param routeKey - Route that owns the target.
 * @param target - Ref the owner registered for that route.
 */
export const unregisterBlurTarget = (routeKey: string, target: BlurTargetRef) => {
  const stack = targets.get(routeKey)
  if (stack === undefined) return

  const index = stack.indexOf(target)
  if (index === -1) return

  const nextStack = stack.filter(entry => entry !== target)
  if (nextStack.length === 0) targets.delete(routeKey)
  else targets.set(routeKey, nextStack)

  if (index === stack.length - 1) notify()
}

export const getBlurTarget = (routeKey: string): BlurTargetRef | null =>
  targets.get(routeKey)?.at(-1) ?? null

/**
 * Resolves the backdrop the floating bottom chrome should sample. The dedicated
 * shade target wins whenever it is registered (the search page is open and the
 * shade is mounted); otherwise the page target for the current route, exactly
 * as before. Preferring a live registration keeps the rule in the registry, so
 * `GlassSurface` consumers need no knowledge of search state.
 * @param routeKey - Current `usePathname()` value.
 */
export const getChromeBlurTarget = (routeKey: string): BlurTargetRef | null =>
  getBlurTarget(BOTTOM_CHROME_SHADE_KEY) ?? getBlurTarget(routeKey)

export const subscribeBlurTargets = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

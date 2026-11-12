import { usePathname } from 'expo-router'
import { useSyncExternalStore } from 'react'
import {
  type BlurTargetRef,
  getBlurTarget,
  subscribeBlurTargets,
  supportsAndroidBackdropBlur,
} from './blurTargets'

/**
 * Backdrop of a surface that floats OVER the page (the mini-player pill), as
 * opposed to the tab-bar chrome: the page target registered for the current
 * route, ignoring the chrome's own shade target. While the search page is open
 * its overlay sits on top of the route stack and becomes this target, so the
 * pill frosts the themed search page instead of the transparent gray shade.
 */
export const usePageBlurTarget = (): BlurTargetRef | null => {
  const pathname = usePathname()
  const isSupported = supportsAndroidBackdropBlur()

  return useSyncExternalStore(
    subscribeBlurTargets,
    () => (isSupported ? getBlurTarget(pathname) : null),
    () => null,
  )
}

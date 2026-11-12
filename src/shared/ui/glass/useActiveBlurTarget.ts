import { usePathname } from 'expo-router'
import { useSyncExternalStore } from 'react'
import {
  type BlurTargetRef,
  getChromeBlurTarget,
  subscribeBlurTargets,
  supportsAndroidBackdropBlur,
} from './blurTargets'

/**
 * Backdrop of the floating bottom chrome: the dedicated shade target while the
 * search page publishes it, otherwise the page currently shown underneath. The
 * chrome publishes it to every glass surface, so all islands blur the same
 * backdrop. Null until that target has laid out (or on platforms and Android
 * versions without real backdrop blur), and the surfaces then keep the tint
 * fallback.
 */
export const useActiveBlurTarget = (): BlurTargetRef | null => {
  const pathname = usePathname()
  const isSupported = supportsAndroidBackdropBlur()

  return useSyncExternalStore(
    subscribeBlurTargets,
    () => (isSupported ? getChromeBlurTarget(pathname) : null),
    () => null,
  )
}

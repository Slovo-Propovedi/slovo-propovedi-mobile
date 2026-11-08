import { usePathname } from 'expo-router'
import { useSyncExternalStore } from 'react'
import {
  type BlurTargetRef,
  getBlurTarget,
  subscribeBlurTargets,
  supportsAndroidBackdropBlur,
} from './blurTargets'

/**
 * Target view of the page currently shown under the floating bottom chrome.
 * The chrome publishes it to every glass surface, so all islands blur the
 * same backdrop. Null until that page has laid out (or on platforms and Android
 * versions without real backdrop blur), and the surfaces then keep the tint
 * fallback.
 */
export const useActiveBlurTarget = (): BlurTargetRef | null => {
  const pathname = usePathname()
  const isSupported = supportsAndroidBackdropBlur()

  return useSyncExternalStore(
    subscribeBlurTargets,
    () => (isSupported ? getBlurTarget(pathname) : null),
    () => null,
  )
}

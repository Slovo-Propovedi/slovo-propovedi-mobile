import { useAtom } from '@reatom/npm-react'
import { BlurTargetView } from 'expo-blur'
import { type ComponentRef, type PropsWithChildren, useEffect, useRef } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { isSearchOpenAtom } from 'features/sermon-search/@x/barMorph'
import {
  BOTTOM_CHROME_SHADE_KEY,
  registerBlurTarget,
  supportsAndroidBackdropBlur,
  unregisterBlurTarget,
} from 'shared/ui/glass/blurTargets'

/**
 * Publishes the bottom chrome's own backdrop while the search page is open: the
 * always-mounted `BarBackdropShade` gradient, registered under
 * `BOTTOM_CHROME_SHADE_KEY`. The chrome glass then samples the shade instead of
 * the page, so the white search background never bleeds through and route or
 * overlay transitions cannot swap the backdrop mid-session. Off Android and
 * below Android 12 the shade renders untouched (tint fallback, as before).
 * @param root0 - Target wrapper props.
 * @param root0.children - The shade content to expose as the blur backdrop.
 */
export const ShadeBlurTarget = ({ children }: PropsWithChildren) => {
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const { height: screenHeight } = useWindowDimensions()
  const targetRef = useRef<ComponentRef<typeof View> | null>(null)
  const isActive = isSearchOpen && supportsAndroidBackdropBlur()

  useEffect(() => {
    if (!isActive) return

    return () => unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, targetRef)
  }, [isActive])

  if (!isActive) return <>{children}</>

  return (
    // The native target is an Expo `LinearLayout` and ignores RN's
    // `pointerEvents`; this real RN wrapper is what keeps the oversized capture
    // region out of hit-testing so taps reach the search page underneath.
    <View pointerEvents='none' style={[styles.layer, styles.touchThrough, { top: -screenHeight }]}>
      <BlurTargetView
        ref={targetRef}
        pointerEvents='none'
        // The native target clips its children to its bounds, and the shade
        // grows upward out of the tab-bar container: a negative top keeps the
        // whole visible region inside the captured view.
        style={[StyleSheet.absoluteFill, styles.touchThrough]}
        onLayout={() => registerBlurTarget(BOTTOM_CHROME_SHADE_KEY, targetRef)}
      >
        {children}
      </BlurTargetView>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  touchThrough: {
    pointerEvents: 'none',
  },
})

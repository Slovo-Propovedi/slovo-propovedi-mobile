import { useEffect } from 'react'
import { Keyboard, type KeyboardEvent, Platform } from 'react-native'
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated'

const VISUAL_VIEWPORT_NOISE_PX = 2

/**
 * Height of the on-screen keyboard/bottom occlusion in dp, shared by every
 * floating bottom-chrome wrapper (tab bar, search island, mini player). Zero
 * when nothing occludes the bottom. Lives outside React so every wrapper reads
 * the same value and a single subscription drives all of them.
 *
 * On web this shared value covers both the stale-toolbar band (iOS browsers can
 * re-expand the toolbar without shrinking the layout viewport) and the keyboard
 * on iOS Safari/PWA (visualViewport shrinks while innerHeight stays — previously
 * unhandled on web). Android/desktop browsers resize innerHeight for the
 * keyboard, so the band stays 0 there and nothing changes.
 */
export const keyboardBottomInsetSv = makeMutable(0)

/**
 * Applies a keyboard height to the shared inset. Native keyboard events can
 * carry an unusable height (floating/undocked keyboards); the last valid height
 * is kept instead of collapsing the chrome into the keyboard.
 * @param height - Keyboard height reported by the native event.
 */
const applyKeyboardHeight = (height: number) => {
  if (!Number.isFinite(height) || height < 0) return

  keyboardBottomInsetSv.value = height
}

const handleKeyboardShow = (event: KeyboardEvent) => {
  applyKeyboardHeight(event.endCoordinates.height)
}

const handleKeyboardHide = () => applyKeyboardHeight(0)

const getVisualViewportBottomBand = (): number => {
  const viewport = window.visualViewport
  if (!viewport) return 0

  const band = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop))

  return band < VISUAL_VIEWPORT_NOISE_PX ? 0 : band
}

const syncVisualViewportInset = () => {
  keyboardBottomInsetSv.value = getVisualViewportBottomBand()
}

/**
 * Lifts a floating chrome wrapper above the on-screen keyboard. Applied to the
 * outer wrapper of every bottom-chrome layer, so the islands track the keyboard
 * frame by frame instead of being covered by it.
 */
export const useKeyboardLiftStyle = () =>
  useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardBottomInsetSv.value }],
  }))

/**
 * Keeps `keyboardBottomInsetSv` in sync with the active bottom occlusion.
 * Mounted once at the app root, right above the bottom chrome, so the tab bar,
 * the search island and the mini player lift together.
 *
 * Native uses Keyboard show/hide events. Web syncs from visualViewport so iOS
 * browser toolbar/keyboard occlusion is compensated live; browsers without
 * visualViewport keep the current layout behavior.
 */
export const useKeyboardBottomInsetSync = () => {
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.visualViewport) return

      syncVisualViewportInset()
      const viewport = window.visualViewport
      viewport.addEventListener('resize', syncVisualViewportInset)
      viewport.addEventListener('scroll', syncVisualViewportInset)
      window.addEventListener('resize', syncVisualViewportInset)

      return () => {
        viewport.removeEventListener('resize', syncVisualViewportInset)
        viewport.removeEventListener('scroll', syncVisualViewportInset)
        window.removeEventListener?.('resize', syncVisualViewportInset)
      }
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])
}

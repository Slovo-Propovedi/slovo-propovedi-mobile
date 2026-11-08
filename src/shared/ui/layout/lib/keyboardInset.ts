import { useEffect } from 'react'
import { Keyboard, type KeyboardEvent, Platform } from 'react-native'
import { makeMutable, useAnimatedStyle } from 'react-native-reanimated'

/**
 * Height of the on-screen keyboard in dp, shared by every floating bottom-chrome
 * wrapper (tab bar, search island, mini player). Zero when the keyboard is
 * hidden. Lives outside React so every wrapper reads the same value and a
 * single keyboard subscription drives all of them.
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
 * Keeps `keyboardBottomInsetSv` in sync with the native keyboard. Mounted once
 * at the app root, right above the bottom chrome, so the tab bar, the search
 * island and the mini player lift together. Web keeps the current layout: the
 * browser handles the visual viewport itself, and RN web never emits these
 * native keyboard events.
 */
export const useKeyboardBottomInsetSync = () => {
  useEffect(() => {
    if (Platform.OS === 'web') return

    const showSubscription = Keyboard.addListener('keyboardDidShow', handleKeyboardShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])
}

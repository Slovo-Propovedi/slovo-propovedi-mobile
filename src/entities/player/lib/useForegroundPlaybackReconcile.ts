import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { ctx } from 'shared/lib/reatom-ctx'
import { isPlayingAtom } from '../model'
import { usePlayer } from './usePlayer'

/**
 * Reconciles native playback with JS state whenever the app returns to the
 * foreground. Mounted at the process root, so it runs even when the fullscreen
 * player is not mounted: the native queue keeps playing while JS is frozen and
 * a headset/AVRCP resume is handled natively without ever reaching JS.
 */
export const useForegroundPlaybackReconcile = (): void => {
  const { getStatus, reconcileOnForeground } = usePlayer()

  useEffect(() => {
    let appState = AppState.currentState

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const isReturning = !!appState?.match(/inactive|background/) && nextAppState === 'active'
      appState = nextAppState
      if (!isReturning) return

      // JS belief covers a queue that finished natively (engine already paused);
      // the native probe covers a resume that never reached JS.
      if (!ctx.get(isPlayingAtom) && !getStatus().isPlaying) return

      await reconcileOnForeground()
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [getStatus, reconcileOnForeground])
}

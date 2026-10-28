import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { type PlaybackStatus } from '../../lib/PlayerService/types'

interface AppStatePlaybackParams {
  getStatus: () => PlaybackStatus
  isPlaying: boolean
  reconcileOnForeground: () => Promise<void>
}

/**
 * Reconciles native playback with JS state when the app returns to the
 * foreground. The native queue keeps playing while JS is frozen, so track
 * switches, completion and lock-screen metadata can be stale on resume.
 * @param root0 - Playback probes and the reconciliation entry point.
 * @param root0.getStatus - Reads the current playback status.
 * @param root0.isPlaying - Whether JS believes playback is running.
 * @param root0.reconcileOnForeground - Repairs JS state from the native engine.
 */
export const useAppStatePlayback = ({
  getStatus,
  isPlaying,
  reconcileOnForeground,
}: AppStatePlaybackParams) => {
  useEffect(() => {
    let appState = AppState.currentState

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const isReturning = !!appState?.match(/inactive|background/) && nextAppState === 'active'
      appState = nextAppState
      if (!isReturning) return

      // JS belief covers a queue that finished natively (engine already paused).
      if (!isPlaying && !getStatus().isPlaying) return

      await reconcileOnForeground()
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [getStatus, isPlaying, reconcileOnForeground])
}

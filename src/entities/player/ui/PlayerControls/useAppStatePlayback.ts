import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import type { LockScreenMetadata, PlaybackStatus } from '../../lib/PlayerService/types'

interface AppStatePlaybackParams {
  currentAudio: {
    artist: string
    artwork: null | string
    title: string
  } | null
  currentPlaylist: { title?: string } | null
  getStatus: () => PlaybackStatus
  reassertLockScreenMetadata: (metadata: LockScreenMetadata) => void
}

export const useAppStatePlayback = ({
  currentAudio,
  currentPlaylist,
  getStatus,
  reassertLockScreenMetadata,
}: AppStatePlaybackParams) => {
  useEffect(() => {
    let appState = AppState.currentState

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const audioStatus = getStatus()

        // Full re-activation (not the in-place update): if the OS killed the
        // foreground service while backgrounded, updateLockScreenMetadata is
        // silently dropped and the notification would never come back
        if (currentAudio && audioStatus.isPlaying)
          reassertLockScreenMetadata({
            albumTitle: currentPlaylist?.title,
            artist: currentAudio.artist,
            artworkUrl: currentAudio.artwork,
            title: currentAudio.title,
          })
      }

      appState = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [currentAudio, currentPlaylist, getStatus, reassertLockScreenMetadata])
}

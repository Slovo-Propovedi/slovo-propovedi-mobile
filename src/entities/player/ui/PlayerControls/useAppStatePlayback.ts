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
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
}

export const useAppStatePlayback = ({
  currentAudio,
  currentPlaylist,
  getStatus,
  setLockScreenMetadata,
}: AppStatePlaybackParams) => {
  useEffect(() => {
    let appState = AppState.currentState

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        const audioStatus = getStatus()

        if (currentAudio && audioStatus.isPlaying)
          setLockScreenMetadata({
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
  }, [currentAudio, currentPlaylist, getStatus, setLockScreenMetadata])
}

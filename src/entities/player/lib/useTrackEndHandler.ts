import { useCallback } from 'react'
import type { AudioPlayerData } from '../ui/PlayerControls.types'
import type { AudioPlayer } from 'expo-audio'
import type { PlaylistData } from 'shared/model'

interface UseTrackEndHandlerParams {
  currentPlaylist: null | PlaylistData
  hasValidPlaylist: boolean
  isLastTrack: boolean
  loadAudio: (url: string) => Promise<AudioPlayer | null>
  pause: () => Promise<void>
  play: () => Promise<void>
  repeatMode: 'off' | 'queue' | 'track'
  seekTo: (position: number) => Promise<void>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}

export const useTrackEndHandler = ({
  currentPlaylist,
  hasValidPlaylist,
  isLastTrack,
  loadAudio,
  pause,
  play,
  repeatMode,
  seekTo,
  setCurrentAudio,
  toggleTrack,
}: UseTrackEndHandlerParams) =>
  useCallback(async () => {
    // Repeat one track
    if (repeatMode === 'track') {
      await seekTo(0)
      await play()
      return
    }

    // No playlist - stop
    if (!hasValidPlaylist || !currentPlaylist) {
      await pause()
      return
    }

    // Last track in playlist
    if (isLastTrack) {
      if (repeatMode === 'queue') {
        // Repeat playlist - go to first track
        const firstTrack = currentPlaylist.list[0]
        if (firstTrack?.audioUrl) {
          const { audioUrl, ...otherProps } = firstTrack
          const newAudio = { ...otherProps, audioUrl, previewUrl: currentPlaylist.previewUrl }
          await setCurrentAudio(newAudio)
          await loadAudio(newAudio.audioUrl)
          await play()
        }
      } else
        // No repeat - stop
        await pause()
      return
    }

    // Not last track - play next
    await toggleTrack('next')
  }, [
    currentPlaylist,
    hasValidPlaylist,
    isLastTrack,
    loadAudio,
    pause,
    play,
    repeatMode,
    seekTo,
    setCurrentAudio,
    toggleTrack,
  ])

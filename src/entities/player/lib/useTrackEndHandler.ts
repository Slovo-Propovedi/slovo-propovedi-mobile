import { useCallback } from 'react'
import type { AudioPlayerData } from '../ui/PlayerControls.types'
import type { AudioPlayer } from 'expo-audio'
import type { PlaylistData } from 'shared/model'

interface LockScreenMetadata {
  albumTitle?: string
  artist?: string
  artworkUrl?: string
  title: string
}

interface UseTrackEndHandlerParams {
  currentPlaylist: null | PlaylistData
  hasValidPlaylist: boolean
  indexOfCurrentAudio: number | undefined
  isLastTrack: boolean
  loadAudio: (url: string) => Promise<AudioPlayer | null>
  pause: () => Promise<void>
  play: () => Promise<void>
  repeatMode: 'off' | 'queue' | 'track'
  seekTo: (position: number) => Promise<void>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
  toggleTrack: (dir: 'next' | 'prev') => Promise<void>
}

export const useTrackEndHandler = ({
  currentPlaylist,
  hasValidPlaylist,
  indexOfCurrentAudio: _indexOfCurrentAudio,
  isLastTrack,
  loadAudio,
  pause,
  play,
  repeatMode,
  seekTo,
  setCurrentAudio,
  setLockScreenMetadata,
  toggleTrack,
}: UseTrackEndHandlerParams) => {
  const handleQueueRepeat = useCallback(async () => {
    const playlist = currentPlaylist
    if (!playlist) return false

    const firstTrack = playlist.list[0]
    if (!firstTrack?.audioUrl) return false

    const { audioUrl, ...otherProps } = firstTrack
    const newAudio = {
      ...otherProps,
      artwork: playlist.previewUrl,
      audioUrl,
      previewUrl: playlist.previewUrl,
    }
    await setCurrentAudio(newAudio)
    await loadAudio(newAudio.audioUrl)
    setLockScreenMetadata({
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork || newAudio.previewUrl,
      title: newAudio.title,
    })
    try {
      await play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[Player] Ignoring AppState-related error:', error.message)
      else throw error
    }
    return true
  }, [currentPlaylist, loadAudio, play, setCurrentAudio, setLockScreenMetadata])

  return useCallback(async () => {
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

    // Last track in playlist - use passed isLastTrack
    if (isLastTrack) {
      if (repeatMode === 'queue') {
        const handled = await handleQueueRepeat()
        if (handled) return
      }
      await pause()
      return
    }

    // Not last track - play next
    await toggleTrack('next')
  }, [
    currentPlaylist,
    handleQueueRepeat,
    hasValidPlaylist,
    isLastTrack,
    pause,
    play,
    repeatMode,
    seekTo,
    toggleTrack,
  ])
}

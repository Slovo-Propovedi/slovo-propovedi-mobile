import { useMemo } from 'react'
import { playerService } from './PlayerService'

export const usePlayer = () =>
  useMemo(
    () => ({
      getVolume: playerService.getVolume,
      loadAudio: playerService.loadAudio,
      onTrackEndSetter: (callback: (() => void) | undefined) => {
        playerService.onTrackEnd = callback
      },
      pause: playerService.pause,
      play: playerService.play,
      seekTo: playerService.seekTo,
      setVolume: playerService.setVolume,
      stop: playerService.stop,
      unload: playerService.unload,
    }),
    [],
  )

export { usePlayerState } from './usePlayerState'

import { useMemo } from 'react'
import { playerService } from './PlayerService'

export const usePlayer = () =>
  useMemo(
    () => ({
      clearLockScreenControls: playerService.clearLockScreenControls,
      getStatus: playerService.getStatus,
      getVolume: playerService.getVolume,
      loadAudio: playerService.loadAudio,
      pause: playerService.pause,
      play: playerService.play,
      replaceAudio: playerService.replaceAudio,
      seekTo: playerService.seekTo,
      setLockScreenMetadata: playerService.setLockScreenMetadata,
      setVolume: playerService.setVolume,
      stop: playerService.stop,
      unload: playerService.unload,
    }),
    [],
  )

export { usePlayerState } from './usePlayerState'

import { useMemo } from 'react'
import { playerService } from './PlayerService'

export const usePlayer = () =>
  useMemo(
    () => ({
      getStatus: playerService.getStatus,
      getVolume: playerService.getVolume,
      loadAudio: playerService.loadAudio,
      pause: playerService.pause,
      play: playerService.play,
      reassertLockScreenMetadata: playerService.reassertLockScreenMetadata,
      replaceAudio: playerService.replaceAudio,
      seekTo: playerService.seekTo,
      setLockScreenMetadata: playerService.setLockScreenMetadata,
      setVolume: playerService.setVolume,
      stop: playerService.stop,
      unload: playerService.unload,
    }),
    [],
  )

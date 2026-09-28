import { useMemo } from 'react'
import { playerService } from './PlayerService'

export const usePlayer = () =>
  useMemo(
    () => ({
      applyVolume: playerService.applyVolume,
      getStatus: playerService.getStatus,
      getVolume: playerService.getVolume,
      loadAudio: playerService.loadAudio,
      pause: playerService.pause,
      play: playerService.play,
      reassertLockScreenMetadata: playerService.reassertLockScreenMetadata,
      replaceAudio: playerService.replaceAudio,
      resumeAfterPause: playerService.resumeAfterPause,
      seekTo: playerService.seekTo,
      setLockScreenMetadata: playerService.setLockScreenMetadata,
      setPlaybackRate: playerService.setPlaybackRate,
      setVolume: playerService.setVolume,
      stop: playerService.stop,
      unload: playerService.unload,
    }),
    [],
  )

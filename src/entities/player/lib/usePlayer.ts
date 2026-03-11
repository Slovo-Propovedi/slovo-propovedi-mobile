import { playerService } from './PlayerService'

export const usePlayer = () => ({
  loadAudio: playerService.loadAudio,
  pause: playerService.pause,
  play: playerService.play,
  seekTo: playerService.seekTo,
  stop: playerService.stop,
  unload: playerService.unload,
})

export { usePlayerState } from './usePlayerState'

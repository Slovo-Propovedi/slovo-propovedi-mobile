import { playerService } from './PlayerService'

export const usePlayer = () => ({
  getVolume: playerService.getVolume,
  loadAudio: playerService.loadAudio,
  pause: playerService.pause,
  play: playerService.play,
  seekTo: playerService.seekTo,
  setVolume: playerService.setVolume,
  stop: playerService.stop,
  unload: playerService.unload,
})

export { usePlayerState } from './usePlayerState'

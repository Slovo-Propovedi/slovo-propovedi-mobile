import type { PlayerService } from '../index.native'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

export const wireTrackAutoAdvance = (playerService: PlayerService): void => {
  trackAutoAdvanceService.setPlayerActions({
    pause: () => playerService.pause(),
    play: () => playerService.play(),
    replaceAudio: (audioUrl, initialPositionMs) =>
      playerService.replaceAudio(audioUrl, initialPositionMs),
  })
}

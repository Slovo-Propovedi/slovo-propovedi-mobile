import type { PlayerActions } from './TrackAutoAdvanceService/types'
import { playerService } from './index.native'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

/**
 * Sets up dependency injection for TrackAutoAdvanceService.
 * Must be called after playerService instance is created.
 */
export const setupPlayerActions = (): void => {
  const playerActions: PlayerActions = {
    pause: () => playerService.pause(),
    play: () => playerService.play(),
    replaceAudio: (audioUrl, initialPositionMs) =>
      playerService.replaceAudio(audioUrl, initialPositionMs),
  }
  trackAutoAdvanceService.setPlayerActions(playerActions)
}

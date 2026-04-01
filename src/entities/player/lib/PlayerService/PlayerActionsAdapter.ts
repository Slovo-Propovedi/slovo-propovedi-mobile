import { type PlayerService } from './index.native'
import { type PlayerActions, trackAutoAdvanceService } from './TrackAutoAdvanceService'

/**
 * Creates PlayerActions adapter that delegates to PlayerService.
 * Enables dependency injection without tight coupling.
 * @param playerService - The PlayerService instance to delegate to.
 */
const createPlayerActions = (playerService: PlayerService): PlayerActions => ({
  pause: () => playerService.pause(),
  play: () => playerService.play(),
  replaceAudio: (audioUrl, initialPositionMs) =>
    playerService.replaceAudio(audioUrl, initialPositionMs),
})

/**
 * Sets up dependency injection for TrackAutoAdvanceService.
 * Must be called after playerService instance is created.
 * @param playerService - The PlayerService instance to use for creating actions.
 */
export const setupPlayerActions = (playerService: PlayerService): void => {
  const playerActions = createPlayerActions(playerService)
  trackAutoAdvanceService.setPlayerActions(playerActions)
}

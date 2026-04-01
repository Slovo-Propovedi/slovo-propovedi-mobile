import { ctx } from 'shared/lib/reatom-ctx'
import {
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPositionAction,
} from '../../model'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService'
import { type StatusCallbacks } from './types'

/**
 * Factory for creating status callbacks that update Reatom state.
 * Encapsulates the bridge between player events and state management.
 */
export const createStatusCallbacks = (): StatusCallbacks => ({
  onBufferingChange: isBuffering => void setIsBufferingAction(ctx, isBuffering),
  onDurationChange: durationMs => void setDurationAction(ctx, durationMs),
  onPlayingChange: isPlaying => void setIsPlayingAction(ctx, isPlaying),
  onPositionChange: positionMs => void setPositionAction(ctx, positionMs),
  onTrackEnd: () => void trackAutoAdvanceService.handleTrackEnd(),
})

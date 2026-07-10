import { ctx } from 'shared/lib/reatom-ctx'
import type { AudioPlayer } from 'expo-audio'
import {
  isPlayingAtom,
  pauseTypeAtom,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPauseTypeAction,
  setPositionAction,
} from '../../model'
import { playerStatusListener } from './PlayerStatusListener'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

export const setupPlayerListeners = (
  player: AudioPlayer,
  onAudioInterruption: (isInterrupted: boolean) => void,
): void => {
  playerStatusListener.setupListeners(player, {
    onAudioInterruption,
    onBufferingChange: isBuffering => void setIsBufferingAction(ctx, isBuffering),
    onDurationChange: durationMs => void setDurationAction(ctx, durationMs),
    onPlayingChange: isPlaying => void setIsPlayingAction(ctx, isPlaying),
    onPositionChange: positionMs => void setPositionAction(ctx, positionMs),
    onTrackEnd: () => void trackAutoAdvanceService.handleTrackEnd(),
  })
}

interface InterruptionCallbacks {
  pause: (pauseType?: 'auto') => Promise<void>
  play: () => Promise<void>
}

export const createAudioInterruptionHandler = (callbacks: InterruptionCallbacks) => {
  let wasPlayingBeforeInterruption = false

  return (isInterrupted: boolean): void => {
    if (isInterrupted) {
      const wasPlaying = ctx.get(isPlayingAtom)
      wasPlayingBeforeInterruption = wasPlaying
      if (wasPlaying) void callbacks.pause('auto')
      return
    }

    const pauseType = ctx.get(pauseTypeAtom)
    if (pauseType === 'auto' && wasPlayingBeforeInterruption) void callbacks.play()

    wasPlayingBeforeInterruption = false
    void setPauseTypeAction(ctx, null)
  }
}

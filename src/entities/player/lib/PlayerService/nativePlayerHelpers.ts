import { ctx } from 'shared/lib/reatom-ctx'
import type { AudioPlayer } from 'expo-audio'
import {
  isPlayingAtom,
  isSeekingAtom,
  pauseTypeAtom,
  seekTargetPositionAtom,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setIsSeekingAction,
  setPauseTypeAction,
  setPositionAction,
  setSeekTargetAction,
} from '../../model'
import { playerStatusListener } from './PlayerStatusListener'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

/** Native position must land this close to the seek target before the guard lifts. */
const SEEK_TARGET_CONFIRM_TOLERANCE_MS = 500

export const setupPlayerListeners = (
  player: AudioPlayer,
  onAudioInterruption: (isInterrupted: boolean) => void,
): void => {
  playerStatusListener.setupListeners(player, {
    onAudioInterruption,
    onBufferingChange: isBuffering => void setIsBufferingAction(ctx, isBuffering),
    onDurationChange: durationMs => void setDurationAction(ctx, durationMs),
    onPlayingChange: isPlaying => void setIsPlayingAction(ctx, isPlaying),
    onPositionChange: positionMs => {
      if (ctx.get(isSeekingAtom)) {
        const target = ctx.get(seekTargetPositionAtom)
        if (target !== null && Math.abs(positionMs - target) < SEEK_TARGET_CONFIRM_TOLERANCE_MS) {
          void setIsSeekingAction(ctx, false)
          void setSeekTargetAction(ctx, null)
        }
        return
      }
      void setPositionAction(ctx, positionMs)
    },
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

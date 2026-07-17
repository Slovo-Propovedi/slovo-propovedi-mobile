import { ctx } from 'shared/lib/reatom-ctx'
import type { AudioPlayer } from 'expo-audio'
import {
  isPlayingAtom,
  isSeekingAtom,
  pauseTypeAtom,
  positionAtom,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setIsSeekingAction,
  setPauseTypeAction,
  setPositionAction,
} from '../../model'
import { playerStatusListener } from './PlayerStatusListener'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService/TrackAutoAdvanceService'

/** Stale events farther than this from the seek target are blocked. */
const SEEK_TOLERANCE_MS = 1000

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
        const seekTarget = ctx.get(positionAtom)
        if (Math.abs(positionMs - seekTarget) > SEEK_TOLERANCE_MS) return
        void setPositionAction(ctx, positionMs)
        void setIsSeekingAction(ctx, false)
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

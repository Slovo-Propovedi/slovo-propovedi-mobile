import { ctx } from 'shared/lib/reatom-ctx'
import { isBufferingAtom } from '../../../model'
import { pauseTypeAtom, setPauseTypeAction } from '../../../pauseType'
import { setIsStalledOfflineAction } from '../../stalledOffline'

interface InterruptionCallbacks {
  pause: (pauseType?: 'auto') => Promise<void>
  play: () => Promise<void>
}

export const createAudioInterruptionHandler = (callbacks: InterruptionCallbacks) => {
  let wasPlayingBeforeInterruption = false

  // Any playing→false edge is treated as an interruption: pause('auto') is idempotent
  // (flush no-op guard, pause on a paused player is a no-op), so a user pause also
  // routes through it harmlessly; system interruption pauses arm the auto-resume
  // intent. A natural track end never reaches this path — the status handler filters
  // didJustFinish out. User-pause discrimination is unnecessary — stop()/unload()
  // pause outside the status stream.
  return (isInterrupted: boolean): void => {
    if (isInterrupted) {
      wasPlayingBeforeInterruption = true
      // A buffering stall is stream starvation regardless of the NetInfo-reported
      // state — the NetInfo flip lags the buffer underrun (Issue #109). Manual
      // pause also routes here, but then isBuffering is false — the flag stays
      // untouched. The flag is cleared by queue build chokepoints and consumed
      // only by the reconnect heal.
      if (ctx.get(isBufferingAtom)) void setIsStalledOfflineAction(ctx, true)

      void callbacks.pause('auto')
      return
    }

    const pauseType = ctx.get(pauseTypeAtom)
    if (pauseType === 'auto' && wasPlayingBeforeInterruption) void callbacks.play()

    wasPlayingBeforeInterruption = false
    void setPauseTypeAction(ctx, null)
  }
}

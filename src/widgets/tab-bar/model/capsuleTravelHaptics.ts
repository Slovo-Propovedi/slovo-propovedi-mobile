import { hapticHighlightPass, hapticLanding } from 'shared/lib/haptics'
import { capsuleLog } from '../lib/capsuleTravelDebug'

// Guards the UI→JS haptic callbacks: a pass or landing scheduled by a frame
// carries the travel id it was born under. If a newer travel (press tick, snap)
// started before the callback reaches JS, the id no longer matches and the
// event is dropped instead of replaying as an extra light/medium. The id counter
// lives on the JS thread because a same-tick read of a shared value written from
// JS is stale on native.
export const createCapsuleTravelHaptics = () => {
  let travelId = 0
  let settledTravelId = -1

  return {
    /** Opens a new generation; the caller mirrors the id into the frame state. */
    begin: () => {
      travelId += 1

      return travelId
    },
    firePass: (id: number) => {
      if (id !== travelId) {
        capsuleLog(`drop gen=${id} current=${travelId} kind=light`)

        return
      }

      capsuleLog(`fire gen=${id} kind=light ts=${Date.now()}`)
      hapticHighlightPass()
    },
    /**
     * Whether the id still belongs to the current travel.
     * @param id - Travel id a scheduled callback was born under.
     */
    isCurrent: (id: number) => id === travelId,
    /**
     * True only once per current travel: the landing cue may fire just once.
     * @param id - Travel id the landing frame was born under.
     */
    land: (id: number) => {
      if (id !== travelId || id === settledTravelId) {
        capsuleLog(`drop gen=${id} current=${travelId} kind=landing`)

        return false
      }

      settledTravelId = id
      capsuleLog(`fire gen=${id} kind=landing ts=${Date.now()}`)
      hapticLanding()

      return true
    },
    reset: () => {
      settledTravelId = -1
    },
  }
}

import { useAction } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { skipOnboardingStep } from '../model/skip'

// A `skipIfMissing` card whose target never registers is dropped: 600 ms is long
// enough for a mounted row to measure, short enough not to stall the tour when
// the row is genuinely absent (admin/local-only/feature-gated).
const SKIP_MISSING_MS = 600

interface SkipMissingStepInput {
  deckIndex: number | undefined
  // True when a target other than this card's own is registered. The card's own rect
  // is unregistered (waitingForTarget), so any registered rect proves the surface
  // already rendered its items — the missing target is genuinely absent.
  hasOtherRegisteredRect: boolean
  // True while a `skipIfMissing` card's target is still unregistered.
  waitingForTarget: boolean
}

// Drops a card whose target never registers, in the direction the user arrived:
// forward for «Далее», backward for «Назад». The entry leaves the deck for good (its
// exit visualizations with it) and the tour moves to the nearest surviving neighbor;
// a boundary skip — no survivor in the skip direction — ends the tour via
// `endOnboardingTour`. Returns whether the card is currently being skipped — the
// overlay stays hidden meanwhile.
export const useSkipMissingStep = ({
  deckIndex,
  hasOtherRegisteredRect,
  waitingForTarget,
}: SkipMissingStepInput) => {
  const skipStep = useAction(skipOnboardingStep)
  const directionRef = useRef<'backward' | 'forward'>('forward')
  const previousIndexRef = useRef(deckIndex)

  useEffect(() => {
    const previous = previousIndexRef.current
    if (deckIndex === undefined || previous === undefined) return

    if (deckIndex < previous) directionRef.current = 'backward'
    else if (deckIndex > previous) directionRef.current = 'forward'
    previousIndexRef.current = deckIndex
  }, [deckIndex])

  useEffect(() => {
    if (!waitingForTarget) return

    const direction = directionRef.current === 'backward' ? 'back' : 'next'
    // The surface already rendered its items, so skip at once instead of burning the
    // hold; the 600 ms window stays for the case where nothing has registered yet
    // (the surface may still be mounting).
    if (hasOtherRegisteredRect) {
      skipStep(direction)
      return
    }

    const timer = setTimeout(() => skipStep(direction), SKIP_MISSING_MS)
    return () => clearTimeout(timer)
  }, [hasOtherRegisteredRect, skipStep, deckIndex, waitingForTarget])

  return waitingForTarget
}

import { action, atom } from '@reatom/framework'
import { resolveEntryStartIndex, resolveTourDeck } from '../lib/resolveDeck'
import { resolveTourStart } from '../lib/resolveTourStart'
import { type OnboardingScenarioId } from '../lib/scenarioId'
import { scenariosById } from '../lib/scenarios'
import { findNearestDeckIndex } from '../lib/tourDeck'
import { onboardingTargetRectsAtom } from './targets'

export type OnboardingTourState = null | OnboardingTourStateValue

interface OnboardingTourStateValue {
  // Position of the current card in the deck; transition steps are not entries.
  deckIndex: number
  scenarioId: OnboardingScenarioId
  // Deck entries dropped for the rest of the tour (see `skipOnboardingStep`).
  skippedDeckIndexes: number[]
}

// Direction of the last step change. Visualizations are forward-only: the exit
// transition starts only from `goToNextOnboardingStep`, which sets this to 'forward'.
export const onboardingStepDirectionAtom = atom<'backward' | 'forward'>(
  'forward',
  'onboardingStepDirectionAtom',
)

export const onboardingTourAtom = atom<OnboardingTourState>(null, 'onboardingTourAtom')

// Position of the visualization playing as the current card's exit transition; `null`
// while the tour rests on a card.
export const onboardingExitStepIndexAtom = atom<null | number>(null, 'onboardingExitStepIndexAtom')

// Position of the entry transition playing as the current card's entry; `null` while
// the tour rests on a card (the lead-up has landed).
export const onboardingEntryStepIndexAtom = atom<null | number>(
  null,
  'onboardingEntryStepIndexAtom',
)

export const startOnboardingTour = action(
  (ctx, scenarioId: OnboardingScenarioId, pathname: string) => {
    const deck = resolveTourDeck(scenarioId)
    // A release without user-visible novelties ships an empty whats-new scenario:
    // it never starts a tour, so no phantom state is left behind.
    if (deck.length === 0) return

    onboardingTargetRectsAtom(ctx, {})
    onboardingStepDirectionAtom(ctx, 'forward')
    onboardingExitStepIndexAtom(ctx, null)

    const { deckIndex, skippedDeckIndexes } = resolveTourStart(
      scenariosById[scenarioId],
      deck,
      pathname,
    )
    onboardingEntryStepIndexAtom(ctx, resolveEntryStartIndex(deck[deckIndex]))
    onboardingTourAtom(ctx, { deckIndex, scenarioId, skippedDeckIndexes })
  },
  'startOnboardingTour',
)

export const goToNextOnboardingStep = action(ctx => {
  const tour = ctx.get(onboardingTourAtom)
  if (!tour) return

  onboardingStepDirectionAtom(ctx, 'forward')
  const deck = resolveTourDeck(tour.scenarioId)
  const entry = deck[tour.deckIndex]

  // Forward departure plays the card's exit visualizations in order first; each call
  // advances one exit step, and the last one falls through to the deck advance.
  if (entry !== undefined && entry.exitStepIndexes.length > 0) {
    const exitIndex = ctx.get(onboardingExitStepIndexAtom)
    if (exitIndex === null) {
      onboardingExitStepIndexAtom(ctx, 0)
      return
    }
    if (exitIndex + 1 < entry.exitStepIndexes.length) {
      onboardingExitStepIndexAtom(ctx, exitIndex + 1)
      return
    }
  }

  const nextIndex = findNearestDeckIndex(deck, tour.skippedDeckIndexes, tour.deckIndex, 1)
  onboardingExitStepIndexAtom(ctx, null)
  if (nextIndex === undefined) return

  // Arriving at a card forward starts its entry transition phase; when the card's
  // screen is already reached, the phase skips itself instantly.
  onboardingEntryStepIndexAtom(ctx, resolveEntryStartIndex(deck[nextIndex]))
  onboardingTourAtom(ctx, { ...tour, deckIndex: nextIndex })
}, 'goToNextOnboardingStep')

// «Назад» always lands on the previous card: transitions are not entries, so they are
// never revisited and never replay.
export const goToPrevOnboardingStep = action(ctx => {
  const tour = ctx.get(onboardingTourAtom)
  if (!tour) return

  const deck = resolveTourDeck(tour.scenarioId)
  const prevIndex = findNearestDeckIndex(deck, tour.skippedDeckIndexes, tour.deckIndex, -1)
  if (prevIndex === undefined) return

  onboardingStepDirectionAtom(ctx, 'backward')
  onboardingExitStepIndexAtom(ctx, null)
  onboardingEntryStepIndexAtom(ctx, null)
  onboardingTourAtom(ctx, { ...tour, deckIndex: prevIndex })
}, 'goToPrevOnboardingStep')

export const endOnboardingTour = action(ctx => {
  onboardingTourAtom(ctx, null)
  onboardingExitStepIndexAtom(ctx, null)
  onboardingEntryStepIndexAtom(ctx, null)
  onboardingTargetRectsAtom(ctx, {})
}, 'endOnboardingTour')

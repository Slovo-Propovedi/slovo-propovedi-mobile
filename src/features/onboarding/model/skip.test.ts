import { createCtx } from '@reatom/framework'
import { type OnboardingScenario, scenariosById } from '../lib/scenarios'
import { buildTourDeck } from '../lib/tourDeck'
import { skipOnboardingStep } from './skip'
import {
  onboardingEntryStepIndexAtom,
  onboardingExitStepIndexAtom,
  onboardingTourAtom,
} from './tour'

const SCENARIO_ID = 'backup'
const originalScenario = scenariosById[SCENARIO_ID]
const FIRST_CARD = 'fixture.first'
const MIDDLE_CARD = 'fixture.middle'
const LAST_CARD = 'fixture.last'

// Three cards; the trailing ones are hidden `skipIfMissing` targets. Skipping forward
// from the middle card therefore runs off the deck boundary.
const skipScenario: OnboardingScenario = {
  description: '',
  icon: 'information-circle-outline',
  id: SCENARIO_ID,
  steps: [
    { targetId: FIRST_CARD, text: '', title: 'Первая' },
    { skipIfMissing: true, targetId: MIDDLE_CARD, text: '', title: 'Средняя' },
    { skipIfMissing: true, targetId: LAST_CARD, text: '', title: 'Последняя' },
  ],
  title: '',
}

const SKIP_DECK = buildTourDeck(skipScenario.steps)
const MIDDLE_DECK_INDEX = 1
const LAST_DECK_INDEX = SKIP_DECK.length - 1

describe('skipOnboardingStep at the deck boundary', () => {
  beforeEach(() => {
    scenariosById[SCENARIO_ID] = skipScenario
  })

  afterEach(() => {
    scenariosById[SCENARIO_ID] = originalScenario
  })

  test('skipping forward past a hidden last card ends the tour', () => {
    const ctx = createCtx()
    onboardingTourAtom(ctx, {
      deckIndex: MIDDLE_DECK_INDEX,
      scenarioId: SCENARIO_ID,
      skippedDeckIndexes: [LAST_DECK_INDEX],
    })
    onboardingEntryStepIndexAtom(ctx, 0)
    onboardingExitStepIndexAtom(ctx, 0)

    skipOnboardingStep(ctx, 'next')

    expect(ctx.get(onboardingTourAtom)).toBeNull()
    expect(ctx.get(onboardingEntryStepIndexAtom)).toBeNull()
    expect(ctx.get(onboardingExitStepIndexAtom)).toBeNull()
  })

  test('skipping backward from the first card ends the tour', () => {
    const ctx = createCtx()
    onboardingTourAtom(ctx, { deckIndex: 0, scenarioId: SCENARIO_ID, skippedDeckIndexes: [] })
    onboardingEntryStepIndexAtom(ctx, 0)
    onboardingExitStepIndexAtom(ctx, 0)

    skipOnboardingStep(ctx, 'back')

    expect(ctx.get(onboardingTourAtom)).toBeNull()
    expect(ctx.get(onboardingEntryStepIndexAtom)).toBeNull()
    expect(ctx.get(onboardingExitStepIndexAtom)).toBeNull()
  })

  test('skipping mid-deck still lands on the surviving neighbor', () => {
    const ctx = createCtx()
    onboardingTourAtom(ctx, { deckIndex: 0, scenarioId: SCENARIO_ID, skippedDeckIndexes: [] })

    skipOnboardingStep(ctx, 'next')

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: MIDDLE_DECK_INDEX,
      scenarioId: SCENARIO_ID,
      skippedDeckIndexes: [0],
    })
  })
})

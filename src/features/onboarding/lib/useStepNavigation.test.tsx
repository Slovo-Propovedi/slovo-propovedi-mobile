import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { type OnboardingTargetRect, onboardingTargetRectsAtom } from '../model/targets'
import {
  onboardingExitStepIndexAtom,
  onboardingStepDirectionAtom,
  onboardingTourAtom,
} from '../model/tour'
import { type OnboardingScenario, scenariosById } from './scenarios'
import { registerTourAction, unregisterTourAction } from './tourActions'
import { buildTourDeck } from './tourDeck'
import { useStepNavigation } from './useStepNavigation'

jest.mock('expo-router', () => ({
  usePathname: () => '/listen',
  useRouter: () => ({ navigate: jest.fn() }),
}))

const ROW_ACTION = 'open-playlist-row-menu'
const TARGET_RECT: OnboardingTargetRect = { height: 4, width: 3, x: 1, y: 2 }

const renderNavigation = (
  scenario: OnboardingScenario,
  deckIndex: number,
  rects: Record<string, Record<string, OnboardingTargetRect>> = {},
  setup?: (ctx: ReturnType<typeof createCtx>) => void,
) => {
  const ctx = createCtx()
  const deck = buildTourDeck(scenario.steps)
  const entry = deck[deckIndex]
  onboardingTourAtom(ctx, { deckIndex, scenarioId: scenario.id, skippedDeckIndexes: [] })
  onboardingTargetRectsAtom(ctx, rects)
  setup?.(ctx)

  return renderHookWithProviders(
    () =>
      useStepNavigation({
        bottomInset: 0,
        cardStep: scenario.steps[entry.cardIndex],
        deckIndex,
        entry,
        isLastVisible: deckIndex === deck.length - 1,
        isTourActive: true,
        scenario,
        stepKey: `${scenario.id}:${deckIndex}`,
        viewportHeight: 800,
      }),
    { ctx },
  )
}

describe('useStepNavigation exit transitions', () => {
  afterEach(() => {
    unregisterTourAction(ROW_ACTION)
  })

  test('blinks on the exit target, performs the action and advances the deck', async () => {
    const action = jest.fn()
    registerTourAction(ROW_ACTION, action)

    const { ctx, result } = await renderNavigation(
      scenariosById['playlist-add'],
      0,
      { 'playlist.first-row': { 'instance-1': TARGET_RECT } },
      setupCtx => onboardingExitStepIndexAtom(setupCtx, 0),
    )

    // The blink replaces the overlay: navigation is held and the action is not run yet.
    expect(result.current.holdNavigation).toBe(true)
    expect(action).not.toHaveBeenCalled()

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1), { timeout: 4500 })
    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 1,
          scenarioId: 'playlist-add',
          skippedDeckIndexes: [],
        }),
      { timeout: 4500 },
    )
    expect(ctx.get(onboardingExitStepIndexAtom)).toBeNull()
  })

  test('performs a targetless visualization immediately and advances', async () => {
    const action = jest.fn()
    registerTourAction('type-search-query', action)

    // A synthetic scenario whose card owns a targetless visualization (no blink).
    const targetlessScenario: OnboardingScenario = {
      description: '',
      icon: 'information-circle-outline',
      id: 'share',
      steps: [
        { text: '', title: 'Интро' },
        { tapActionId: 'type-search-query', text: '', title: 'Без цели' },
        { targetId: 'listen.sections', text: '', title: 'Карточка' },
      ],
      title: '',
    }
    const originalScenario = scenariosById.share
    scenariosById.share = targetlessScenario

    try {
      const { ctx } = await renderNavigation(targetlessScenario, 0, {}, setupCtx =>
        onboardingExitStepIndexAtom(setupCtx, 0),
      )

      await waitFor(() => expect(action).toHaveBeenCalledTimes(1), { timeout: 2000 })
      await waitFor(() => expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(1), { timeout: 2000 })
    } finally {
      scenariosById.share = originalScenario
      unregisterTourAction('type-search-query')
    }
  })
})

describe('useStepNavigation card navigation', () => {
  test('goNext advances the deck when the card has no visualizations', async () => {
    const { ctx, result } = await renderNavigation(scenariosById['playlist-add'], 2)

    await act(async () => {
      result.current.goNext()
    })

    expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(3)
  })

  test('goNext ends the tour on the last card without visualizations', async () => {
    const { ctx, result } = await renderNavigation(scenariosById['playlist-add'], 4)

    await act(async () => {
      result.current.goNext()
    })

    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })

  test('goNext starts the exit transition on the last card with visualizations', async () => {
    // player deck: card 2 is the last card and owns the «expand player» visualization.
    const { ctx, result } = await renderNavigation(scenariosById.player, 2)

    await act(async () => {
      result.current.goNext()
    })

    expect(ctx.get(onboardingExitStepIndexAtom)).toBe(0)
    expect(ctx.get(onboardingTourAtom)).not.toBeNull()
  })

  test('a card entered backward is shown statically, without performing anything', async () => {
    const action = jest.fn()
    registerTourAction(ROW_ACTION, action)

    const { ctx, result } = await renderNavigation(scenariosById['playlist-add'], 1, {}, setupCtx =>
      onboardingStepDirectionAtom(setupCtx, 'backward'),
    )

    expect(result.current.holdNavigation).toBe(false)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
    })

    expect(action).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(1)
  })
})

describe('useStepNavigation skipIfMissing cards', () => {
  const PLAYLIST_MENU = scenariosById['playlist-menu']

  test('skips forward a hidden card whose target never registers', async () => {
    // playlist-menu deck index 1 is the `skipIfMissing` «share» card.
    const { ctx } = await renderNavigation(PLAYLIST_MENU, 1)

    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 2,
          scenarioId: 'playlist-menu',
          skippedDeckIndexes: [1],
        }),
      { timeout: 2000 },
    )
  })

  test('skips a hidden card instantly when a sibling target has registered', async () => {
    const { ctx } = await renderNavigation(PLAYLIST_MENU, 1, {
      'playlist.menu-add-all': { 'instance-1': TARGET_RECT },
    })

    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 2,
          scenarioId: 'playlist-menu',
          skippedDeckIndexes: [1],
        }),
      { timeout: 300 },
    )
  })

  test('holds the missing-target window while no target has registered yet', async () => {
    const { ctx } = await renderNavigation(PLAYLIST_MENU, 1)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 250))
    })

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 1,
      scenarioId: 'playlist-menu',
      skippedDeckIndexes: [],
    })
  })

  test('does not skip a hidden-capable card whose target is registered', async () => {
    const { ctx } = await renderNavigation(PLAYLIST_MENU, 1, {
      'playlist.menu-share': { 'instance-1': TARGET_RECT },
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
    })

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 1,
      scenarioId: 'playlist-menu',
      skippedDeckIndexes: [],
    })
  })

  test('skips a hidden card backward when the user navigated back onto it', async () => {
    const ctx = createCtx()
    const scenario = PLAYLIST_MENU
    const deck = buildTourDeck(scenario.steps)
    onboardingTourAtom(ctx, { deckIndex: 1, scenarioId: 'playlist-menu', skippedDeckIndexes: [] })

    const { rerender } = await renderHookWithProviders(
      ({ index }: { index: number }) => {
        const entry = deck[index]

        return useStepNavigation({
          bottomInset: 0,
          cardStep: scenario.steps[entry.cardIndex],
          deckIndex: index,
          entry,
          isLastVisible: index === deck.length - 1,
          isTourActive: true,
          scenario,
          stepKey: `playlist-menu:${index}`,
          viewportHeight: 800,
        })
      },
      { ctx, initialProps: { index: 1 } },
    )

    await rerender({ index: 2 })
    await rerender({ index: 1 })

    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 0,
          scenarioId: 'playlist-menu',
          skippedDeckIndexes: [1],
        }),
      { timeout: 2000 },
    )
  })

  test('a skipped card never plays its exit visualization', async () => {
    const action = jest.fn()
    registerTourAction('hidden-action', action)
    const scenario: OnboardingScenario = {
      description: '',
      icon: 'information-circle-outline',
      id: 'player-description',
      steps: [
        { skipIfMissing: true, targetId: 'missing', text: '', title: '' },
        { tapActionId: 'hidden-action', tapTargetId: 'missing-target', text: '', title: '' },
        { text: '', title: '' },
      ],
      title: '',
    }

    const { ctx } = await renderNavigation(scenario, 0)

    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 1,
          scenarioId: 'player-description',
          skippedDeckIndexes: [0],
        }),
      { timeout: 2000 },
    )
    expect(action).not.toHaveBeenCalled()

    unregisterTourAction('hidden-action')
  })
})

describe('useStepNavigation desktop-web-only cards', () => {
  // whatsNew deck index 2 is the «Кнопка «Обновить»» card: its target renders only on
  // desktop web, so every other platform drops the card from the deck.
  const WHATS_NEW = scenariosById.whatsNew
  const REFRESH_DECK_INDEX = 2

  test('drops the refresh card when its target is absent', async () => {
    const { ctx } = await renderNavigation(WHATS_NEW, REFRESH_DECK_INDEX, {
      'listen.sections': { 'instance-1': TARGET_RECT },
    })

    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: REFRESH_DECK_INDEX + 1,
          scenarioId: 'whatsNew',
          skippedDeckIndexes: [REFRESH_DECK_INDEX],
        }),
      { timeout: 300 },
    )
  })

  test('keeps the refresh card while its target is registered', async () => {
    const { ctx } = await renderNavigation(WHATS_NEW, REFRESH_DECK_INDEX, {
      'listen.refresh-button': { 'instance-1': TARGET_RECT },
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
    })

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: REFRESH_DECK_INDEX,
      scenarioId: 'whatsNew',
      skippedDeckIndexes: [],
    })
  })
})

import { createCtx } from '@reatom/framework'
import { act, fireEvent, type screen, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { currentAudioAtom } from 'entities/player/@x/onboarding'
import { dynamicSectionsAtom } from 'entities/section'
import { renderWithProviders } from 'shared/mocks'
import { registerTourAction, unregisterTourAction } from '../lib/tourActions'
import {
  type OnboardingTargetRect,
  onboardingTargetRectsAtom,
  registerOnboardingTargetRect,
} from '../model/targets'
import { endOnboardingTour, onboardingEntryStepIndexAtom, onboardingTourAtom } from '../model/tour'
import { OnboardingTourOverlay } from './OnboardingTourOverlay'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: (props: object) => <View {...props} />,
    Mask: (props: object) => <View {...props} />,
    Rect: (props: object) => <View {...props} />,
  }
})

jest.mock('./TapIndicator', () => {
  const { Text } = jest.requireActual('react-native')

  return { TapIndicator: () => <Text>tap-indicator</Text> }
})

jest.mock('./TourDim', () => {
  const { Text, View } = jest.requireActual('react-native')

  return {
    TourDim: ({ holes }: { holes: Array<{ x: number; y: number }> }) => (
      <View>
        <Text>tour-dim</Text>
        {holes.map(hole => (
          <Text key={`${hole.x}-${hole.y}`}>{`hole:${hole.x},${hole.y}`}</Text>
        ))}
      </View>
    ),
  }
})

const mockNavigate = jest.fn()
const mockPathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ navigate: mockNavigate }),
}))

const AUDIO = {
  artist: 'Проповедник',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Проповедь',
}
const NEXT_LABEL = 'Далее'
const DONE_LABEL = 'Готово'
const BACK_LABEL = 'Назад'
const HINT = 'Выполните действие, чтобы продолжить'
const TAP_INDICATOR = 'tap-indicator'
const DIM = 'tour-dim'
const MISSING_TARGET_TIMEOUT_MS = 1200
const TAP_PHASE_TIMEOUT_MS = 3500
const EXIT_FLOW_TIMEOUT_MS = 5500
const HOLD_TIMEOUT_MS = 1200
const SECTIONS_RECT: OnboardingTargetRect = { height: 4, width: 3, x: 1, y: 2 }
// A target id maps to a per-instance map; fixtures seed a single literal instance.
const instances = (rect: OnboardingTargetRect) => ({ 'instance-1': rect })
const OFFSCREEN_RECT: OnboardingTargetRect = { height: 60, width: 300, x: 0, y: 99999 }
const SETTINGS_ITEM_RECT: OnboardingTargetRect = { height: 60, width: 90, x: 300, y: 760 }
const EDGE_BACK_RECT: OnboardingTargetRect = { height: 400, width: 64, x: 0, y: 100 }
const EDGE_FORWARD_RECT: OnboardingTargetRect = { height: 400, width: 64, x: 336, y: 100 }
const PLAYLIST_ROW_RECT: OnboardingTargetRect = { height: 80, width: 320, x: 0, y: 400 }
const PLAYLIST_FIRST_ROW = 'playlist.first-row'
const PLAYLIST_ROW_MENU_ADD = 'playlist.row-menu-add'
const PLAYLIST_ADD_ROW_ACTION = 'open-playlist-row-menu'
const PLAYER_EXPAND_ACTION = 'expand-player'
const AREA_HIGHLIGHT = 'onboarding-area-highlight'
const TOUR_MODAL = 'onboarding-tour-modal'
const TAP_MODAL = 'onboarding-tap-modal'

// Walks up from a card node to the absolutely-positioned pass-through card and
// reads the `top` anchoring offset set from the active target's hole.
const findAnchoredCardTop = (node: ReturnType<typeof screen.getByText>) => {
  let current = node.parent

  while (current !== null) {
    const style = StyleSheet.flatten(current.props.style)
    if (style?.position === 'absolute' && typeof style.top === 'number') return style.top
    current = current.parent
  }

  return null
}

const renderAtDeck = (
  scenarioId:
    | 'listen'
    | 'player-intro'
    | 'player'
    | 'playlist-add'
    | 'playlist-menu'
    | 'playlists'
    | 'search'
    | 'settings',
  deckIndex: number,
  rects: Record<string, Record<string, OnboardingTargetRect>> = {},
  setup?: (ctx: ReturnType<typeof createCtx>) => void,
) => {
  const ctx = createCtx()
  onboardingTourAtom(ctx, { deckIndex, scenarioId, skippedDeckIndexes: [] })
  onboardingTargetRectsAtom(ctx, rects)
  setup?.(ctx)

  return renderWithProviders(<OnboardingTourOverlay />, { ctx })
}

describe('<OnboardingTourOverlay>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/listen')
  })

  test('renders nothing without an active tour', async () => {
    const { queryByText } = await renderWithProviders(<OnboardingTourOverlay />)

    expect(queryByText(NEXT_LABEL)).toBeNull()
  })

  test('renders the current card with next and close controls when the rect is ready', async () => {
    const { getByRole, getByText } = await renderAtDeck('listen', 0, {
      'listen.sections': instances(SECTIONS_RECT),
    })

    expect(getByText('Разделы проповедей')).toBeTruthy()
    expect(
      getByText(
        'Горизонтальные подборки: разделы — например, «По Библии», «По темам». Листайте вбок.',
      ),
    ).toBeTruthy()
    expect(getByText(NEXT_LABEL)).toBeTruthy()
    expect(getByRole('button', { name: 'Завершить обзор' })).toBeTruthy()
  })

  test('substitutes the live section titles into the sections card text', async () => {
    const { getByText } = await renderAtDeck(
      'listen',
      0,
      { 'listen.sections': instances(SECTIONS_RECT) },
      ctx =>
        dynamicSectionsAtom(ctx, [
          { itemsSize: 'middle', title: 'По Библии', transform: 'middle' },
          { itemsSize: 'middle', title: 'По темам', transform: 'middle' },
        ]),
    )

    expect(
      getByText('Горизонтальные подборки: разделы «По Библии», «По темам». Листайте вбок.'),
    ).toBeTruthy()
  })

  test('renders a targetless card with a back button on its inherited route', async () => {
    mockPathname.mockReturnValue('/listen/my-playlists')

    const { getByText } = await renderAtDeck('playlists', 2)

    expect(getByText('Добавить проповедь')).toBeTruthy()
    expect(getByText(BACK_LABEL)).toBeTruthy()
  })

  test('shows the done label on the last card', async () => {
    mockPathname.mockReturnValue('/listen/my-playlists')

    const { getByText, queryByText } = await renderAtDeck('playlists', 2)

    expect(getByText(DONE_LABEL)).toBeTruthy()
    expect(queryByText(NEXT_LABEL)).toBeNull()
  })

  test('ends the tour when the primary button is pressed on the last card', async () => {
    mockPathname.mockReturnValue('/listen/my-playlists')

    const { ctx, getByText } = await renderAtDeck('playlists', 2)

    fireEvent.press(getByText(DONE_LABEL))

    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })

  test('advances to the next card when the primary button is pressed on a non-last card', async () => {
    const { ctx, getByText } = await renderAtDeck('listen', 0, {
      'listen.sections': instances(SECTIONS_RECT),
    })

    fireEvent.press(getByText(NEXT_LABEL))

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 1,
      scenarioId: 'listen',
      skippedDeckIndexes: [],
    })
  })

  test('counts only cards in the step counter', async () => {
    // playlist-add has seven steps but only five cards (two are exit visualizations).
    const { getByText } = await renderAtDeck('playlist-add', 0, {
      [PLAYLIST_FIRST_ROW]: instances(PLAYLIST_ROW_RECT),
    })

    expect(getByText('Шаг 1 из 5')).toBeTruthy()
  })

  test('navigates to the card route when the pathname differs', async () => {
    mockPathname.mockReturnValue('/settings')

    await renderAtDeck('settings', 0)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/more'), {
      timeout: HOLD_TIMEOUT_MS,
    })
  })

  test('renders nothing while the router is moving to the effective route', async () => {
    mockPathname.mockReturnValue('/listen')

    const { queryByText } = await renderAtDeck('playlists', 2)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/listen/my-playlists'))
    expect(queryByText('Добавить проповедь')).toBeNull()
  })

  test('blinks the tap hint inside its own modal before navigating', async () => {
    mockPathname.mockReturnValue('/settings')

    const { getByTestId, getByText, queryByText } = await renderAtDeck('settings', 0, {
      'more.settings-item': instances(SETTINGS_ITEM_RECT),
    })

    // The blink is presented in a Modal (a fresh native window above app overlays):
    // the hint shows inside it, the dim/tooltip do not.
    expect(getByTestId(TAP_MODAL)).toBeTruthy()
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
    expect(queryByText(NEXT_LABEL)).toBeNull()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/more'), {
      timeout: TAP_PHASE_TIMEOUT_MS,
    })
  })

  test('presents a card exit visualization blink inside the keyed modal', async () => {
    const { getByTestId, getByText } = await renderAtDeck('playlist-add', 0, {
      [PLAYLIST_FIRST_ROW]: instances(PLAYLIST_ROW_RECT),
    })

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(getByTestId(TAP_MODAL)).toBeTruthy())
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
  })

  test('holds navigation for a declared tap target until its rect registers, then blinks', async () => {
    mockPathname.mockReturnValue('/settings')

    const { ctx, queryByTestId, queryByText } = await renderAtDeck('settings', 0)

    // No rect yet: navigation is held and no blink plays.
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(queryByText(TAP_INDICATOR)).toBeNull()
    expect(queryByTestId(TAP_MODAL)).toBeNull()

    await act(async () => {
      registerOnboardingTargetRect(ctx, {
        id: 'more.settings-item',
        instanceId: 'instance-1',
        rect: SETTINGS_ITEM_RECT,
      })
    })

    await waitFor(() => expect(queryByTestId(TAP_MODAL)).toBeTruthy())
    await waitFor(() => expect(queryByText(TAP_INDICATOR)).toBeTruthy())
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/more'), {
      timeout: TAP_PHASE_TIMEOUT_MS,
    })
  })

  test('navigates without a blink when the declared tap target never registers', async () => {
    mockPathname.mockReturnValue('/settings')

    const { queryByText } = await renderAtDeck('settings', 0)

    expect(queryByText(TAP_INDICATOR)).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/more'), {
      timeout: HOLD_TIMEOUT_MS,
    })
    expect(queryByText(TAP_INDICATOR)).toBeNull()
  })

  test('cancels the tap phase without navigating when the user reaches the route first', async () => {
    mockPathname.mockReturnValue('/settings')

    const { getByText, queryByText, rerender } = await renderAtDeck('settings', 0, {
      'more.settings-item': instances(SETTINGS_ITEM_RECT),
    })

    expect(getByText(TAP_INDICATOR)).toBeTruthy()

    mockPathname.mockReturnValue('/more')
    await act(async () => {
      rerender(<OnboardingTourOverlay />)
    })

    expect(queryByText(TAP_INDICATOR)).toBeNull()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('clears the tap phase when the tour ends', async () => {
    mockPathname.mockReturnValue('/settings')

    const { ctx, getByText, queryByText } = await renderAtDeck('settings', 0, {
      'more.settings-item': instances(SETTINGS_ITEM_RECT),
    })

    expect(getByText(TAP_INDICATOR)).toBeTruthy()

    await act(async () => {
      endOnboardingTour(ctx)
    })

    await waitFor(() => expect(queryByText(TAP_INDICATOR)).toBeNull())
  })

  test('shows the real card count and the done label when trailing menu cards are absent', async () => {
    const MENU_RECT: OnboardingTargetRect = { height: 40, width: 200, x: 10, y: 300 }

    // A server playlist hides publish/clear/delete, so three menu cards are dropped and
    // the interactive sermon-menu card is the last visible one: 7 cards of 7.
    const { getByText, queryByText } = await renderAtDeck('playlist-menu', 9, {
      'playlist.menu-add-all': instances(MENU_RECT),
      'playlist.menu-history-mark': instances(MENU_RECT),
      'playlist.menu-offline-add': instances(MENU_RECT),
      'playlist.menu-offline-remove': instances(MENU_RECT),
      'playlist.menu-share': instances(MENU_RECT),
    })

    expect(getByText('Шаг 7 из 7')).toBeTruthy()
    expect(getByText(DONE_LABEL)).toBeTruthy()
    expect(queryByText(NEXT_LABEL)).toBeNull()
  })

  test('renders a centered card when the registered rect is below the viewport', async () => {
    const { getByText } = await renderAtDeck('listen', 2, {
      'listen.my-playlists': instances(OFFSCREEN_RECT),
    })

    expect(getByText('Мои плейлисты')).toBeTruthy()
  })

  test('blocks the app under a registered area card with a spotlight modal', async () => {
    const { getAllByTestId, getByTestId, getByText } = await renderAtDeck('player-intro', 0, {
      'player-fullscreen.edge-back': instances(EDGE_BACK_RECT),
      'player-fullscreen.edge-forward': instances(EDGE_FORWARD_RECT),
    })

    expect(getByTestId(TOUR_MODAL)).toBeTruthy()
    expect(getAllByTestId(AREA_HIGHLIGHT)).toHaveLength(2)
    expect(getByText(DIM)).toBeTruthy()
    expect(getByText('hole:0,100')).toBeTruthy()
    expect(getByText('hole:336,100')).toBeTruthy()
    expect(getByText('Края экрана')).toBeTruthy()
    expect(getByText(NEXT_LABEL)).toBeTruthy()
  })

  test('advances from an area card when the primary button is pressed', async () => {
    const { ctx, getByText } = await renderAtDeck('player-intro', 0, {
      'player-fullscreen.edge-back': instances(EDGE_BACK_RECT),
      'player-fullscreen.edge-forward': instances(EDGE_FORWARD_RECT),
    })

    fireEvent.press(getByText(NEXT_LABEL))

    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 1,
      scenarioId: 'player-intro',
      skippedDeckIndexes: [],
    })
  })

  test('renders the area card centered while no area rect has registered', async () => {
    const { getByTestId, getByText, queryAllByTestId, queryByText } = await renderAtDeck(
      'player-intro',
      0,
    )

    expect(getByTestId(TOUR_MODAL)).toBeTruthy()
    expect(queryAllByTestId(AREA_HIGHLIGHT)).toHaveLength(0)
    expect(getByText('Края экрана')).toBeTruthy()
    expect(getByText(DIM)).toBeTruthy()
    expect(queryByText(/^hole:/)).toBeNull()
  })

  test('cuts a hole only for the registered area rects of the card', async () => {
    const { getAllByTestId, getByText, queryByText } = await renderAtDeck('player-intro', 0, {
      'player-fullscreen.edge-back': instances(EDGE_BACK_RECT),
    })

    expect(getAllByTestId(AREA_HIGHLIGHT)).toHaveLength(1)
    expect(getByText('hole:0,100')).toBeTruthy()
    expect(queryByText('hole:336,100')).toBeNull()
  })

  test('spotlights the sermon-row ⋯ menu on the final search card', async () => {
    const MENU_RECT: OnboardingTargetRect = { height: 40, width: 40, x: 300, y: 400 }
    const { getByTestId, getByText, queryByTestId, queryByText } = await renderAtDeck('search', 6, {
      'search-results.first-sermon-menu': instances(MENU_RECT),
    })

    expect(getByTestId(TOUR_MODAL)).toBeTruthy()
    expect(getByText('Меню проповеди')).toBeTruthy()
    expect(getByText(DONE_LABEL)).toBeTruthy()
    expect(getByText(DIM)).toBeTruthy()
    expect(getByText('hole:300,400')).toBeTruthy()
    expect(queryByTestId(TAP_MODAL)).toBeNull()
    expect(queryByText(TAP_INDICATOR)).toBeNull()
  })

  test('closes the playlist picker on entering the final search card', async () => {
    const action = jest.fn()
    registerTourAction('close-sermon-playlist-picker', action)

    const MENU_RECT: OnboardingTargetRect = { height: 40, width: 40, x: 300, y: 400 }
    await renderAtDeck('search', 6, { 'search-results.first-sermon-menu': instances(MENU_RECT) })

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
    unregisterTourAction('close-sermon-playlist-picker')
  })

  test('presents the playlist-picker card as a spotlight above the app modal', async () => {
    const PICKER_RECT: OnboardingTargetRect = { height: 200, width: 320, x: 40, y: 300 }
    const { getAllByTestId, getByTestId, getByText } = await renderAtDeck('search', 5, {
      'search.picker-modal': instances(PICKER_RECT),
    })

    expect(getByTestId(TOUR_MODAL)).toBeTruthy()
    expect(getByText('Выберите плейлист')).toBeTruthy()
    expect(getByText(NEXT_LABEL)).toBeTruthy()
    expect(getByText(DIM)).toBeTruthy()
    // The picker window is cut out of the dim and marked with a translucent fill,
    // so the dialog the tour points at stays visible.
    expect(getByText('hole:40,300')).toBeTruthy()
    expect(getAllByTestId(AREA_HIGHLIGHT)).toHaveLength(1)
  })

  test('blinks the search lead-up tab entry from a foreign screen before navigating', async () => {
    mockPathname.mockReturnValue('/more')

    const { getByTestId, getByText } = await renderAtDeck(
      'search',
      1,
      { 'tab.listen': instances(SECTIONS_RECT) },
      ctx => onboardingEntryStepIndexAtom(ctx, 0),
    )

    await waitFor(() => expect(getByTestId(TAP_MODAL)).toBeTruthy())
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/listen'), {
      timeout: TAP_PHASE_TIMEOUT_MS,
    })
  })

  test('skips the search lead-up tab entry when the tour starts on «Слушать»', async () => {
    const { ctx, queryByTestId, queryByText } = await renderAtDeck(
      'search',
      1,
      { 'tab.listen': instances(SECTIONS_RECT) },
      setupCtx => onboardingEntryStepIndexAtom(setupCtx, 0),
    )

    // On «Слушать» the whole entry phase skips itself: no tab blink, straight to the card.
    await waitFor(() => expect(ctx.get(onboardingEntryStepIndexAtom)).toBeNull())
    expect(queryByTestId(TAP_MODAL)).toBeNull()
    expect(queryByText(TAP_INDICATOR)).toBeNull()
  })

  test('blinks the tab entry in the same window after departing the intro card on /more', async () => {
    // Regression: the card → hint handoff must not swap native Modals, or the blink is
    // dropped and the user only sees the navigation. Departing the intro card forward
    // starts the tab entry phase directly (no intermediate hidden render).
    mockPathname.mockReturnValue('/more')

    const { getByTestId, getByText, queryByTestId } = await renderAtDeck('search', 0, {
      'tab.listen': instances(SECTIONS_RECT),
    })

    expect(getByTestId(TOUR_MODAL)).toBeTruthy()

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(getByTestId(TAP_MODAL)).toBeTruthy())
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
    expect(queryByTestId(TOUR_MODAL)).toBeNull()
  })

  test('blinks the search-toggle exit visualization before opening the search', async () => {
    const { getByTestId, getByText } = await renderAtDeck('search', 1, {
      'listen.search-toggle': instances(SECTIONS_RECT),
      'tab.listen': instances(SECTIONS_RECT),
    })

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(getByTestId(TAP_MODAL)).toBeTruthy())
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
  })

  test('shows the typing card while the query types, advancing only on «Далее»', async () => {
    const calls: string[] = []
    registerTourAction('open-listen-search', () => calls.push('open'))
    registerTourAction('type-search-query', () => calls.push('type'))

    const { ctx, getByText } = await renderAtDeck('search', 1, {
      'listen.search-toggle': instances(SECTIONS_RECT),
      'tab.listen': instances(SECTIONS_RECT),
    })

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    // The search-toggle exit blinks and opens the search, then the deck lands on the
    // pass-through «Вводим запрос» card, which fires the typing on enter: the word types
    // in parallel with the visible card.
    await waitFor(() => expect(calls).toEqual(['open', 'type']), {
      timeout: EXIT_FLOW_TIMEOUT_MS,
    })
    await waitFor(() => expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(2), {
      timeout: EXIT_FLOW_TIMEOUT_MS,
    })

    // The card floats over the live UI and does not auto-advance to the groups card:
    // the typing finishes while the card stays put.
    expect(getByText('Вводим запрос')).toBeTruthy()
    expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(2)

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(3))
    expect(calls).toEqual(['open', 'type'])

    unregisterTourAction('open-listen-search')
    unregisterTourAction('type-search-query')
  })

  test('fires the typing card enter action once on activation, not on re-render', async () => {
    const action = jest.fn()
    registerTourAction('type-search-query', action)

    const { ctx, rerender } = await renderAtDeck('search', 2)

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))

    await act(async () => {
      rerender(<OnboardingTourOverlay />)
    })
    expect(action).toHaveBeenCalledTimes(1)
    expect(ctx.get(onboardingTourAtom)?.deckIndex).toBe(2)

    unregisterTourAction('type-search-query')
  })

  test('blinks the first-sermon exit visualization after the «Включить проповедь» card', async () => {
    const { getByTestId, getByText } = await renderAtDeck('search', 4, {
      'search-results.first-sermon': instances(SECTIONS_RECT),
      'search-results.group-sermons': instances(SECTIONS_RECT),
    })

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(getByTestId(TAP_MODAL)).toBeTruthy())
    expect(getByText(TAP_INDICATOR)).toBeTruthy()
  })

  test('keeps an interactive card with a target pass-through and anchors its card to the target', async () => {
    const ROW_RECT: OnboardingTargetRect = { height: 80, width: 320, x: 0, y: 400 }

    const { getByTestId, getByText, queryByTestId, queryByText } = await renderAtDeck(
      'playlist-menu',
      9,
      { 'playlist.first-row': instances(ROW_RECT) },
    )

    expect(queryByTestId(TOUR_MODAL)).toBeNull()
    expect(queryByText(DIM)).toBeNull()
    expect(getByTestId(AREA_HIGHLIGHT)).toBeTruthy()
    expect(getByText('Меню проповеди')).toBeTruthy()
    expect(findAnchoredCardTop(getByText('Меню проповеди'))).toBeLessThan(ROW_RECT.y)
  })

  test('performs the card actionOnEnterId once on activation, not on re-render', async () => {
    const action = jest.fn()
    registerTourAction('close-playlist-menu', action)

    const ROW_RECT: OnboardingTargetRect = { height: 80, width: 320, x: 0, y: 400 }
    const { rerender } = await renderAtDeck('playlist-menu', 9, {
      'playlist.first-row': instances(ROW_RECT),
    })

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1))

    await act(async () => {
      rerender(<OnboardingTourOverlay />)
    })
    expect(action).toHaveBeenCalledTimes(1)

    unregisterTourAction('close-playlist-menu')
  })

  test('keeps the tooltip hidden until the missing-target timeout expires', async () => {
    const { getByText, queryByText } = await renderAtDeck('listen', 0)

    expect(queryByText(NEXT_LABEL)).toBeNull()

    await waitFor(() => expect(getByText(NEXT_LABEL)).toBeTruthy(), {
      timeout: MISSING_TARGET_TIMEOUT_MS * 2,
    })
  })

  test('shows the wait card without a modal dim while the condition is unmet', async () => {
    const { getByRole, getByText, queryByText } = await renderAtDeck('player', 0, {
      'listen.sections': instances(SECTIONS_RECT),
    })

    expect(getByText(HINT)).toBeTruthy()
    expect(getByRole('button', { name: 'Завершить обзор' })).toBeTruthy()
    expect(queryByText(NEXT_LABEL)).toBeNull()
    expect(queryByText(DIM)).toBeNull()
  })

  test('returns the modal with the primary button once the wait condition is satisfied', async () => {
    const { getByText, queryByText } = await renderAtDeck(
      'player',
      0,
      { 'listen.sections': instances(SECTIONS_RECT) },
      ctx => currentAudioAtom(ctx, AUDIO),
    )

    expect(queryByText(HINT)).toBeNull()
    expect(getByText(NEXT_LABEL)).toBeTruthy()
    expect(getByText(DIM)).toBeTruthy()
  })

  test('returns to the intro card when going back from the row-menu card', async () => {
    const action = jest.fn()
    registerTourAction(PLAYLIST_ADD_ROW_ACTION, action)

    const { ctx, getByText } = await renderAtDeck('playlist-add', 1, {
      [PLAYLIST_FIRST_ROW]: instances(PLAYLIST_ROW_RECT),
      [PLAYLIST_ROW_MENU_ADD]: instances(PLAYLIST_ROW_RECT),
    })

    fireEvent.press(getByText(BACK_LABEL))

    await waitFor(() => expect(getByText('Добавление в плейлист')).toBeTruthy())
    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 0,
      scenarioId: 'playlist-add',
      skippedDeckIndexes: [],
    })
    expect(action).not.toHaveBeenCalled()
    unregisterTourAction(PLAYLIST_ADD_ROW_ACTION)
  })

  test('plays the card exit visualization after «Далее» and advances to the next card', async () => {
    const action = jest.fn()
    registerTourAction(PLAYLIST_ADD_ROW_ACTION, action)

    const { ctx, getByText } = await renderAtDeck('playlist-add', 0, {
      [PLAYLIST_FIRST_ROW]: instances(PLAYLIST_ROW_RECT),
    })

    await act(async () => {
      await fireEvent.press(getByText(NEXT_LABEL))
    })

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1), {
      timeout: EXIT_FLOW_TIMEOUT_MS,
    })
    await waitFor(
      () =>
        expect(ctx.get(onboardingTourAtom)).toEqual({
          deckIndex: 1,
          scenarioId: 'playlist-add',
          skippedDeckIndexes: [],
        }),
      { timeout: EXIT_FLOW_TIMEOUT_MS },
    )
    unregisterTourAction(PLAYLIST_ADD_ROW_ACTION)
  })

  test('plays the last card exit visualization and then ends the tour', async () => {
    const action = jest.fn()
    registerTourAction(PLAYER_EXPAND_ACTION, action)

    const { ctx, getByText } = await renderAtDeck(
      'player',
      2,
      {
        'player.mini': instances(PLAYLIST_ROW_RECT),
        'player.mini-play-pause': instances(PLAYLIST_ROW_RECT),
      },
      setupCtx => currentAudioAtom(setupCtx, AUDIO),
    )

    await act(async () => {
      await fireEvent.press(getByText(DONE_LABEL))
    })

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1), {
      timeout: EXIT_FLOW_TIMEOUT_MS,
    })
    await waitFor(() => expect(ctx.get(onboardingTourAtom)).toBeNull(), {
      timeout: EXIT_FLOW_TIMEOUT_MS,
    })
    unregisterTourAction(PLAYER_EXPAND_ACTION)
  })
})

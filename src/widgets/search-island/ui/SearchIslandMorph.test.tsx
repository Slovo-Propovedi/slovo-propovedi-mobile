import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { Dimensions, StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { oneLineBarMorphDriver, tabIslandMorphDriver } from 'widgets/tab-bar/@x/morph'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { advanceMorphFrames } from 'shared/mocks/morphFrames'
import {
  isBarCollapsedAtom,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
  tabBarHeightAtom,
} from 'shared/ui/layout'
import { getSearchIslandGeometry } from '../lib/getSearchIslandGeometry'
import { searchCloseMorphDriver } from '../model/searchCloseDriver'
import { searchFocusMorphDriver } from '../model/searchFocusDriver'
import { searchOpenMorphDriver } from '../model/searchOpenDriver'
import { SearchIslandMorph } from './SearchIslandMorph'

// Jest hoists mock factories above imports, so the factory may only reference
// `mock`-prefixed bindings. This alias keeps the namespace import intact.
const mockCreateDistinctValuesResponse =
  sermonsMocks.getSermonControllerGetDistinctValuesResponseMock

// The magnifier is a vector-font glyph: its `size` prop is the contract under
// test, and host elements only expose the rendered Text, not the icon props.
const mockIoniconsSpy = jest.fn()

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Ionicons: (props: { name: string }) => {
      mockIoniconsSpy(props)

      return <Text>{props.name}</Text>
    },
  }
})

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest
        .fn()
        .mockResolvedValue(mockCreateDistinctValuesResponse()),
    }),
  },
}))

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: (props: Record<string, unknown>) => <View {...props} /> }
})

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
}
const mockPathname = '/'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}))

const SEARCH_PLACEHOLDER = 'Проповеди, проповедники, название книги'
const SEARCH_LABEL = 'Поиск'
const CLOSE_LABEL = 'Закрыть поиск'
const CIRCLE_ICON_SIZE = 32
const PILL_ICON_SIZE = 32
const CLOSE_ICON_SIZE = 48
const MAGNIFIER_GLYPH = 'search'

const findShadows = () =>
  screen.root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.boxShadow !== undefined,
  ) ?? []

// The morph frame is the only absolutely positioned row in the component; it no
// longer carries a shadow, so it is identified by its shape, not by boxShadow.
const findMorphContainer = (): TestInstance => {
  const container = screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return flat?.position === 'absolute' && flat?.flexDirection === 'row'
  })[0]

  if (!container) throw new Error('Morph container not found')

  return container
}

const findIcon = (size: number) =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return flat?.height === size && flat?.width === size
  })[0]

const findMagnifierBox = (size: number) => {
  const box = findIcon(size)

  if (!box) throw new Error('Magnifier box not found')

  return box
}

// Last size the magnifier asked Ionicons to render at during the latest render.
const lastMagnifierGlyphSize = () => {
  const sizes = mockIoniconsSpy.mock.calls
    .map(([props]) => props as { name: string; size: number })
    .filter(props => props.name === MAGNIFIER_GLYPH)
    .map(props => props.size)

  return sizes[sizes.length - 1]
}

const magnifierTransform = (size: number) =>
  StyleSheet.flatten(findMagnifierBox(size).props.style).transform

const findContentWrapper = (input: TestInstance): TestInstance => {
  let current: null | TestInstance = input

  while (current !== null) {
    if ('opacity' in StyleSheet.flatten(current.props.style)) return current
    current = current.parent
  }

  throw new Error('Search content wrapper not found')
}

const renderMorph = async () => {
  const ctx = createCtx()
  const result = await renderWithProviders(<SearchIslandMorph />, { ctx })

  return { ...result, ctx }
}

describe('<SearchIslandMorph>', () => {
  beforeEach(() => {
    mockIoniconsSpy.mockClear()
    mockRouter.back.mockClear()
    mockRouter.navigate.mockClear()
    tabIslandMorphDriver.reset()
    oneLineBarMorphDriver.reset()
    searchOpenMorphDriver.reset()
    searchFocusMorphDriver.reset()
    searchCloseMorphDriver.reset()
  })

  test('renders no shadow-carrying container in either state', async () => {
    const { ctx } = await renderMorph()

    // The search frame and its close circle must stay shadowless.
    expect(findShadows()).toHaveLength(0)

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(findShadows()).toHaveLength(0)
  })

  test('keeps the same container mounted while the circle morphs into the pill and back', async () => {
    const { ctx } = await renderMorph()
    const closed = findMorphContainer()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    expect(findMorphContainer()).toBe(closed)

    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })
    expect(findMorphContainer()).toBe(closed)
  })

  test('never fades the container frame, only the content crossfades', async () => {
    const { ctx, getByPlaceholderText } = await renderMorph()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })

    expect(StyleSheet.flatten(findMorphContainer().props.style).opacity).toBeUndefined()
    expect(StyleSheet.flatten(findContentWrapper(input).props.style).opacity).toBe(0)

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    expect(StyleSheet.flatten(findMorphContainer().props.style).opacity).toBeUndefined()
    expect(StyleSheet.flatten(findContentWrapper(input).props.style).opacity).toBe(1)
  })

  test('renders the magnifier glyph at its animated size instead of scaling it', async () => {
    const { ctx } = await renderMorph()

    // Closed: a full-size glyph centred in the expanded search circle.
    expect(findMagnifierBox(CIRCLE_ICON_SIZE)).toBeDefined()
    expect(magnifierTransform(CIRCLE_ICON_SIZE)).toBeUndefined()
    expect(lastMagnifierGlyphSize()).toBe(CIRCLE_ICON_SIZE)
    expect(StyleSheet.flatten(findMorphContainer().props.style).paddingLeft).toBe(
      (TAB_BAR_ISLAND_HEIGHT_EXPANDED - CIRCLE_ICON_SIZE) / 2,
    )

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    // Open: the glyph keeps the same size and only travels with the left edge.
    expect(findMagnifierBox(PILL_ICON_SIZE)).toBeDefined()
    expect(magnifierTransform(PILL_ICON_SIZE)).toBeUndefined()
    expect(lastMagnifierGlyphSize()).toBe(PILL_ICON_SIZE)
    expect(StyleSheet.flatten(findMorphContainer().props.style).paddingLeft).toBe(8)
  })

  test('draws the external close glyph at the enlarged size', async () => {
    await renderMorph()

    expect(mockIoniconsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'close-outline', size: CLOSE_ICON_SIZE }),
    )
  })

  test('stretches the pill to the left inner edge while the field is focused', async () => {
    const { ctx } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })
    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const frame = StyleSheet.flatten(findMorphContainer().props.style)
    const expected = getSearchIslandGeometry({
      // Focusing the field also shows its ✕, so the shared close morph starts
      // in the same tick and reserves its slot while the pill stretches.
      closeProgress: 1,
      focusProgress: 1,
      oneLineProgress: 0,
      openProgress: 1,
      screenWidth: Dimensions.get('window').width,
      tabBarHeight: ctx.get(tabBarHeightAtom),
    })

    expect(frame.left).toBe(expected.left)
    expect(frame.width).toBe(expected.width)
  })

  test('keeps the tab-slot frame and hides the close circle while the field is blurred', async () => {
    const { ctx, queryByLabelText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const frame = StyleSheet.flatten(findMorphContainer().props.style)
    const expected = getSearchIslandGeometry({
      closeProgress: 0,
      focusProgress: 0,
      oneLineProgress: 0,
      openProgress: 1,
      screenWidth: Dimensions.get('window').width,
      tabBarHeight: ctx.get(tabBarHeightAtom),
    })

    // Regression: a dialog opening over an unfocused field must not put the bar
    // into the focused arrangement (pill full-width + ✕).
    expect(frame.left).toBe(expected.left)
    expect(frame.width).toBe(expected.width)
    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()
  })

  test('keeps the tab-slot frame of a focus flip until the morph settles', async () => {
    const { ctx } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const openFrame = StyleSheet.flatten(findMorphContainer().props.style)

    await act(async () => {
      isSearchFieldFocusedAtom(ctx, true)
    })

    expect(StyleSheet.flatten(findMorphContainer().props.style)).toMatchObject({
      left: openFrame.left,
      width: openFrame.width,
    })

    await act(async () => {
      advanceMorphFrames()
    })

    const settledFrame = StyleSheet.flatten(findMorphContainer().props.style)
    const focused = getSearchIslandGeometry({
      closeProgress: 1,
      focusProgress: 1,
      oneLineProgress: 0,
      openProgress: 1,
      screenWidth: Dimensions.get('window').width,
      tabBarHeight: ctx.get(tabBarHeightAtom),
    })

    expect(settledFrame.left).toBe(focused.left)
    expect(settledFrame.width).toBe(focused.width)
    expect(settledFrame.left).toBeLessThan(openFrame.left)
  })

  test('keeps the input mounted but pointer-gated while search is closed', async () => {
    const { ctx, getByPlaceholderText } = await renderMorph()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })

    expect(findContentWrapper(input).props.pointerEvents).toBe('none')

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(findContentWrapper(input).props.pointerEvents).toBe('auto')
  })

  test('lets drags beside the pill content pass through to the list', async () => {
    const { ctx } = await renderMorph()

    // The frame only positions its interactive children (field row, mic/clear,
    // closed-circle tap layer); its own glass box must never swallow a drag.
    expect(findMorphContainer().props.pointerEvents).toBe('box-none')

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(findMorphContainer().props.pointerEvents).toBe('box-none')
  })

  test('opens the search route by tapping the closed circle', async () => {
    const { ctx, getByPlaceholderText, getByRole } = await renderMorph()

    expect(ctx.get(isSearchOpenAtom)).toBe(false)

    // A collapsed bar must expand and the field must turn visible in ONE
    // transaction: the island's morph target would otherwise flip expand→collapse
    // in the same tick and the tap would open the route without a clean morph.
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    const openWhenBarExpanded: boolean[] = []
    ctx.subscribe(isBarCollapsedAtom, isCollapsed => {
      if (!isCollapsed) openWhenBarExpanded.push(ctx.get(isSearchOpenAtom))
    })

    // The morph starts from the atom subscription, so the flag must already be set
    // when navigation is requested — a route-commit-timed write would leave the
    // pill in its closed circle for a frame.
    let isOpenWhenNavigating = false
    mockRouter.navigate.mockImplementationOnce(() => {
      isOpenWhenNavigating = ctx.get(isSearchOpenAtom)
    })

    await fireEvent.press(getByRole('button', { name: SEARCH_LABEL }))
    await act(async () => {
      advanceMorphFrames()
    })

    expect(openWhenBarExpanded).toEqual([true])
    expect(isOpenWhenNavigating).toBe(true)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
    // Tap → atom → driver → live field: the same gesture reaches the pill content.
    expect(searchOpenMorphDriver.progress.value).toBe(1)
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    expect(findContentWrapper(input).props.pointerEvents).toBe('auto')
    expect(mockRouter.navigate).toHaveBeenCalledWith('/search')
  })

  test('hides the search button from assistive tech while the field is visible', async () => {
    const { ctx, getByRole, queryByRole } = await renderMorph()

    expect(getByRole('button', { name: SEARCH_LABEL })).toBeTruthy()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(queryByRole('button', { name: SEARCH_LABEL })).toBeNull()
  })

  test('keeps the close circle mounted but non-interactive while blurred with an empty query', async () => {
    const { ctx, getByLabelText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, '')
    })

    const closeButton = getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })
    const closeCircle = findContentWrapper(closeButton)

    expect(closeCircle.props.pointerEvents).toBe('none')
  })

  test('shows the external close circle for an active query without focus', async () => {
    const { ctx, getByLabelText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'ве')
    })

    const closeButton = getByLabelText(CLOSE_LABEL)

    expect(findContentWrapper(closeButton).props.pointerEvents).toBe('auto')
  })

  test('hides the external close circle when a blurred active query is cleared', async () => {
    const { ctx, getByLabelText, queryByLabelText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'ве')
    })
    expect(getByLabelText(CLOSE_LABEL)).toBeTruthy()

    await act(async () => {
      searchQueryAtom(ctx, '')
    })

    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()
  })

  test('writes the shared focus flag while the input has focus', async () => {
    const { ctx, getByPlaceholderText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)

    await act(async () => {
      fireEvent(input, 'focus')
    })
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(true)

    await act(async () => {
      fireEvent(input, 'blur')
    })
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
  })

  test('does not paint a second shadow when the close circle appears', async () => {
    const { ctx, getByPlaceholderText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      fireEvent(getByPlaceholderText(SEARCH_PLACEHOLDER), 'focus')
    })

    expect(findShadows()).toHaveLength(0)
  })

  test('closes the search route from the external close circle', async () => {
    const { ctx, getByLabelText, getByPlaceholderText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      fireEvent(getByPlaceholderText(SEARCH_PLACEHOLDER), 'focus')
    })
    await fireEvent.press(getByLabelText(CLOSE_LABEL))

    // The close hook writes the flag before navigating, so the closing morph
    // starts on the press tick instead of waiting for the pathname effect.
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(mockRouter.back).toHaveBeenCalledTimes(1)
  })

  test('keeps the committed resting frame at the START geometry until the search morph settles', async () => {
    const { ctx } = await renderMorph()

    const closedFrame = StyleSheet.flatten(findMorphContainer().props.style)

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    // Committing the destination on the flip paints the pill there for a frame,
    // before Reanimated asserts the start-of-morph value (Issue #63).
    expect(StyleSheet.flatten(findMorphContainer().props.style)).toMatchObject({
      height: closedFrame.height,
      left: closedFrame.left,
      width: closedFrame.width,
    })

    await act(async () => {
      advanceMorphFrames()
    })

    const settledFrame = StyleSheet.flatten(findMorphContainer().props.style)

    // The opened field is always the tab bar's full height: 68, even though
    // opening search forces the tab circle (48) collapsed in the same frame.
    expect(closedFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(settledFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(settledFrame.width).toBeGreaterThan(closedFrame.width)
  })

  test('keeps the pill frame of a close-into-circle flip until the morph settles', async () => {
    const { ctx } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    const openedFrame = StyleSheet.flatten(findMorphContainer().props.style)

    // Open field is always the tab bar's full height, not the collapsed circle's.
    expect(openedFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)

    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })

    expect(StyleSheet.flatten(findMorphContainer().props.style)).toMatchObject({
      height: openedFrame.height,
      left: openedFrame.left,
      width: openedFrame.width,
    })

    await act(async () => {
      advanceMorphFrames()
    })

    const settledFrame = StyleSheet.flatten(findMorphContainer().props.style)

    expect(settledFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(settledFrame.width).toBeLessThan(openedFrame.width)
  })

  test('keeps the close slot frame of a blur-mid-fade until the fade settles', async () => {
    const { ctx, getByLabelText, getByPlaceholderText } = await renderMorph()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    const closeSlotOpacity = () =>
      StyleSheet.flatten(
        findContentWrapper(getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })).props
          .style,
      ).opacity

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      advanceMorphFrames()
    })

    await act(async () => {
      fireEvent(input, 'focus')
    })

    // The close fade starts hidden; the show target must not be committed early.
    expect(closeSlotOpacity()).toBe(0)

    await act(async () => {
      advanceMorphFrames()
    })
    expect(closeSlotOpacity()).toBe(1)

    await act(async () => {
      fireEvent(input, 'blur')
    })

    // An interrupted fade starts from the shown frame, not from its target.
    expect(closeSlotOpacity()).toBe(1)

    await act(async () => {
      advanceMorphFrames()
    })
    expect(closeSlotOpacity()).toBe(0)
  })

  test('ignores a re-delivered focus event while the close fade is in flight', async () => {
    const { ctx, getByLabelText, getByPlaceholderText } = await renderMorph()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    const closeSlotOpacity = () =>
      StyleSheet.flatten(
        findContentWrapper(getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })).props
          .style,
      ).opacity

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    // Settle the open morph first; its completion would otherwise pollute the
    // focus-fade window below.
    await act(async () => {
      advanceMorphFrames()
    })

    await act(async () => {
      fireEvent(input, 'focus')
    })

    // The fade is running to the shown frame; a redundant focus event (same
    // value) must not commit the target as the new resting state.
    await act(async () => {
      fireEvent(input, 'focus')
    })
    expect(closeSlotOpacity()).toBe(0)

    await act(async () => {
      advanceMorphFrames()
    })
    expect(closeSlotOpacity()).toBe(1)
  })
})

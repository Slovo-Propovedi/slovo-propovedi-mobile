import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { type TestInstance } from 'test-renderer'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { TAB_BAR_ISLAND_HEIGHT, TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { SearchIslandMorph } from './SearchIslandMorph'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

const captureCompletions = () => {
  const completions: Array<(finished: boolean) => void> = []
  mockedWithTiming.mockImplementation((toValue, _config, callback) => {
    if (typeof callback === 'function') completions.push(callback)
    return toValue
  })

  return completions
}

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

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
}))

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const SEARCH_LABEL = 'Поиск'
const CLOSE_LABEL = 'Закрыть поиск'
const CIRCLE_ICON_SIZE = 32
const PILL_ICON_SIZE = 22
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
  })

  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('renders no shadow-carrying container in either state', async () => {
    const { ctx } = await renderMorph()

    // The shared `BarBackdropShade` gradient sits behind the bar; the search
    // frame and its close circle must stay shadowless.
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

    // Open: the same glyph is re-rendered at the pill's compact size. Scaling a
    // fixed 32px node down inside the 22px slot is what Android clipped.
    expect(findMagnifierBox(PILL_ICON_SIZE)).toBeDefined()
    expect(magnifierTransform(PILL_ICON_SIZE)).toBeUndefined()
    expect(lastMagnifierGlyphSize()).toBe(PILL_ICON_SIZE)
    expect(StyleSheet.flatten(findMorphContainer().props.style).paddingLeft).toBe(8)
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

  test('opens the search by tapping the closed circle', async () => {
    const { ctx, getByRole } = await renderMorph()

    await fireEvent.press(getByRole('button', { name: SEARCH_LABEL }))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(true))
  })

  test('hides the search button from assistive tech while the field is visible', async () => {
    const { ctx, getByRole, queryByRole } = await renderMorph()

    expect(getByRole('button', { name: SEARCH_LABEL })).toBeTruthy()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(queryByRole('button', { name: SEARCH_LABEL })).toBeNull()
  })

  test('keeps the close circle mounted but non-interactive while hidden', async () => {
    const { ctx, getByLabelText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'ве')
    })

    const closeButton = getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })
    const closeCircle = findContentWrapper(closeButton)

    expect(closeCircle.props.pointerEvents).toBe('none')
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

  test('closes the search from the external close circle', async () => {
    const { ctx, getByLabelText, getByPlaceholderText } = await renderMorph()

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      fireEvent(getByPlaceholderText(SEARCH_PLACEHOLDER), 'focus')
    })
    await fireEvent.press(getByLabelText(CLOSE_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
  })

  test('keeps the committed resting frame at the START geometry until the search morph settles', async () => {
    const completions = captureCompletions()
    const { ctx } = await renderMorph()

    // Mount-time animations (close progress seed) are not part of the flip.
    completions.length = 0
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
      completions.forEach(complete => complete(true))
    })

    const settledFrame = StyleSheet.flatten(findMorphContainer().props.style)

    expect(settledFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT)
    expect(settledFrame.width).toBeGreaterThan(closedFrame.width)
  })

  test('keeps the pill frame of a close-into-circle flip until the morph settles', async () => {
    const completions = captureCompletions()
    const { ctx } = await renderMorph()

    completions.length = 0
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    const openedFrame = StyleSheet.flatten(findMorphContainer().props.style)

    expect(openedFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT)

    completions.length = 0
    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })

    expect(StyleSheet.flatten(findMorphContainer().props.style)).toMatchObject({
      height: openedFrame.height,
      left: openedFrame.left,
      width: openedFrame.width,
    })

    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    const settledFrame = StyleSheet.flatten(findMorphContainer().props.style)

    expect(settledFrame.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    expect(settledFrame.width).toBeLessThan(openedFrame.width)
  })

  test('keeps the close slot frame of a blur-mid-fade until the fade settles', async () => {
    const completions = captureCompletions()
    const { ctx, getByLabelText, getByPlaceholderText } = await renderMorph()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    const closeSlotOpacity = () =>
      StyleSheet.flatten(
        findContentWrapper(getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })).props
          .style,
      ).opacity

    completions.length = 0
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    completions.length = 0
    await act(async () => {
      fireEvent(input, 'focus')
    })

    // The close fade starts hidden; the show target must not be committed early.
    expect(closeSlotOpacity()).toBe(0)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })
    expect(closeSlotOpacity()).toBe(1)

    completions.length = 0
    await act(async () => {
      fireEvent(input, 'blur')
    })

    // An interrupted fade starts from the shown frame, not from its target.
    expect(closeSlotOpacity()).toBe(1)

    await act(async () => {
      completions.forEach(complete => complete(true))
    })
    expect(closeSlotOpacity()).toBe(0)
  })

  test('ignores a re-delivered focus event while the close fade is in flight', async () => {
    const completions = captureCompletions()
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
    // focus-fade capture below.
    await act(async () => {
      completions.forEach(complete => complete(true))
    })

    completions.length = 0
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
      completions.forEach(complete => complete(true))
    })
    expect(closeSlotOpacity()).toBe(1)
  })
})

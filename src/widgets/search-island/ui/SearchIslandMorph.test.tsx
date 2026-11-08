import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { GLASS } from 'shared/ui'
import { TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
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
    instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
  ) ?? []

const findMorphContainer = (): TestInstance => {
  const container = findShadows()[0]

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

  test('renders exactly one shadow-carrying container in both states', async () => {
    const { ctx } = await renderMorph()

    expect(findShadows()).toHaveLength(1)

    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })

    expect(findShadows()).toHaveLength(1)
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

    expect(findShadows()).toHaveLength(1)
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
})

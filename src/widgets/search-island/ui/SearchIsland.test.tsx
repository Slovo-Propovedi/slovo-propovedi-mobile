import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { getGlassBorder, getGlassFill, GLASS } from 'shared/ui'
import {
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  isBarCollapsedAtom,
  setBarCollapsed,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
import { themeModeAtom } from 'shared/ui/theme'
import { SearchIsland } from './SearchIsland'

// Jest hoists mock factories above imports, so the factory may only reference
// `mock`-prefixed bindings. This alias keeps the namespace import intact.
const mockCreateDistinctValuesResponse =
  sermonsMocks.getSermonControllerGetDistinctValuesResponseMock

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

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const CLOSE_LABEL = 'Закрыть поиск'
const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])

const hasScrollAncestor = (element: TestInstance): boolean => {
  let current: null | TestInstance = element.parent

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(current.type)) return true
    current = current.parent
  }

  return false
}

const findAncestorWithHeight = (element: TestInstance, height: number): TestInstance => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (StyleSheet.flatten(current.props.style)?.height === height) return current
    current = current.parent
  }

  throw new Error(`Expected an ancestor with height ${height}, none found`)
}

describe('<SearchIsland>', () => {
  test('renders the search field pill outside any scroll container', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    const { getByPlaceholderText } = await renderWithProviders(<SearchIsland />, {
      ctx,
    })

    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)
    const pill = findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT)

    expect(hasScrollAncestor(input)).toBe(false)
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({
      borderRadius: TAB_BAR_ISLAND_HEIGHT / 2,
      position: 'absolute',
    })
    expect(pill.props.pointerEvents).toBe('auto')
  })

  test('renders the search pill as frosted glass over the page', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    await renderWithProviders(<SearchIsland />, { ctx })

    const blurs = screen.root?.queryAll(
      instance => instance.props.intensity === GLASS.blur.intensity,
    )

    // The pill and the always-mounted ✕ slot (hidden until focus) both use the
    // shared glass recipe.
    expect(blurs).toHaveLength(2)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true),
    })
    expect(
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderColor === getGlassBorder(true) && flat?.borderWidth === 1
      }),
    ).toHaveLength(2)
    expect(
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
      ),
    ).toHaveLength(2)
  })

  test('uses the dark glass recipe in the dark theme', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    await renderWithProviders(<SearchIsland />, { ctx })
    // The provider restores the persisted mode on mount, so switch to dark after
    // the first render to exercise the theme-following glass factory.
    await act(async () => {
      themeModeAtom(ctx, 'dark')
    })

    const blurs = screen.root?.queryAll(
      instance => instance.props.intensity === GLASS.blur.intensity,
    )

    expect(blurs).toHaveLength(2)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(false),
    })
    expect(
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderColor === getGlassBorder(false) && flat?.borderWidth === 1
      }),
    ).toHaveLength(2)
    expect(
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
      ),
    ).toHaveLength(2)
  })

  test('collapses the pill with the bar on an empty query and reveals it when the bar expands', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const { getByPlaceholderText } = await renderWithProviders(<SearchIsland />, { ctx })
    const findPill = () =>
      findAncestorWithHeight(
        getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true }),
        TAB_BAR_ISLAND_HEIGHT,
      )

    expect(findPill().props.pointerEvents).toBe('auto')

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    expect(findPill().props.pointerEvents).toBe('none')
    expect(ctx.get(searchQueryAtom)).toBe('')

    await act(async () => {
      setBarCollapsed(ctx, false)
    })
    expect(findPill().props.pointerEvents).toBe('auto')
  })

  test('stays mounted but non-interactive while search is closed', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    const { getByPlaceholderText } = await renderWithProviders(<SearchIsland />, { ctx })

    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    const pill = findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT)

    expect(pill.props.pointerEvents).toBe('none')
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({ opacity: 0 })
  })

  test('keeps the always-mounted close circle non-interactive while hidden', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    const { getByLabelText } = await renderWithProviders(<SearchIsland />, { ctx })

    // The ✕ slot is always mounted for the morph; while blur hides it every
    // layer must be pointer-events-none, otherwise the invisible circle over the
    // search chip swallows the first tap.
    const closeButton = getByLabelText(CLOSE_LABEL, { includeHiddenElements: true })
    const closeCircle = findAncestorWithHeight(closeButton, TAB_BAR_ISLAND_HEIGHT)

    expect(closeCircle.props.pointerEvents).toBe('none')
  })

  test('renders the external close circle only while the input is focused', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    const { getByPlaceholderText, queryByLabelText } = await renderWithProviders(<SearchIsland />, {
      ctx,
    })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()

    await act(async () => {
      fireEvent(input, 'focus')
    })
    expect(queryByLabelText(CLOSE_LABEL)).toBeTruthy()
    // The pill and the ✕ circle are both glass surfaces on the same row.
    expect(
      screen.root?.queryAll(instance => instance.props.intensity === GLASS.blur.intensity),
    ).toHaveLength(2)
    expect(
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
      ),
    ).toHaveLength(2)

    await act(async () => {
      fireEvent(input, 'blur')
    })
    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()
  })

  test('shrinks the pill leftwards to reserve the close-circle slot while focused', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    const { getByPlaceholderText } = await renderWithProviders(<SearchIsland />, { ctx })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    const before = StyleSheet.flatten(
      findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT).props.style,
    )

    await act(async () => {
      fireEvent(input, 'focus')
    })

    const after = StyleSheet.flatten(
      findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT).props.style,
    )

    expect(after.right - before.right).toBe(BAR_CIRCLE_SIZE + BAR_OUTER_GAP)
  })

  test('closes the search from the external close circle', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'ве')
    const { getByLabelText, getByPlaceholderText } = await renderWithProviders(<SearchIsland />, {
      ctx,
    })

    await act(async () => {
      fireEvent(getByPlaceholderText(SEARCH_PLACEHOLDER), 'focus')
    })
    await fireEvent.press(getByLabelText(CLOSE_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
  })
})

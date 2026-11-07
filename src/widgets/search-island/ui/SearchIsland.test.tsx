import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { isSearchOpenAtom } from 'features/sermon-search'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import {
  BAR_CIRCLE_SIZE,
  BAR_OUTER_GAP,
  isBarCollapsedAtom,
  TAB_BAR_ISLAND_HEIGHT,
} from 'shared/ui/layout'
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

  test('stays mounted but non-interactive while search is closed', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    const { getByPlaceholderText } = await renderWithProviders(<SearchIsland />, { ctx })

    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })
    const pill = findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT)

    expect(pill.props.pointerEvents).toBe('none')
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({ opacity: 0 })
  })

  test('renders the external close circle only while the input is focused', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
    const { getByPlaceholderText, queryByLabelText } = await renderWithProviders(<SearchIsland />, {
      ctx,
    })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()

    await act(async () => {
      fireEvent(input, 'focus')
    })
    expect(queryByLabelText(CLOSE_LABEL)).toBeTruthy()

    await act(async () => {
      fireEvent(input, 'blur')
    })
    expect(queryByLabelText(CLOSE_LABEL)).toBeNull()
  })

  test('shrinks the pill leftwards to reserve the close-circle slot while focused', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    isSearchOpenAtom(ctx, true)
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

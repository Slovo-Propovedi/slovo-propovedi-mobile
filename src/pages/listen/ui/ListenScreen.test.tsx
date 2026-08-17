import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { StyleSheet, TextInput } from 'react-native'
import { SEARCH_HEADER_HEIGHT } from 'features/sermon-search'
import {
  isSearchingAtom,
  isSearchOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
} from 'features/sermon-search/model'
import { renderWithProviders } from 'shared/mocks'
import type { SermonData } from 'shared/model'
import type { TestInstance } from 'test-renderer'
import { ListenScreen } from './ListenScreen'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest.fn().mockResolvedValue({ artists: [], books: [] }),
    }),
  },
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(() => jest.fn()),
}))

jest.mock('features/sermon-search/lib/useDebouncedSearch', () => ({
  useDebouncedSearch: () => undefined,
}))

jest.mock('./DynamicSectionsSlider', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    DynamicSectionsSlider: () => <Text>SECTIONS_MOCK</Text>,
  }
})

const SEARCH_TOGGLE_LABEL = 'Поиск'
const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const CLEAR_LABEL = 'Очистить поиск'
const SERMON_TITLE = 'Проповедь о вере'
const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])

// A pinned element (the search bar) must not have any scroll container between
// itself and the screen root; a scrolling element (the magnifier) must have one.
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

const flushAnimationFrame = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const sermons: SermonData[] = [
  {
    artist: 'Иван',
    artwork: 'https://example.com/a.jpg',
    audioUrl: 'https://example.com/a.mp3',
    id: '1',
    title: SERMON_TITLE,
  },
]

const renderWithOpenSearch = async (query = '') => {
  const ctx = createCtx()
  isSearchOpenAtom(ctx, true)
  searchQueryAtom(ctx, query)

  return renderWithProviders(<ListenScreen />, { ctx })
}

describe('<ListenScreen>', () => {
  test('shows sections and the magnifier inside the scroll content by default, without the search bar', async () => {
    const { getByLabelText, getByText, queryByPlaceholderText } = await renderWithProviders(
      <ListenScreen />,
      {},
    )

    expect(getByText('SECTIONS_MOCK')).toBeTruthy()
    expect(hasScrollAncestor(getByLabelText(SEARCH_TOGGLE_LABEL))).toBe(true)
    expect(queryByPlaceholderText(SEARCH_PLACEHOLDER)).toBeNull()
  })

  test('opens search via the magnifier, pinning the bar above the scroll content', async () => {
    const { ctx, getByLabelText, getByPlaceholderText, getByText, queryByLabelText } =
      await renderWithProviders(<ListenScreen />, {})

    fireEvent.press(getByLabelText(SEARCH_TOGGLE_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(true))
    const bar = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(hasScrollAncestor(bar)).toBe(false)
    expect(findAncestorWithHeight(bar, SEARCH_HEADER_HEIGHT)).toBeTruthy()
    expect(queryByLabelText(SEARCH_TOGGLE_LABEL)).toBeNull()
    expect(getByText('SECTIONS_MOCK')).toBeTruthy()
  })

  test('hides sections and shows search results while the query is active, with the bar still pinned', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)
    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <ListenScreen />,
      { ctx },
    )

    expect(hasScrollAncestor(getByPlaceholderText(SEARCH_PLACEHOLDER))).toBe(false)
    expect(queryByText('SECTIONS_MOCK')).toBeNull()
    expect(getByText(SERMON_TITLE)).toBeTruthy()
  })

  test('clears the query via ✕ and returns sections while the search stays open and pinned', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, sermons)
    isSearchingAtom(ctx, false)
    const { getByLabelText, getByPlaceholderText, getByText, queryByText } =
      await renderWithProviders(<ListenScreen />, { ctx })

    fireEvent.press(getByLabelText(CLEAR_LABEL))

    await waitFor(() => expect(ctx.get(searchQueryAtom)).toBe(''))
    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    const bar = getByPlaceholderText(SEARCH_PLACEHOLDER)
    expect(hasScrollAncestor(bar)).toBe(false)
    expect(getByText('SECTIONS_MOCK')).toBeTruthy()
    expect(queryByText(SERMON_TITLE)).toBeNull()
  })

  test('closes the search via ✕ when the field is empty and returns the magnifier', async () => {
    const { ctx, getByLabelText, queryByPlaceholderText } = await renderWithOpenSearch()

    fireEvent.press(getByLabelText(CLEAR_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
    expect(queryByPlaceholderText(SEARCH_PLACEHOLDER)).toBeNull()
    expect(getByLabelText(SEARCH_TOGGLE_LABEL)).toBeTruthy()
  })

  test('keeps the search bar mounted across the sections ↔ results transition', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    focusMock.mockClear()

    const { getByPlaceholderText } = await renderWithProviders(<ListenScreen />, { ctx })
    await flushAnimationFrame()

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'ве')
    await flushAnimationFrame()
    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('ве')

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'в')
    await flushAnimationFrame()
    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('в')

    // A remount would re-run the rAF autofocus; one call proves the bar stayed put.
    expect(focusMock).toHaveBeenCalledTimes(1)
  })
})

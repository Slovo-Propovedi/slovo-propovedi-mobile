import { createCtx } from '@reatom/framework'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { isBarCollapsedAtom, TAB_BAR_ISLAND_HEIGHT } from 'shared/ui/layout'
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
const CLEAR_LABEL = 'Очистить поиск'
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
    const { getByLabelText, getByPlaceholderText } = await renderWithProviders(<SearchIsland />, {
      ctx,
    })

    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)
    const pill = findAncestorWithHeight(input, TAB_BAR_ISLAND_HEIGHT)

    expect(hasScrollAncestor(input)).toBe(false)
    expect(StyleSheet.flatten(pill.props.style)).toMatchObject({
      borderRadius: TAB_BAR_ISLAND_HEIGHT / 2,
      position: 'absolute',
    })
    expect(getByLabelText(CLEAR_LABEL)).toBeTruthy()
  })
})

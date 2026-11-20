import { act, fireEvent } from '@testing-library/react-native'
import { StyleSheet, TextInput } from 'react-native'
import { makeMutable } from 'react-native-reanimated'
import { type TestInstance } from 'test-renderer'
import { isSearchOpenAtom } from 'features/sermon-search'
import { sermonsMocks } from 'shared/api/generated'
import { getSharedTestCtx, renderWithProviders } from 'shared/mocks'
import { setBarCollapsed } from 'shared/ui/layout'
import { SEARCH_FOCUS_SURFACE_TEST_ID, SearchIslandContent } from './SearchIslandContent'

// Jest hoists mock factories above imports, so the factory may only reference
// `mock`-prefixed bindings. This alias keeps the namespace import intact.
const mockCreateDistinctValuesResponse =
  sermonsMocks.getSermonControllerGetDistinctValuesResponseMock

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
  usePathname: () => '/',
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    navigate: jest.fn(),
  }),
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

jest.mock('expo-intent-launcher', () => ({
  ResultCode: { Success: 0 },
  startActivityAsync: jest.fn(),
}))

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

const SEARCH_PLACEHOLDER = 'Проповеди, проповедники, название книги'
const SEARCH_LABEL = 'Поиск'
const MIC_LABEL = 'Голосовой ввод'

const focusMock = () =>
  (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus

const renderContent = async (isVisible: boolean) => {
  const onFocusChange = jest.fn()
  const onOpenSearch = jest.fn()
  const result = await renderWithProviders(
    <SearchIslandContent
      isVisible={isVisible}
      onOpenSearch={onOpenSearch}
      onFocusChange={onFocusChange}
      openProgress={makeMutable(isVisible ? 1 : 0)}
    />,
  )

  return { ...result, onFocusChange, onOpenSearch }
}

// The content wrapper is the animated node carrying the crossfade opacity; the
// input lives inside it, so walking up from the field finds the row's gate.
const findContentWrapper = (input: TestInstance): TestInstance => {
  let current: null | TestInstance = input

  while (current !== null) {
    if ('opacity' in StyleSheet.flatten(current.props.style)) return current

    current = current.parent
  }

  throw new Error('Search content wrapper not found')
}

describe('<SearchIslandContent>', () => {
  beforeEach(async () => {
    const ctx = getSharedTestCtx()
    await act(async () => {
      isSearchOpenAtom(ctx, false)
      setBarCollapsed(ctx, false)
    })
  })

  test('focuses the input from a press on the open pill surface', async () => {
    const ctx = getSharedTestCtx()
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    const { getByTestId } = await renderContent(true)
    const focus = focusMock()
    focus.mockClear()

    await fireEvent.press(
      getByTestId(SEARCH_FOCUS_SURFACE_TEST_ID, { includeHiddenElements: true }),
    )

    expect(focus).toHaveBeenCalledTimes(1)
  })

  test('does not take focus away from the mic button', async () => {
    const ctx = getSharedTestCtx()
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    const { getByLabelText } = await renderContent(true)
    const focus = focusMock()
    focus.mockClear()

    await fireEvent.press(getByLabelText(MIC_LABEL))

    expect(focus).not.toHaveBeenCalled()
  })

  test('lays the focus surface under the content and lets row gaps fall through', async () => {
    const ctx = getSharedTestCtx()
    await act(async () => {
      isSearchOpenAtom(ctx, true)
    })
    const { getByPlaceholderText, getByTestId } = await renderContent(true)
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER, { includeHiddenElements: true })

    expect(
      getByTestId(SEARCH_FOCUS_SURFACE_TEST_ID, { includeHiddenElements: true }).props
        .pointerEvents,
    ).toBe('auto')
    expect(findContentWrapper(input).props.pointerEvents).toBe('box-none')
  })

  test('keeps the surface inert while closed and opens search from the circle', async () => {
    const { getByRole, getByTestId, onOpenSearch } = await renderContent(false)

    expect(getByTestId(SEARCH_FOCUS_SURFACE_TEST_ID).props.pointerEvents).toBe('none')

    await fireEvent.press(getByRole('button', { name: SEARCH_LABEL }))

    expect(onOpenSearch).toHaveBeenCalledTimes(1)
  })
})

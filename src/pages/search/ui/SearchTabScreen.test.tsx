import { createCtx } from '@reatom/framework'
import { useTourActionRegistrar } from 'features/onboarding'
import { isSearchOpenAtom, searchQueryAtom, useSermonPlayback } from 'features/sermon-search'
import {
  isSearchFieldFocusedAtom,
  searchFocusRequestAtom,
} from 'features/sermon-search/@x/barMorph'
import { renderWithProviders } from 'shared/mocks'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { searchSessionNonceAtom } from '../model/searchSession'
import { SearchTabScreen } from './SearchTabScreen'

let mockPathname = '/listen'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  usePathname: () => mockPathname,
  useRouter: () => ({ setParams: jest.fn() }),
}))

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text: MockText } = jest.requireActual('react-native')

  return {
    ...actual,
    BlurBackdrop: ({ children, routeKey }: { children: React.ReactNode; routeKey: string }) => (
      <>
        <MockText>{`BLUR_TARGET:${routeKey}`}</MockText>
        {children}
      </>
    ),
  }
})

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('features/add-to-playlist', () => ({
  useAddToPlaylistModal: jest.fn(() => ({ modal: null, openAddToPlaylist: jest.fn() })),
}))

jest.mock('features/sermon-search', () => {
  const actual = jest.requireActual('features/sermon-search')

  return {
    ...actual,
    useSermonPlayback: jest.fn(),
  }
})

jest.mock('features/onboarding', () => ({
  useTourActionRegistrar: jest.fn(),
}))

jest.mock('../lib/useSearchTourActions', () => ({
  useSearchTourActions: jest.fn(),
}))

jest.mock('./SearchScreen', () => {
  const { Text: MockText } = jest.requireActual('react-native')

  return { SearchScreen: () => <MockText>SEARCH_SCREEN</MockText> }
})

const mockedUseSermonPlayback = jest.mocked(useSermonPlayback)
const mockedUseTourActionRegistrar = jest.mocked(useTourActionRegistrar)
const mockedUseSearchTourActions = jest.mocked(useSearchTourActions)

const CLOSE_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

const renderScreen = async (ctx = createCtx()) => {
  const result = await renderWithProviders(<SearchTabScreen />, { ctx })

  return { ...result, ctx }
}

describe('<SearchTabScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/listen'
    mockedUseSermonPlayback.mockReturnValue({
      closePicker: jest.fn(),
      modal: null,
      onSermonPress: jest.fn(),
    })
  })

  test('renders the search page under its own blur target', async () => {
    const { getByText } = await renderScreen()

    expect(getByText('BLUR_TARGET:/search')).toBeTruthy()
    expect(getByText('SEARCH_SCREEN')).toBeTruthy()
  })

  test('keeps the bottom search island in its closed circle pose on the route', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, false)

    mockPathname = '/search'
    const { rerender } = await renderScreen(ctx)

    // The field lives on the page now: the bottom island must not morph into a
    // field pill, so nothing writes the morph's open flag on the search route.
    expect(ctx.get(isSearchOpenAtom)).toBe(false)

    mockPathname = '/more'
    await rerender(<SearchTabScreen />)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
  })

  test('focuses the page field when the search route opens', async () => {
    const ctx = createCtx()
    searchFocusRequestAtom(ctx, 0)

    mockPathname = '/listen'
    const { rerender } = await renderScreen(ctx)

    expect(ctx.get(searchFocusRequestAtom)).toBe(0)

    mockPathname = '/search'
    await rerender(<SearchTabScreen />)

    expect(ctx.get(searchFocusRequestAtom)).toBeGreaterThan(0)
  })

  test('resets the session when the path moves away from search', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, false)
    searchQueryAtom(ctx, 'вера')
    isSearchFieldFocusedAtom(ctx, true)
    searchSessionNonceAtom(ctx, 3)

    mockPathname = '/search'
    const { rerender } = await renderScreen(ctx)

    mockPathname = '/listen'
    await rerender(<SearchTabScreen />)

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(isSearchFieldFocusedAtom)).toBe(false)
    // The bump remounts SearchScreen, so scope/group/page state resets too.
    expect(ctx.get(searchSessionNonceAtom)).toBe(4)
  })

  test('keeps the session alive under a nested search detail route', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    searchSessionNonceAtom(ctx, 1)
    searchFocusRequestAtom(ctx, 0)

    mockPathname = '/search'
    const { rerender } = await renderScreen(ctx)
    const focusRequestOnEntry = ctx.get(searchFocusRequestAtom)

    mockPathname = '/search/playlist'
    await rerender(<SearchTabScreen />)

    expect(ctx.get(searchQueryAtom)).toBe('вера')
    expect(ctx.get(searchSessionNonceAtom)).toBe(1)
    // A detail push stays inside the search route: the page field is not
    // re-focused, it keeps the focus the session already owns.
    expect(ctx.get(searchFocusRequestAtom)).toBe(focusRequestOnEntry)
  })

  test('registers the tour actions on behalf of the page', async () => {
    await renderScreen()

    expect(mockedUseSearchTourActions).toHaveBeenCalledTimes(1)
    expect(mockedUseTourActionRegistrar).toHaveBeenCalledWith(
      CLOSE_PICKER_ACTION_ID,
      expect.anything(),
    )
  })
})

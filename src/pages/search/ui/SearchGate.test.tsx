import { createCtx, type Ctx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar } from 'features/onboarding'
import { isSearchOpenAtom, useOpenSearch, useSermonPlayback } from 'features/sermon-search'
import { type PlaylistData } from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { DarkTheme, LightTheme } from 'shared/ui/theme'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { SearchGate } from './SearchGate'

const mockOpenSearch = jest.fn()
const mockOnSermonPress = jest.fn()
const mockClosePicker = jest.fn()
const mockCloseSearch = jest.fn()
const mockRouterPush = jest.fn()
const mockPlaylist: PlaylistData = {
  artwork: null,
  id: 'search-playlist-1',
  sermons: [],
  title: 'Утренние проповеди',
}

const SEARCH_SCREEN = 'SEARCH_SCREEN'
const PREACHER_PRESS = 'PREACHER_PRESS'
const PICKER_MODAL = 'PICKER_MODAL'
const ADD_TO_PLAYLIST_MODAL = 'ADD_TO_PLAYLIST_MODAL'
const CLOSE_PICKER_ACTION_ID = 'close-sermon-playlist-picker'
const mockArtist = 'Иван Иванов'

jest.mock('expo-router', () => ({
  usePathname: () => '/more',
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text: MockText } = jest.requireActual('react-native')

  return {
    ...actual,
    BlurBackdrop: ({ children, routeKey }: { children: ReactNode; routeKey: string }) => (
      <>
        <MockText>{`BLUR_TARGET:${routeKey}`}</MockText>
        {children}
      </>
    ),
  }
})

jest.mock('features/sermon-search', () => {
  const { action, atom } = jest.requireActual('@reatom/framework')
  const searchOpenAtom = atom(false, 'mockIsSearchOpenAtom')
  const closeSearch = action(async (ctx: Ctx) => {
    await ctx.schedule(() => {
      searchOpenAtom(ctx, false)
    })
    mockCloseSearch()
  }, 'closeSearch')

  return {
    closeSearch,
    isSearchOpenAtom: searchOpenAtom,
    useOpenSearch: jest.fn(),
    useSermonPlayback: jest.fn(),
  }
})

jest.mock('features/add-to-playlist', () => ({
  useAddToPlaylistModal: jest.fn(),
}))

jest.mock('features/onboarding', () => ({
  useTourActionRegistrar: jest.fn(),
}))

jest.mock('../lib/useSearchTourActions', () => ({
  useSearchTourActions: jest.fn(),
}))

jest.mock('./SearchScreen', () => {
  const { Pressable, Text: MockText } = jest.requireActual('react-native')

  return {
    SearchScreen: ({
      onPlaylistPress,
      onPreacherPress,
    }: {
      onPlaylistPress: (playlist: PlaylistData) => void
      onPreacherPress: (artist: string) => void
    }) => (
      <>
        <Pressable onPress={() => onPlaylistPress(mockPlaylist)}>
          <MockText>SEARCH_SCREEN</MockText>
        </Pressable>
        <Pressable onPress={() => onPreacherPress(mockArtist)}>
          <MockText>PREACHER_PRESS</MockText>
        </Pressable>
      </>
    ),
  }
})

const mockedUseOpenSearch = jest.mocked(useOpenSearch)
const mockedUseSermonPlayback = jest.mocked(useSermonPlayback)
const mockedUseAddToPlaylistModal = jest.mocked(useAddToPlaylistModal)
const mockedUseTourActionRegistrar = jest.mocked(useTourActionRegistrar)
const mockedUseSearchTourActions = jest.mocked(useSearchTourActions)

const renderGate = async (isOpen: boolean) => {
  const ctx = createCtx()
  isSearchOpenAtom(ctx, isOpen)

  return renderWithProviders(<SearchGate />, { ctx })
}

describe('<SearchGate>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseOpenSearch.mockReturnValue(mockOpenSearch)
    mockedUseSermonPlayback.mockReturnValue({
      closePicker: mockClosePicker,
      modal: null,
      onSermonPress: mockOnSermonPress,
    })
    mockedUseAddToPlaylistModal.mockReturnValue({
      modal: null,
      openAddAllToPlaylist: jest.fn(),
      openAddToPlaylist: jest.fn(),
    })
  })

  test('renders no search page while the search is closed', async () => {
    const { queryByText } = await renderGate(false)

    expect(queryByText(SEARCH_SCREEN)).toBeNull()
  })

  test('keeps the tour actions registered while the search is closed', async () => {
    await renderGate(false)

    expect(mockedUseSearchTourActions).toHaveBeenCalledTimes(1)
    expect(mockedUseTourActionRegistrar).toHaveBeenCalledWith(
      CLOSE_PICKER_ACTION_ID,
      mockClosePicker,
    )
  })

  test('renders the search page when the search is open', async () => {
    const { getByText } = await renderGate(true)

    expect(getByText(SEARCH_SCREEN)).toBeTruthy()
  })

  test('covers the tab screens below the bottom chrome', async () => {
    await renderGate(true)

    const layer = screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.zIndex === 5,
    )[0]
    const style = StyleSheet.flatten(layer?.props.style)

    expect(style).toMatchObject({
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    })

    // The themed page background lives INSIDE the blur target: the pill frosts
    // the page it floats over, and a transparent target would blur the window
    // background (bright gray in the dark theme) instead.
    const page = screen.root?.queryAll(instance => {
      const flat = StyleSheet.flatten(instance.props.style)

      return (
        flat?.flex === 1 &&
        [DarkTheme.background, LightTheme.background].includes(flat?.backgroundColor)
      )
    })[0]

    expect(page).toBeDefined()
  })

  test('publishes the page as a glass blur target while open', async () => {
    await renderGate(true)

    // Surfaces that float over the page (the mini pill) resolve this target,
    // while the tab-bar chrome keeps its own shade target.
    expect(screen.getByText('BLUR_TARGET:/more')).toBeTruthy()
  })

  test('hosts the playback picker and add-to-playlist modals', async () => {
    mockedUseSermonPlayback.mockReturnValue({
      closePicker: mockClosePicker,
      modal: <Text>PICKER_MODAL</Text>,
      onSermonPress: mockOnSermonPress,
    })
    mockedUseAddToPlaylistModal.mockReturnValue({
      modal: <Text>ADD_TO_PLAYLIST_MODAL</Text>,
      openAddAllToPlaylist: jest.fn(),
      openAddToPlaylist: jest.fn(),
    })

    const { getByText } = await renderGate(true)

    expect(getByText(PICKER_MODAL)).toBeTruthy()
    expect(getByText(ADD_TO_PLAYLIST_MODAL)).toBeTruthy()
  })

  test('closes the search session before navigating to a pressed playlist', async () => {
    const { ctx, getByText, queryByText } = await renderGate(true)

    await act(async () => {
      fireEvent.press(getByText(SEARCH_SCREEN))
    })

    expect(mockCloseSearch).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledWith({
      params: { playlist: mockPlaylist.id },
      pathname: '/listen/playlist',
    })
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(queryByText(SEARCH_SCREEN)).toBeNull()
  })

  test('closes the search session before navigating to a pressed preacher', async () => {
    const { ctx, getByText, queryByText } = await renderGate(true)

    await act(async () => {
      fireEvent.press(getByText(PREACHER_PRESS))
    })

    expect(mockCloseSearch).toHaveBeenCalledTimes(1)
    expect(mockRouterPush).toHaveBeenCalledWith({
      params: { artist: mockArtist },
      pathname: '/listen/preacher',
    })
    expect(mockCloseSearch.mock.invocationCallOrder[0]).toBeLessThan(
      mockRouterPush.mock.invocationCallOrder[0],
    )
    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(queryByText(SEARCH_SCREEN)).toBeNull()
  })

  test('unmounts the search content when the search closes', async () => {
    const { ctx, getByText, queryByText } = await renderGate(true)
    expect(getByText(SEARCH_SCREEN)).toBeTruthy()

    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })

    expect(queryByText(SEARCH_SCREEN)).toBeNull()
  })
})

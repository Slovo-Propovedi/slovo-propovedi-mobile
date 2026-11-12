import { createCtx } from '@reatom/framework'
import { act, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { useAddToPlaylistModal } from 'features/add-to-playlist'
import { useTourActionRegistrar } from 'features/onboarding'
import { isSearchOpenAtom, useOpenSearch, useSermonPlayback } from 'features/sermon-search'
import { renderWithProviders } from 'shared/mocks'
import { useSearchTourActions } from '../lib/useSearchTourActions'
import { SearchGate } from './SearchGate'

const mockOpenSearch = jest.fn()
const mockOnSermonPress = jest.fn()
const mockClosePicker = jest.fn()

const SEARCH_SCREEN = 'SEARCH_SCREEN'
const PICKER_MODAL = 'PICKER_MODAL'
const ADD_TO_PLAYLIST_MODAL = 'ADD_TO_PLAYLIST_MODAL'
const CLOSE_PICKER_ACTION_ID = 'close-sermon-playlist-picker'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('features/sermon-search', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    isSearchOpenAtom: atom(false, 'mockIsSearchOpenAtom'),
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
  const { Text: MockText } = jest.requireActual('react-native')

  return { SearchScreen: () => <MockText>SEARCH_SCREEN</MockText> }
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

    expect(style).toMatchObject({ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 })
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

  test('unmounts the search content when the search closes', async () => {
    const { ctx, getByText, queryByText } = await renderGate(true)
    expect(getByText(SEARCH_SCREEN)).toBeTruthy()

    await act(async () => {
      isSearchOpenAtom(ctx, false)
    })

    expect(queryByText(SEARCH_SCREEN)).toBeNull()
  })
})

import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
import { authUserAtom } from 'entities/auth'
import { authMocks, playlistsMocks, sectionsMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminHomeScreen } from './AdminHomeScreen'

const mockSectionControllerFindAll = jest.fn()
const mockPlaylistControllerFindAll = jest.fn()
const mockSermonControllerFindAll = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockPlaylistControllerFindAll }),
  },
  sectionsApi: {
    getSections: () => ({ sectionControllerFindAll: mockSectionControllerFindAll }),
  },
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: mockSermonControllerFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('entities/auth', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    authUserAtom: atom(null, 'testAuthUserAtom'),
    signOut: jest.fn(),
  }
})

const SECTIONS_COUNT = 7
const PLAYLISTS_COUNT = 13
const SERMONS_COUNT = 21

const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])

const findRefreshControl = (element: TestInstance) => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(String(current.type))) return current.props.refreshControl
    current = current.parent
  }

  throw new Error('Expected a scroll host ancestor, none found')
}

describe('<AdminHomeScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSectionControllerFindAll.mockResolvedValue(
      sectionsMocks.getSectionControllerFindAllResponseMock({ count: SECTIONS_COUNT }),
    )
    mockPlaylistControllerFindAll.mockResolvedValue(
      playlistsMocks.getPlaylistControllerFindAllResponseMock({ count: PLAYLISTS_COUNT }),
    )
    mockSermonControllerFindAll.mockResolvedValue(
      sermonsMocks.getSermonControllerFindAllResponseMock({ count: SERMONS_COUNT }),
    )
  })

  test('renders the admin greeting and user name', async () => {
    const ctx = createCtx()
    const user = authMocks.getAuthControllerGetProfileResponseMock({ name: 'Иван', role: 'admin' })
    authUserAtom(ctx, user)

    const { getByText } = await renderWithProviders(<AdminHomeScreen />, { ctx })

    expect(getByText('Интерфейс администратора')).toBeTruthy()
    expect(getByText('Иван')).toBeTruthy()
  })

  test('renders entity counts from the API', async () => {
    const ctx = createCtx()

    const { findByText } = await renderWithProviders(<AdminHomeScreen />, { ctx })

    expect(await findByText(String(SECTIONS_COUNT))).toBeTruthy()
    expect(await findByText(String(PLAYLISTS_COUNT))).toBeTruthy()
    expect(await findByText(String(SERMONS_COUNT))).toBeTruthy()
  })

  test('reloads the counters when pulled to refresh', async () => {
    const ctx = createCtx()

    const { findByText } = await renderWithProviders(<AdminHomeScreen />, { ctx })
    const refreshControl = findRefreshControl(await findByText('Интерфейс администратора'))

    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    await waitFor(() => expect(mockSectionControllerFindAll).toHaveBeenCalledTimes(2))
    expect(mockPlaylistControllerFindAll).toHaveBeenCalledTimes(2)
    expect(mockSermonControllerFindAll).toHaveBeenCalledTimes(2)
  })
})

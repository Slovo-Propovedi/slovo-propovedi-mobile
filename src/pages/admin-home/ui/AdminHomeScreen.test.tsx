import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { authUserAtom } from 'entities/auth'
import {
  type APITypes,
  authMocks,
  playlistsMocks,
  sectionsMocks,
  sermonsMocks,
} from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { WIDE_TOP_CHROME_SCROLL_INSET } from 'shared/ui/layout'
import { AdminHomeScreen } from './AdminHomeScreen'

const WIDE_DIMENSIONS = { fontScale: 1, height: 800, width: 1024 }
const COMPACT_DIMENSIONS = { fontScale: 1, height: 390, width: 844 }

const mockUseWindowDimensions = jest.fn(() => COMPACT_DIMENSIONS)

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}))

// Native `PullToRefresh` is a passthrough, so the web slot offset is only
// observable on the prop the screen passes.
let mockPullToRefreshTopOffset: number | undefined

jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')

  return {
    ...actual,
    PullToRefresh: ({ children, topOffset }: { children: ReactNode; topOffset?: number }) => {
      mockPullToRefreshTopOffset = topOffset

      return <>{children}</>
    },
  }
})

const mockSectionControllerFindAll = jest.fn()
const mockPlaylistControllerFindAll = jest.fn()
const mockSermonControllerFindAll = jest.fn()
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockSignOut = jest.fn()

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
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

jest.mock('entities/auth', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    authUserAtom: atom(null, 'testAuthUserAtom'),
    isAdminUser: (user: { role?: string } | null) => user?.role === 'admin',
    signOut: () => mockSignOut(),
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

const renderAdminHome = async (role: APITypes.UserRole) => {
  const ctx = createCtx()
  const user = authMocks.getAuthControllerGetProfileResponseMock({ role })
  authUserAtom(ctx, user)

  return renderWithProviders(<AdminHomeScreen />, { ctx })
}

const measureMenu = async () => {
  const menu = screen.root?.queryAll(
    node => StyleSheet.flatten(node.props.style)?.elevation === 101,
  )[0]

  if (!menu) throw new Error('Expected the menu container, none found')

  // The dropdown blocks presses until it measures itself (pointerEvents: none).
  await act(async () => {
    fireEvent(menu, 'layout', { nativeEvent: { layout: { height: 100, width: 180, x: 0, y: 0 } } })
  })
}

const openUserMenu = async () => {
  await fireEvent.press(screen.getByRole('button', { name: 'Меню пользователя' }))
  await measureMenu()

  return screen.findByText('Выйти из аккаунта')
}

describe('<AdminHomeScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)
    mockPullToRefreshTopOffset = undefined
    mockMeasureInWindow({ height: 44, width: 44, x: 300, y: 60 })
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

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the back button, the title and the user caption', async () => {
    const ctx = createCtx()
    const user = authMocks.getAuthControllerGetProfileResponseMock({ name: 'Иван', role: 'admin' })
    authUserAtom(ctx, user)

    const { getByRole, getByText } = await renderWithProviders(<AdminHomeScreen />, { ctx })

    expect(getByRole('button', { name: 'Вернуться в приложение' })).toBeTruthy()
    expect(getByText('Интерфейс администратора')).toBeTruthy()
    expect(getByText('Иван')).toBeTruthy()
  })

  test('shows the upload quick action without the sign-out row', async () => {
    const { getByText, queryByText } = await renderAdminHome('admin')

    expect(getByText('Загрузить проповедь')).toBeTruthy()
    expect(queryByText('Выйти из аккаунта')).toBeNull()
  })

  test('hands the admin every extra action', async () => {
    const { getByText } = await renderAdminHome('admin')

    expect(getByText('Медиа')).toBeTruthy()
    expect(getByText('Флаги')).toBeTruthy()
    expect(getByText('Источники импорта')).toBeTruthy()
    expect(getByText('Пользователи')).toBeTruthy()
  })

  test('opens the admin-only routes from the extra actions', async () => {
    const { getByText } = await renderAdminHome('admin')

    await fireEvent.press(getByText('Флаги'))

    expect(mockPush).toHaveBeenCalledWith('/admin/flags')
  })

  test('leaves the moderator with the media action only', async () => {
    const { getByText, queryByText } = await renderAdminHome('moderator')

    expect(getByText('Медиа')).toBeTruthy()
    expect(queryByText('Флаги')).toBeNull()
    expect(queryByText('Источники импорта')).toBeNull()
    expect(queryByText('Пользователи')).toBeNull()
  })

  test('signs out from the user menu and returns to the app', async () => {
    await renderAdminHome('admin')

    await fireEvent.press(await openUserMenu())

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1))
    expect(mockReplace).toHaveBeenCalledWith('/listen')
  })

  test('renders entity counts from the API', async () => {
    const ctx = createCtx()

    const { findByText } = await renderWithProviders(<AdminHomeScreen />, { ctx })

    expect(await findByText(String(SECTIONS_COUNT))).toBeTruthy()
    expect(await findByText(String(PLAYLISTS_COUNT))).toBeTruthy()
    expect(await findByText(String(SERMONS_COUNT))).toBeTruthy()
  })

  test('puts the wide refresh spinner slot in the island-clearance zone', async () => {
    mockUseWindowDimensions.mockReturnValue(WIDE_DIMENSIONS)

    await renderAdminHome('admin')

    // The 40 px slot ends where the first content row starts, below the island.
    expect(mockPullToRefreshTopOffset).toBe(WIDE_TOP_CHROME_SCROLL_INSET - 40)
    expect(mockPullToRefreshTopOffset).toBe(56)
  })

  test('keeps the compact refresh spinner slot at the top', async () => {
    await renderAdminHome('admin')

    expect(mockPullToRefreshTopOffset).toBe(0)
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

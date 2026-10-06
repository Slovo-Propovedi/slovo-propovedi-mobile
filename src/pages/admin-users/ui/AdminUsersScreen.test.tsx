import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
import { usersMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminUsersScreen } from './AdminUsersScreen'

// MarqueeText renders the title twice (visible + measurer), so a single-Text
// stub keeps text queries unambiguous in list-row tests.
jest.mock('shared/ui/marquee-text/marquee-text', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

const mockFindAll = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  usersApi: {
    getUsers: () => ({ usersControllerFindAll: mockFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}))

const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])

const findRefreshControl = (element: TestInstance) => {
  let current: null | TestInstance = element

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(String(current.type))) return current.props.refreshControl
    current = current.parent
  }

  throw new Error('Expected a scroll host ancestor, none found')
}

const createUsers = (count: number) =>
  usersMocks.getUsersControllerFindAllResponseMock({
    count,
    users: Array.from({ length: count }, (_, index) => ({
      email: `user${index}@test.ru`,
      id: `u${index}`,
      name: `Пользователь ${index}`,
      role: 'user' as const,
      username: `login${index}`,
    })),
  })

describe('<AdminUsersScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders users with role and username badges', async () => {
    mockFindAll.mockResolvedValue(createUsers(1))

    const { findByText } = await renderWithProviders(<AdminUsersScreen />)

    expect(await findByText('Пользователь 0')).toBeTruthy()
    expect(await findByText('user0@test.ru')).toBeTruthy()
    expect(await findByText('Пользователь')).toBeTruthy()
    expect(await findByText('login0')).toBeTruthy()
  })

  test('filters the loaded page by the debounced search term', async () => {
    mockFindAll.mockResolvedValue(createUsers(2))

    const { findByText, getByPlaceholderText, queryByText } = await renderWithProviders(
      <AdminUsersScreen />,
    )
    await findByText('Пользователь 0')

    fireEvent.changeText(getByPlaceholderText('Имя, email или логин…'), 'login1')

    await waitFor(() => expect(queryByText('Пользователь 1')).toBeTruthy())
    await waitFor(() => expect(queryByText('Пользователь 0')).toBeNull())
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue(createUsers(0))

    const { findByLabelText, findByText } = await renderWithProviders(<AdminUsersScreen />)

    expect(await findByText('Пользователи')).toBeTruthy()
    fireEvent.press(await findByLabelText('Создать пользователя'))

    expect(mockPush).toHaveBeenCalledWith('/admin/users/create')
  })

  test('shows the empty state when there are no users', async () => {
    mockFindAll.mockResolvedValue(createUsers(0))

    const { findByText } = await renderWithProviders(<AdminUsersScreen />)

    expect(await findByText('Пользователей пока нет')).toBeTruthy()
  })

  test('shows skeleton rows in the list area while the first page loads', async () => {
    mockFindAll.mockReturnValue(new Promise(() => undefined))

    const { findAllByTestId, findByText } = await renderWithProviders(<AdminUsersScreen />)

    expect(await findByText('Пользователи')).toBeTruthy()
    expect((await findAllByTestId('admin-skeleton-row')).length).toBeGreaterThan(0)
  })

  test('navigates to the detail screen on row press', async () => {
    mockFindAll.mockResolvedValue(createUsers(1))

    const { findByText } = await renderWithProviders(<AdminUsersScreen />)
    fireEvent.press(await findByText('Пользователь 0'))

    expect(mockPush).toHaveBeenCalledWith({ params: { id: 'u0' }, pathname: '/admin/users/[id]' })
  })

  test('reloads the first page when pulled to refresh', async () => {
    mockFindAll.mockResolvedValue(createUsers(0))

    const { findByText } = await renderWithProviders(<AdminUsersScreen />)
    const refreshControl = findRefreshControl(await findByText('Пользователи'))

    await act(async () => {
      await refreshControl.props.onRefresh()
    })

    await waitFor(() => expect(mockFindAll).toHaveBeenCalledTimes(2))
  })
})

import { fireEvent, waitFor } from '@testing-library/react-native'
import { featureFlagsMocks, usersMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminFlagDetailScreen } from './AdminFlagDetailScreen'

const mockFindFlags = jest.fn()
const mockRemove = jest.fn()
const mockSetOverride = jest.fn()
const mockDeleteOverride = jest.fn()
const mockFindUsers = jest.fn()
const mockBack = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({
      featureFlagsControllerDeleteOverride: mockDeleteOverride,
      featureFlagsControllerFindAll: mockFindFlags,
      featureFlagsControllerRemove: mockRemove,
      featureFlagsControllerSetOverride: mockSetOverride,
    }),
  },
  usersApi: {
    getUsers: () => ({ usersControllerFindAll: mockFindUsers }),
  },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) =>
        options?.headerRight
          ? React.createElement(React.Fragment, null, options.headerRight())
          : null,
    },
    useFocusEffect: (callback: () => () => void | void) => {
      const { useEffect } = jest.requireActual('react') as {
        useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
      }
      useEffect(callback, [callback])
    },
    useLocalSearchParams: () => ({ id: 'read' }),
    useRouter: () => ({ back: mockBack, push: jest.fn() }),
  }
})

jest.mock('entities/auth', () => ({ useRequireAdminRole: () => undefined }))

const buildFlags = () =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({
    flags: [
      featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
        enabled: true,
        id: 'read',
        key: 'read',
        title: 'Читать',
      }),
    ],
  })

const buildUsers = () =>
  usersMocks.getUsersControllerFindAllResponseMock({
    count: 1,
    users: [{ email: 'ivan@test.ru', id: 'u1', name: 'Иван', role: 'user', username: 'ivan' }],
  })

describe('<AdminFlagDetailScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindFlags.mockResolvedValue(buildFlags())
    mockFindUsers.mockResolvedValue(buildUsers())
    mockRemove.mockResolvedValue(undefined)
    mockSetOverride.mockResolvedValue(undefined)
    mockDeleteOverride.mockResolvedValue(undefined)
  })

  test('renders the flag card and the user list', async () => {
    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Читать')).toBeTruthy()
    expect(await findByText('read')).toBeTruthy()
    expect(await findByText('Иван')).toBeTruthy()
    expect(await findByText('ivan@test.ru')).toBeTruthy()
  })

  test('grant and deny set the override for a user', async () => {
    const { findByLabelText } = await renderWithProviders(<AdminFlagDetailScreen />)

    fireEvent.press(await findByLabelText('Включить: Иван'))
    await waitFor(() =>
      expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'grant' }),
    )

    fireEvent.press(await findByLabelText('Выключить: Иван'))
    await waitFor(() =>
      expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'deny' }),
    )
  })

  test('clear removes the override for a user', async () => {
    const { findByLabelText } = await renderWithProviders(<AdminFlagDetailScreen />)

    fireEvent.press(await findByLabelText('Сбросить: Иван'))

    await waitFor(() => expect(mockDeleteOverride).toHaveBeenCalledWith('read', 'u1'))
  })

  test('deletes the flag after confirmation from the header', async () => {
    const { findByLabelText, findByText, getAllByText } = await renderWithProviders(
      <AdminFlagDetailScreen />,
    )
    fireEvent.press(await findByLabelText('Удалить'))

    expect(await findByText('Удалить флаг?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('read'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})

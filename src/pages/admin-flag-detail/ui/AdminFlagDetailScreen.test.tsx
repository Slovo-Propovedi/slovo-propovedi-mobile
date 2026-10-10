import { fireEvent, waitFor } from '@testing-library/react-native'
import { featureFlagsMocks, usersMocks } from 'shared/api/generated'
import { formatRelativeDate } from 'shared/lib/format'
import { renderWithProviders } from 'shared/mocks'
import { AdminFlagDetailScreen } from './AdminFlagDetailScreen'

const mockFindFlags = jest.fn()
const mockRemove = jest.fn()
const mockSetOverride = jest.fn()
const mockDeleteOverride = jest.fn()
const mockFindOverrides = jest.fn()
const mockFindUsers = jest.fn()
const mockBack = jest.fn()

jest.mock('shared/api', () => ({
  featureFlagsApi: {
    getFeatureFlags: () => ({
      featureFlagsControllerDeleteOverride: mockDeleteOverride,
      featureFlagsControllerFindAll: mockFindFlags,
      featureFlagsControllerFindOverrides: mockFindOverrides,
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

const buildFlags = (enabled = true) =>
  featureFlagsMocks.getFeatureFlagsControllerFindAllResponseMock({
    flags: [
      featureFlagsMocks.getFeatureFlagsControllerCreateResponseMock({
        enabled,
        id: 'read',
        key: 'read',
        title: 'Читать',
      }),
    ],
  })

const buildOverride = (value: 'deny' | 'grant') =>
  featureFlagsMocks.getFeatureFlagsControllerFindOverridesResponseMock({
    overrides: [{ createdAt: '2024-01-01T00:00:00Z', flagId: 'read', userId: 'u1', value }],
  }).overrides[0]

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
    mockFindOverrides.mockResolvedValue({ overrides: [] })
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

  test('renders existing overrides with the resolved user, value and date', async () => {
    const override = buildOverride('grant')
    mockFindOverrides.mockResolvedValue({ overrides: [override] })
    mockFindFlags.mockResolvedValue(buildFlags(false))

    const { findAllByText, findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Включён')).toBeTruthy()
    expect(await findByText(formatRelativeDate(Date.parse(override.createdAt)))).toBeTruthy()
    expect(await findByText('Включено · исключение')).toBeTruthy()
    expect(await findAllByText('Иван')).toHaveLength(2)
  })

  test('shows the empty overrides message when there are none', async () => {
    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Пока нет исключений')).toBeTruthy()
  })

  test('shows the overrides load error', async () => {
    mockFindOverrides.mockRejectedValue(new Error('boom'))

    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Не удалось загрузить исключения')).toBeTruthy()
  })

  test('marks an explicit deny override in the state label', async () => {
    mockFindOverrides.mockResolvedValue({ overrides: [buildOverride('deny')] })

    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Выключено · исключение')).toBeTruthy()
  })

  test('keeps the stale overrides list and shows an inline error when refetch fails', async () => {
    mockFindOverrides
      .mockResolvedValueOnce({ overrides: [buildOverride('grant')] })
      .mockRejectedValueOnce(new Error('boom'))
    mockFindFlags.mockResolvedValue(buildFlags(false))

    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    expect(await findByText('Включён')).toBeTruthy()

    fireEvent.press(await findByText('Включено · исключение'))

    expect(await findByText('Не удалось загрузить исключения')).toBeTruthy()
    expect(await findByText('Включён')).toBeTruthy()
  })

  test('toggles a user on by granting when the flag is globally disabled', async () => {
    mockFindFlags.mockResolvedValue(buildFlags(false))

    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    fireEvent.press(await findByText('Выключено'))

    await waitFor(() =>
      expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'grant' }),
    )
  })

  test('toggles a user off by denying when the flag is globally enabled', async () => {
    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    fireEvent.press(await findByText('Включено'))

    await waitFor(() =>
      expect(mockSetOverride).toHaveBeenCalledWith('read', 'u1', { value: 'deny' }),
    )
  })

  test('toggles a user on by clearing the override when the flag is globally enabled', async () => {
    mockFindOverrides.mockResolvedValue({ overrides: [buildOverride('deny')] })

    const { findByText } = await renderWithProviders(<AdminFlagDetailScreen />)

    fireEvent.press(await findByText('Выключено · исключение'))

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

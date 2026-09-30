import { createCtx } from '@reatom/framework'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { authUserAtom, ROLE_LABELS } from 'entities/auth'
import { usersMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminUserDetailScreen } from './AdminUserDetailScreen'

const mockFindOne = jest.fn()
const mockRemove = jest.fn()
const mockChangePassword = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  usersApi: {
    getUsers: () => ({
      usersControllerChangePassword: mockChangePassword,
      usersControllerFindOne: mockFindOne,
      usersControllerRemove: mockRemove,
    }),
  },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'u1' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))

jest.mock('entities/auth', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    authUserAtom: atom(null, 'testAuthUserAtom'),
    ROLE_LABELS: {
      admin: 'Администратор',
      moderator: 'Модератор',
      user: 'Пользователь',
    },
    useRequireAdminRole: () => undefined,
  }
})

const createUser = (role: 'admin' | 'moderator' | 'user' = 'admin') =>
  usersMocks.getUsersControllerFindOneResponseMock({
    email: 'target@test.ru',
    id: 'u1',
    name: 'Цель',
    role,
    username: 'target',
  })

describe('<AdminUserDetailScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue(undefined)
    mockChangePassword.mockResolvedValue(undefined)
  })

  test('renders the stat grid with role label', async () => {
    mockFindOne.mockResolvedValue(createUser('moderator'))

    const { findAllByText, findByText } = await renderWithProviders(<AdminUserDetailScreen />)

    expect((await findAllByText('target@test.ru')).length).toBeGreaterThan(0)
    expect(await findByText('target')).toBeTruthy()
    expect(await findByText(ROLE_LABELS.moderator)).toBeTruthy()
  })

  test('shows the not-found state when the user is missing', async () => {
    mockFindOne.mockRejectedValue(new Error('404'))

    const { findByText } = await renderWithProviders(<AdminUserDetailScreen />)

    expect(await findByText('Пользователь не найден')).toBeTruthy()
  })

  test('hides the delete action for the own account', async () => {
    mockFindOne.mockResolvedValue(createUser())
    const ctx = createCtx()
    authUserAtom(ctx, createUser())

    const { findAllByText, queryByText } = await renderWithProviders(<AdminUserDetailScreen />, {
      ctx,
    })
    await findAllByText('Цель')

    expect(queryByText('Удалить')).toBeNull()
  })

  test('shows the delete action for another account', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText } = await renderWithProviders(<AdminUserDetailScreen />)

    expect(await findByText('Удалить')).toBeTruthy()
  })

  test('changes the password through the dedicated endpoint', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText, getByLabelText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText('Сменить пароль'))

    expect(await findByText('Смена пароля')).toBeTruthy()
    fireEvent.changeText(
      await getByLabelText('Новый пароль', { includeHiddenElements: true }),
      'secret123',
    )
    fireEvent.press(await findByText('Сохранить'))

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith('u1', { password: 'secret123' }),
    )
  })

  test('blocks an empty password on the client', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText('Сменить пароль'))
    fireEvent.press(await findByText('Сохранить'))

    expect(await findByText('Введите новый пароль.')).toBeTruthy()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  test('deletes another account after confirmation', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText, getAllByText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText('Удалить'))

    expect(await findByText('Удалить пользователя?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('u1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})

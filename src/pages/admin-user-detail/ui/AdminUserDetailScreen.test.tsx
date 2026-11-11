import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { authUserAtom, ROLE_LABELS } from 'entities/auth'
import { usersMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminUserDetailScreen } from './AdminUserDetailScreen'

const mockFindOne = jest.fn()
const mockRemove = jest.fn()
const mockChangePassword = jest.fn()
const mockSignOut = jest.fn()
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

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    Stack: {
      // Delete now lives in the header (headerRight). Render it so the test can
      // assert both its presence and its absence for the own account.
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
    useLocalSearchParams: () => ({ id: 'u1' }),
    useRouter: () => ({ back: mockBack, push: mockPush }),
  }
})

jest.mock('entities/auth', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    authUserAtom: atom(null, 'testAuthUserAtom'),
    ROLE_LABELS: {
      admin: 'Администратор',
      moderator: 'Модератор',
      user: 'Пользователь',
    },
    signOut: (...args: unknown[]) => mockSignOut(...args),
    useRequireAdminRole: () => undefined,
  }
})

const CHANGE_PASSWORD_LABEL = 'Сменить пароль'
const PASSWORD_DIALOG_TITLE = 'Смена пароля'
const NEW_PASSWORD_LABEL = 'Новый пароль'
const SAVE_LABEL = 'Сохранить'

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

  test('hides the delete action in the header for the own account', async () => {
    mockFindOne.mockResolvedValue(createUser())
    const ctx = createCtx()
    authUserAtom(ctx, createUser())

    const { findAllByText, queryByLabelText } = await renderWithProviders(
      <AdminUserDetailScreen />,
      { ctx },
    )
    await findAllByText('Цель')

    expect(queryByLabelText('Удалить')).toBeNull()
  })

  test('shows the delete action in the header for another account', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByLabelText } = await renderWithProviders(<AdminUserDetailScreen />)

    expect(await findByLabelText('Удалить')).toBeTruthy()
  })

  test('changes the password through the dedicated endpoint', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText, getByLabelText } = await renderWithProviders(<AdminUserDetailScreen />)
    await act(async () => {
      await fireEvent.press(await findByText(CHANGE_PASSWORD_LABEL))
    })

    expect(await findByText(PASSWORD_DIALOG_TITLE)).toBeTruthy()
    await fireEvent.changeText(
      await getByLabelText(NEW_PASSWORD_LABEL, { includeHiddenElements: true }),
      'secret123',
    )
    await act(async () => {
      await fireEvent.press(await findByText(SAVE_LABEL))
    })

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith('u1', { password: 'secret123' }),
    )
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  test('signs out after changing the own password', async () => {
    const own = createUser()
    mockFindOne.mockResolvedValue(own)
    mockSignOut.mockResolvedValue(undefined)
    const ctx = createCtx()
    authUserAtom(ctx, own)

    const { findByText, getByLabelText } = await renderWithProviders(<AdminUserDetailScreen />, {
      ctx,
    })
    await act(async () => {
      await fireEvent.press(await findByText(CHANGE_PASSWORD_LABEL))
    })
    await waitFor(() =>
      expect(getByLabelText(NEW_PASSWORD_LABEL, { includeHiddenElements: true })).toBeTruthy(),
    )
    await fireEvent.changeText(
      getByLabelText(NEW_PASSWORD_LABEL, { includeHiddenElements: true }),
      'secret123',
    )
    await act(async () => {
      await fireEvent.press(await findByText(SAVE_LABEL))
    })

    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1))
  })

  test('blocks an empty password on the client', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText(CHANGE_PASSWORD_LABEL))
    fireEvent.press(await findByText(SAVE_LABEL))

    expect(await findByText('Введите новый пароль.')).toBeTruthy()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  test('blocks a password shorter than 8 characters on the client', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText, getByLabelText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText(CHANGE_PASSWORD_LABEL))
    expect(await findByText(PASSWORD_DIALOG_TITLE)).toBeTruthy()
    fireEvent.changeText(
      await getByLabelText(NEW_PASSWORD_LABEL, { includeHiddenElements: true }),
      'short',
    )
    fireEvent.press(await findByText(SAVE_LABEL))

    expect(await findByText('Пароль должен содержать минимум 8 символов.')).toBeTruthy()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  test('blocks a password longer than 200 characters on the client', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByText, getByLabelText } = await renderWithProviders(<AdminUserDetailScreen />)
    fireEvent.press(await findByText(CHANGE_PASSWORD_LABEL))
    expect(await findByText(PASSWORD_DIALOG_TITLE)).toBeTruthy()
    fireEvent.changeText(
      await getByLabelText(NEW_PASSWORD_LABEL, { includeHiddenElements: true }),
      'a'.repeat(201),
    )
    fireEvent.press(await findByText(SAVE_LABEL))

    expect(await findByText('Пароль должен содержать не более 200 символов.')).toBeTruthy()
    expect(mockChangePassword).not.toHaveBeenCalled()
  })

  test('deletes another account after confirmation', async () => {
    mockFindOne.mockResolvedValue(createUser())

    const { findByLabelText, findByText, getAllByText } = await renderWithProviders(
      <AdminUserDetailScreen />,
    )
    await act(async () => {
      await fireEvent.press(await findByLabelText('Удалить'))
    })

    expect(await findByText('Удалить пользователя?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    await act(async () => {
      await fireEvent.press(confirmButtons[confirmButtons.length - 1])
    })

    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('u1'))
    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})

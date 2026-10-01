import { createCtx } from '@reatom/framework'
import { fireEvent, userEvent, waitFor } from '@testing-library/react-native'
import { useRouter } from 'expo-router'
import { TextInput } from 'react-native'
import { signIn } from 'entities/auth'
import { authMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { showToast } from 'shared/model'
import { AdminLoginScreen } from './AdminLoginScreen'

const mockReplace = jest.fn()

jest.mock('expo-router', () => ({ useRouter: jest.fn() }))

jest.mock('shared/model', () => ({
  showToast: jest.fn(),
}))

jest.mock('entities/auth', () => ({
  signIn: jest.fn(),
}))

const mockedUseRouter = jest.mocked(useRouter)
const mockedSignIn = jest.mocked(signIn)
const mockedShowToast = jest.mocked(showToast)

const PASSWORD_PLACEHOLDER = '••••••••'
const USERNAME_PLACEHOLDER = 'admin'
const USERNAME = 'admin'
const PASSWORD = 'secret-password'
const SUBMIT_LABEL = 'Войти'

describe('<AdminLoginScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>)
  })

  test('renders username and password fields', async () => {
    const ctx = createCtx()

    const { getByPlaceholderText, getByText } = await renderWithProviders(<AdminLoginScreen />, {
      ctx,
    })

    expect(getByText('Имя пользователя')).toBeTruthy()
    expect(getByText('Пароль')).toBeTruthy()
    expect(getByPlaceholderText(USERNAME_PLACEHOLDER)).toBeTruthy()
    expect(getByPlaceholderText(PASSWORD_PLACEHOLDER)).toBeTruthy()
    expect(getByText(SUBMIT_LABEL)).toBeTruthy()
  })

  test('submits the entered credentials through signIn', async () => {
    const ctx = createCtx()
    const user = userEvent.setup()
    mockedSignIn.mockResolvedValue(authMocks.getAuthControllerSignInResponseMock().user)

    const { getByPlaceholderText, getByText } = await renderWithProviders(<AdminLoginScreen />, {
      ctx,
    })

    await user.type(getByPlaceholderText(USERNAME_PLACEHOLDER), USERNAME)
    await user.type(getByPlaceholderText(PASSWORD_PLACEHOLDER), PASSWORD)
    await user.press(getByText(SUBMIT_LABEL))

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith(expect.anything(), {
        password: PASSWORD,
        username: USERNAME,
      })
    })
  })

  test('submits when Enter is pressed in the password field', async () => {
    const ctx = createCtx()
    const user = userEvent.setup()
    mockedSignIn.mockResolvedValue(authMocks.getAuthControllerSignInResponseMock().user)

    const { getByPlaceholderText } = await renderWithProviders(<AdminLoginScreen />, { ctx })

    await user.type(getByPlaceholderText(USERNAME_PLACEHOLDER), USERNAME)
    await user.type(getByPlaceholderText(PASSWORD_PLACEHOLDER), PASSWORD)
    fireEvent(getByPlaceholderText(PASSWORD_PLACEHOLDER), 'submitEditing')

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith(expect.anything(), {
        password: PASSWORD,
        username: USERNAME,
      })
    })
  })

  test('moves focus to the password field when Enter is pressed in the username field', async () => {
    const ctx = createCtx()
    const user = userEvent.setup()
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus')

    const { getByPlaceholderText } = await renderWithProviders(<AdminLoginScreen />, { ctx })

    await user.type(getByPlaceholderText(USERNAME_PLACEHOLDER), USERNAME)
    fireEvent(getByPlaceholderText(USERNAME_PLACEHOLDER), 'submitEditing')

    expect(focusSpy).toHaveBeenCalledTimes(1)
    focusSpy.mockRestore()
  })

  test('on success shows a toast and navigates back to /more, not /admin', async () => {
    const ctx = createCtx()
    const user = userEvent.setup()
    mockedSignIn.mockResolvedValue(authMocks.getAuthControllerSignInResponseMock().user)

    const { getByPlaceholderText, getByText } = await renderWithProviders(<AdminLoginScreen />, {
      ctx,
    })

    await user.type(getByPlaceholderText(USERNAME_PLACEHOLDER), USERNAME)
    await user.type(getByPlaceholderText(PASSWORD_PLACEHOLDER), PASSWORD)
    await user.press(getByText(SUBMIT_LABEL))

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith(expect.anything(), 'Вход выполнен')
    })
    expect(mockReplace).toHaveBeenCalledWith('/more')
    expect(mockReplace).not.toHaveBeenCalledWith('/admin')
  })

  test('on failure keeps the user on the login screen', async () => {
    const ctx = createCtx()
    const user = userEvent.setup()
    mockedSignIn.mockRejectedValue(new Error('Неверные учётные данные'))

    const { getByPlaceholderText, getByText } = await renderWithProviders(<AdminLoginScreen />, {
      ctx,
    })

    await user.type(getByPlaceholderText(USERNAME_PLACEHOLDER), USERNAME)
    await user.type(getByPlaceholderText(PASSWORD_PLACEHOLDER), PASSWORD)
    await user.press(getByText(SUBMIT_LABEL))

    await waitFor(() => {
      expect(getByText('Неверные учётные данные')).toBeTruthy()
    })
    expect(mockReplace).not.toHaveBeenCalled()
    expect(mockedShowToast).not.toHaveBeenCalled()
  })
})

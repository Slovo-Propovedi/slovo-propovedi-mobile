import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { authStatusAtom, authUserAtom, signOut } from 'entities/auth'
import { authMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { SettingsScreen } from './SettingsScreen'

const THEME_SETTINGS_TITLE = 'Тема оформления'
const ADMIN_ENTRY_TITLE = 'Перейти в интерфейс администратора'
const ADMIN_SIGN_OUT_TITLE = 'Выйти из аккаунта админа'

const mockOpenAdminInterface = jest.fn()

jest.mock('entities/auth', () => ({
  ...jest.requireActual('entities/auth'),
  signOut: jest.fn(),
  useAdminEntry: () => ({ openAdminInterface: mockOpenAdminInterface }),
}))

const mockedSignOut = jest.mocked(signOut)

describe('<SettingsScreen>', () => {
  beforeEach(() => {
    mockOpenAdminInterface.mockClear()
    mockedSignOut.mockClear()
  })

  test('renders the theme settings item', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText(THEME_SETTINGS_TITLE)).toBeTruthy()
  })

  test('renders the server URL settings section', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText('URL сервера API')).toBeTruthy()
  })

  test('theme settings item opens the theme dialog', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByText(THEME_SETTINGS_TITLE))
    expect(getByText('Светлая')).toBeTruthy()
    expect(getByText('Тёмная')).toBeTruthy()
    expect(getByText('Как в системе')).toBeTruthy()
  })

  test('shows the admin entry item and opens login flow when unauthenticated', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByText(ADMIN_ENTRY_TITLE))
    expect(mockOpenAdminInterface).toHaveBeenCalledTimes(1)
  })

  test('shows the sign-out item when authenticated', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' }))
    authStatusAtom(ctx, 'authenticated')

    const { getByText, queryByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(queryByText(ADMIN_ENTRY_TITLE)).toBeNull()

    await fireEvent.press(getByText(ADMIN_SIGN_OUT_TITLE))
    expect(mockedSignOut).toHaveBeenCalledTimes(1)
  })
})

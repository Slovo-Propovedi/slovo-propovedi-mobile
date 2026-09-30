import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { authMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { MoreScreen } from './MoreScreen'

const ADMIN_PANEL_LABEL = 'В админ панель'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('entities/auth', () => ({
  ...jest.requireActual('entities/auth'),
  restoreSession: jest.fn(),
}))

const mockedRestoreSession = jest.mocked(restoreSession)

jest.mock('shared/ui/theme', () => ({
  COLORS: { disabled: '#ccc', white: '#fff' },
  FONT_SIZES: { base: 16, lg: 20, sm: 12 },
  INDENTS: { high: 16, low: 8, medium: 12 },
  RADIUSES: { middle: 12 },
  useTheme: () => ({
    currentTheme: {
      background: '#ffffff',
      primary: '#f16031',
      surface: '#f5f5f5',
      text: '#000000',
      textMuted: '#999999',
    },
  }),
}))

jest.mock('shared/config', () => ({
  APP_NAME: 'TestApp',
  APP_VERSION: '1.0.0',
}))

const setAuthenticatedUser = (ctx: ReturnType<typeof createCtx>, role: 'admin' | 'moderator') => {
  authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role }))
  authStatusAtom(ctx, 'authenticated')
}

describe('<MoreScreen>', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockedRestoreSession.mockClear()
    mockedRestoreSession.mockResolvedValue(null)
  })

  test('renders app name, version and description in the header', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('TestApp')).toBeTruthy()
    expect(getByText('v1.0.0')).toBeTruthy()
    expect(getByText('Приложение для прослушивания и чтения проповедей')).toBeTruthy()
  })

  test('does not render the admin panel button when unauthenticated', async () => {
    const ctx = createCtx()
    authStatusAtom(ctx, 'unauthenticated')

    const { queryByLabelText } = await renderWithProviders(<MoreScreen />, { ctx })

    expect(queryByLabelText(ADMIN_PANEL_LABEL)).toBeNull()
  })

  test('does not render the admin panel button for a regular user', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'user' }))
    authStatusAtom(ctx, 'authenticated')

    const { queryByLabelText } = await renderWithProviders(<MoreScreen />, { ctx })

    expect(queryByLabelText(ADMIN_PANEL_LABEL)).toBeNull()
  })

  test('renders the admin panel button for an admin user', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'admin')

    const { getByLabelText } = await renderWithProviders(<MoreScreen />, { ctx })

    expect(getByLabelText(ADMIN_PANEL_LABEL)).toBeTruthy()
  })

  test('renders the admin panel button for a moderator user', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'moderator')

    const { getByLabelText } = await renderWithProviders(<MoreScreen />, { ctx })

    expect(getByLabelText(ADMIN_PANEL_LABEL)).toBeTruthy()
  })

  test('admin panel button navigates to /admin on press', async () => {
    const ctx = createCtx()
    setAuthenticatedUser(ctx, 'admin')

    const { getByLabelText } = await renderWithProviders(<MoreScreen />, { ctx })

    await fireEvent.press(getByLabelText(ADMIN_PANEL_LABEL))
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  test('restores the session on mount when auth status is idle', async () => {
    const ctx = createCtx()

    await renderWithProviders(<MoreScreen />, { ctx })

    expect(mockedRestoreSession).toHaveBeenCalledTimes(1)
  })

  test('renders offline menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('Офлайн')).toBeTruthy()
  })

  test('offline item navigates to /offline on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    await fireEvent.press(getByText('Офлайн'))
    expect(mockPush).toHaveBeenCalledWith('/offline')
  })

  test('renders history menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('История прослушивания')).toBeTruthy()
  })

  test('history item navigates to /history on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    await fireEvent.press(getByText('История прослушивания'))
    expect(mockPush).toHaveBeenCalledWith('/history')
  })

  test('renders settings menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('Настройки')).toBeTruthy()
  })

  test('settings item navigates to /settings on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    await fireEvent.press(getByText('Настройки'))
    expect(mockPush).toHaveBeenCalledWith('/settings')
  })

  test('renders about menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('О приложении')).toBeTruthy()
  })

  test('about item navigates to /about on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    await fireEvent.press(getByText('О приложении'))
    expect(mockPush).toHaveBeenCalledWith('/about')
  })

  test('renders share menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('Поделиться приложением')).toBeTruthy()
  })

  test('share item navigates to /share on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    await fireEvent.press(getByText('Поделиться приложением'))
    expect(mockPush).toHaveBeenCalledWith('/share')
  })
})

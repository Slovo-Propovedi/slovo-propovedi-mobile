import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { View } from 'react-native'
import { type TestInstance } from 'test-renderer'
import { authStatusAtom, authUserAtom, signOut, useAdminEntry } from 'entities/auth'
import { authMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { SettingsHeaderMenu } from './SettingsHeaderMenu'

const mockOpenAdminInterface = jest.fn()

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
    MaterialCommunityIcons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('entities/auth', () => ({
  ...jest.requireActual('entities/auth'),
  signOut: jest.fn(),
  useAdminEntry: jest.fn(),
}))

const mockedSignOut = jest.mocked(signOut)
const mockedUseAdminEntry = jest.mocked(useAdminEntry)

const MENU_LABEL = 'Меню администратора'
const ADMIN_ENTRY_TEXT = 'Войти в аккаунт администратора'
const ADMIN_SIGN_OUT_TEXT = 'Выйти из аккаунта админа'

const measureMenu = async (container: TestInstance) => {
  const layoutView = container.queryAll(node => node.props.onLayout !== undefined, {
    includeSelf: true,
  })[0]
  await act(async () => {
    fireEvent(layoutView, 'layout', {
      nativeEvent: { layout: { height: 100, width: 180, x: 0, y: 0 } },
    })
  })
}

describe('<SettingsHeaderMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseAdminEntry.mockReturnValue({ openAdminInterface: mockOpenAdminInterface })
    // In Jest, host-component measureInWindow never fires its callback, so the
    // header menu would never open. Mock the measurement with fixed geometry.
    jest
      .spyOn(View.prototype, 'measureInWindow')
      .mockImplementation((cb: (x: number, y: number, width: number, height: number) => void) => {
        cb(300, 100, 44, 44)
        return undefined
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the kebab header button', async () => {
    const { getByRole } = await renderWithProviders(<SettingsHeaderMenu />)

    expect(getByRole('button', { name: MENU_LABEL })).toBeTruthy()
  })

  test('opens the menu with the admin entry when unauthenticated', async () => {
    const ctx = createCtx()
    authStatusAtom(ctx, 'unauthenticated')

    const { getByRole, getByText } = await renderWithProviders(<SettingsHeaderMenu />, { ctx })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: MENU_LABEL }))
    })

    expect(await waitFor(() => getByText(ADMIN_ENTRY_TEXT))).toBeTruthy()
  })

  test('unauthenticated entry press opens the admin interface', async () => {
    const ctx = createCtx()
    authStatusAtom(ctx, 'unauthenticated')

    const { container, getByRole, getByText } = await renderWithProviders(<SettingsHeaderMenu />, {
      ctx,
    })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: MENU_LABEL }))
    })
    const item = await waitFor(() => getByText(ADMIN_ENTRY_TEXT))
    await measureMenu(container)
    fireEvent.press(item)

    expect(mockOpenAdminInterface).toHaveBeenCalledTimes(1)
  })

  test('shows the sign-out item when authenticated', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' }))
    authStatusAtom(ctx, 'authenticated')

    const { getByRole, getByText, queryByText } = await renderWithProviders(
      <SettingsHeaderMenu />,
      { ctx },
    )

    await act(async () => {
      fireEvent.press(getByRole('button', { name: MENU_LABEL }))
    })

    expect(await waitFor(() => getByText(ADMIN_SIGN_OUT_TEXT))).toBeTruthy()
    expect(queryByText(ADMIN_ENTRY_TEXT)).toBeNull()
  })

  test('authenticated sign-out press calls signOut', async () => {
    const ctx = createCtx()
    authUserAtom(ctx, authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' }))
    authStatusAtom(ctx, 'authenticated')

    const { container, getByRole, getByText } = await renderWithProviders(<SettingsHeaderMenu />, {
      ctx,
    })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: MENU_LABEL }))
    })
    const item = await waitFor(() => getByText(ADMIN_SIGN_OUT_TEXT))
    await measureMenu(container)
    fireEvent.press(item)

    expect(mockedSignOut).toHaveBeenCalledTimes(1)
  })
})

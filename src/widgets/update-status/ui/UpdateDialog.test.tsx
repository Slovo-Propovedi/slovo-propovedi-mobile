import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import * as ApkInstaller from 'apk-installer'
import { Linking } from 'react-native'
import { useUpdateInstall } from 'features/app-update'
import { renderWithProviders } from 'shared/mocks'
import { latestVersionAtom, releaseUrlAtom, type UpdateState } from 'shared/model'
import { UpdateDialog } from './UpdateDialog'

const RELEASE_URL = 'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/tag/v0.4.0'
const LATEST_VERSION = '0.4.0'
const CONFIRM_BUTTON_TEXT = 'Обновить'
const RELEASES_LINK_TEXT = 'Все версии обновлений'

jest.mock('features/app-update', () => ({
  useUpdateInstall: jest.fn(),
}))

const mockedUseUpdateInstall = useUpdateInstall as jest.MockedFunction<typeof useUpdateInstall>

const buildHookReturn = (overrides?: Partial<ReturnType<typeof useUpdateInstall>>) => ({
  error: null,
  progress: 0,
  reset: jest.fn(),
  startUpdate: jest.fn(),
  updateState: 'idle' as UpdateState,
  ...overrides,
})

describe('<UpdateDialog>', () => {
  const onClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUpdateInstall.mockReturnValue(buildHookReturn())
  })

  const renderDialog = async (
    visible = true,
    hookOverrides?: Partial<ReturnType<typeof useUpdateInstall>>,
  ) => {
    mockedUseUpdateInstall.mockReturnValue(buildHookReturn(hookOverrides))

    const ctx = createCtx()
    latestVersionAtom(ctx, LATEST_VERSION)
    releaseUrlAtom(ctx, RELEASE_URL)

    return renderWithProviders(<UpdateDialog visible={visible} onClose={onClose} />, { ctx })
  }

  test('renders nothing when not visible', async () => {
    const { queryByText } = await renderDialog(false)

    expect(queryByText('Доступно обновление')).toBeNull()
  })

  test('renders the confirm state when visible', async () => {
    const { getByRole, getByText } = await renderDialog()

    expect(getByText('Доступно обновление')).toBeTruthy()
    expect(getByText(/Версия 0\.4\.0 доступна для установки/)).toBeTruthy()
    expect(getByRole('button', { name: CONFIRM_BUTTON_TEXT })).toBeTruthy()
    expect(getByRole('button', { name: 'Не обновлять' })).toBeTruthy()
    expect(getByRole('link', { name: RELEASES_LINK_TEXT })).toBeTruthy()
  })

  test('calls startUpdate when the confirm button is pressed', async () => {
    const startUpdate = jest.fn()
    const { getByRole } = await renderDialog(true, { startUpdate })

    fireEvent.press(getByRole('button', { name: CONFIRM_BUTTON_TEXT }))

    expect(startUpdate).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when the cancel button is pressed', async () => {
    const { getByRole } = await renderDialog()

    fireEvent.press(getByRole('button', { name: 'Не обновлять' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('opens the release URL when the releases link is pressed', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    const { getByRole } = await renderDialog()

    fireEvent.press(getByRole('link', { name: RELEASES_LINK_TEXT }))

    expect(openURLSpy).toHaveBeenCalledWith(RELEASE_URL)
  })

  test('does not open non-https URLs from the releases link', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

    const ctx = createCtx()
    latestVersionAtom(ctx, LATEST_VERSION)
    releaseUrlAtom(ctx, 'http://evil.com')

    const { getByRole } = await renderWithProviders(<UpdateDialog visible onClose={onClose} />, {
      ctx,
    })

    fireEvent.press(getByRole('link', { name: RELEASES_LINK_TEXT }))

    expect(openURLSpy).not.toHaveBeenCalled()
  })

  test('shows the download percentage in the progress state', async () => {
    const { getByText, queryByRole } = await renderDialog(true, {
      progress: 42,
      updateState: 'downloading',
    })

    expect(getByText('Обновление')).toBeTruthy()
    expect(getByText('Загрузка... 42%')).toBeTruthy()
    expect(queryByRole('button', { name: CONFIRM_BUTTON_TEXT })).toBeNull()
  })

  test('shows the extracting status text in the extracting state', async () => {
    const { getByText } = await renderDialog(true, { updateState: 'extracting' })

    expect(getByText('Распаковка...')).toBeTruthy()
  })

  test('renders the permission state with explainer and actions', async () => {
    const { getByRole, getByText } = await renderDialog(true, { updateState: 'permission' })

    expect(getByText('Требуется разрешение')).toBeTruthy()
    expect(getByText(/разрешите установку из этого источника/)).toBeTruthy()
    expect(getByRole('button', { name: 'Открыть настройки' })).toBeTruthy()
    expect(getByRole('button', { name: 'Не сейчас' })).toBeTruthy()
  })

  test('opens install permission settings from the permission state', async () => {
    const { getByRole } = await renderDialog(true, { updateState: 'permission' })

    fireEvent.press(getByRole('button', { name: 'Открыть настройки' }))

    expect(ApkInstaller.openInstallPermissionSettings).toHaveBeenCalledTimes(1)
  })

  test('closes and resets from the permission state', async () => {
    const reset = jest.fn()
    const { getByRole } = await renderDialog(true, { reset, updateState: 'permission' })

    fireEvent.press(getByRole('button', { name: 'Не сейчас' }))

    expect(reset).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('shows the error message and fallback actions in the error state', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
    const reset = jest.fn()
    const { getByRole, getByText } = await renderDialog(true, {
      error: 'Ошибка сети',
      reset,
      updateState: 'error',
    })

    expect(getByText('Ошибка обновления')).toBeTruthy()
    expect(getByText('Ошибка сети')).toBeTruthy()

    fireEvent.press(getByRole('button', { name: 'Открыть в браузере' }))
    expect(openURLSpy).toHaveBeenCalledWith(RELEASE_URL)

    fireEvent.press(getByRole('button', { name: 'Закрыть' }))
    expect(reset).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { SettingsScreen } from './SettingsScreen'

// Секция бэкапа тянет экспорт/импорт (нативный expo-audio) — изолируем экран.
jest.mock('features/settings-backup', () => ({
  BackupSection: () => null,
}))

const THEME_SETTINGS_TITLE = 'Тема оформления'
const SERVER_URL_TITLE = 'URL сервера API'
const ADMIN_ENTRY_TITLE = 'Войти в аккаунт администратора'

describe('<SettingsScreen>', () => {
  test('renders the theme settings item', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText(THEME_SETTINGS_TITLE)).toBeTruthy()
  })

  test('renders the server URL settings section', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText(SERVER_URL_TITLE)).toBeTruthy()
  })

  test('theme settings item opens the theme dialog', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByText(THEME_SETTINGS_TITLE))
    expect(getByText('Светлая')).toBeTruthy()
    expect(getByText('Тёмная')).toBeTruthy()
    expect(getByText('Как в системе')).toBeTruthy()
  })

  test('does not render the admin entry on the screen body', async () => {
    const ctx = createCtx()

    const { queryByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(queryByText(ADMIN_ENTRY_TITLE)).toBeNull()
  })
})

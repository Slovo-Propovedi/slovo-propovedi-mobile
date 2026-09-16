import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { SettingsScreen } from './SettingsScreen'

const THEME_SETTINGS_ITEM_ID = 'theme-settings-item'

describe('<SettingsScreen>', () => {
  test('renders the theme settings item', async () => {
    const ctx = createCtx()

    const { getByTestId, getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByTestId(THEME_SETTINGS_ITEM_ID)).toBeTruthy()
    expect(getByText('Тема оформления')).toBeTruthy()
  })

  test('renders the server URL settings section', async () => {
    const ctx = createCtx()

    const { getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    expect(getByText('URL сервера API')).toBeTruthy()
  })

  test('theme settings item opens the theme dialog', async () => {
    const ctx = createCtx()

    const { getByTestId, getByText } = await renderWithProviders(<SettingsScreen />, { ctx })

    await fireEvent.press(getByTestId(THEME_SETTINGS_ITEM_ID))
    expect(getByText('Светлая')).toBeTruthy()
    expect(getByText('Тёмная')).toBeTruthy()
    expect(getByText('Как в системе')).toBeTruthy()
  })
})

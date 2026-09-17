import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { SettingsScreen } from './SettingsScreen'

const THEME_SETTINGS_TITLE = 'Тема оформления'

describe('<SettingsScreen>', () => {
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
})

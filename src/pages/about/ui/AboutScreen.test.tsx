import { fireEvent } from '@testing-library/react-native'
import { openURL } from 'expo-linking'
import { renderWithProviders } from 'shared/mocks'
import { AboutScreen } from './AboutScreen'

const mockOpenURL = jest.mocked(openURL)

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}))

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({ uri: 'file:///icon.png' })),
  },
}))

jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('shared/config', () => ({
  APP_NAME: 'TestApp',
  APP_VERSION: '1.0.0',
  COPYRIGHT_HOLDER: 'Test Holder',
  COPYRIGHT_YEAR: '2026',
  LICENSE_NAME: 'GPL-3.0-or-later',
  LICENSE_URL: 'https://example.com/license',
  PROJECT_URL: 'https://example.com/project',
}))

describe('<AboutScreen>', () => {
  beforeEach(() => {
    mockOpenURL.mockReset()
    mockOpenURL.mockResolvedValue(true)
  })

  test('renders app name and version', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    expect(getByText('TestApp')).toBeTruthy()
    expect(getByText('Версия 1.0.0')).toBeTruthy()
  })

  test('renders the info section', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    expect(getByText('Информация')).toBeTruthy()
    expect(getByText(/бесплатное приложение с открытым исходным кодом/)).toBeTruthy()
  })

  test('renders the source code section with its link', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    expect(getByText('Исходный код')).toBeTruthy()
    expect(getByText('Исходный код на Forgejo')).toBeTruthy()
  })

  test('renders the license link', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    expect(getByText('Лицензия GPL-3.0-or-later')).toBeTruthy()
  })

  test('renders the copyright footer', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    expect(getByText('© 2026 Test Holder')).toBeTruthy()
  })

  test('source code link opens the project URL', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    await fireEvent.press(getByText('Исходный код на Forgejo'))
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/project')
  })

  test('license link opens the license URL', async () => {
    const { getByText } = await renderWithProviders(<AboutScreen />)
    await fireEvent.press(getByText('Лицензия GPL-3.0-or-later'))
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/license')
  })
})

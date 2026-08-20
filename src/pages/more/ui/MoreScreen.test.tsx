import { fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks'
import { MoreScreen } from './MoreScreen'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('shared/ui/theme', () => ({
  COLORS: { disabled: '#ccc' },
  FONT_SIZES: { base: 16, lg: 20, sm: 12 },
  INDENTS: { high: 16, low: 8, medium: 12 },
  useTheme: () => ({
    currentTheme: {
      background: '#ffffff',
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

describe('<MoreScreen>', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  test('renders history menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('История прослушивания')).toBeTruthy()
  })

  test('history item navigates to /history on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    fireEvent.press(getByText('История прослушивания'))
    expect(mockPush).toHaveBeenCalledWith('/history')
  })

  test('renders settings menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('Настройки')).toBeTruthy()
  })

  test('settings item navigates to /settings on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    fireEvent.press(getByText('Настройки'))
    expect(mockPush).toHaveBeenCalledWith('/settings')
  })

  test('renders about menu item', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    expect(getByText('О приложении')).toBeTruthy()
  })

  test('about item navigates to /about on press', async () => {
    const { getByText } = await renderWithProviders(<MoreScreen />)
    fireEvent.press(getByText('О приложении'))
    expect(mockPush).toHaveBeenCalledWith('/about')
  })
})

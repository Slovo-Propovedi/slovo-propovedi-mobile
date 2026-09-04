import { act, fireEvent } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import * as Clipboard from 'expo-clipboard'
import { View as MockView } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import type { LatestReleaseState } from '../lib/useLatestReleaseUrl'
import { ShareScreen } from './ShareScreen'

const mockUseLatestReleaseUrl = jest.fn()
const mockRetry = jest.fn()
const LANDING_URL = 'https://slovo-propovedi.ru/'
const RELEASE_URL =
  'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest'

const READY_STATE: LatestReleaseState = {
  release: {
    body: 'Release notes',
    htmlUrl: RELEASE_URL,
    name: 'Релиз 1.2.0',
    publishedAt: '2026-01-01T00:00:00Z',
    tagName: 'v1.2.0',
    version: '1.2.0',
    zipDownloadUrl: null,
  },
  status: 'ready',
}

jest.mock('../lib/useLatestReleaseUrl', () => ({
  useLatestReleaseUrl: () => mockUseLatestReleaseUrl(),
}))

jest.mock('react-native-qrcode-svg', () => ({
  __esModule: true,
  default: () => <MockView testID='qr-code' />,
}))

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}))

jest.mock('shared/ui/theme', () => ({
  FONT_SIZES: { base: 14, lg: 18, md: 16, sm: 12 },
  INDENTS: { high: 24, highest: 32, low: 8, lowest: 4, medium: 16, middle: 12 },
  RADIUSES: { high: 16, large: 20, low: 8, middle: 12, round: 999 },
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

describe('<ShareScreen>', () => {
  beforeEach(() => {
    mockRetry.mockClear()
    ;(Clipboard.setStringAsync as jest.Mock).mockReset()
  })

  test('landing section is expanded by default, release section is collapsed', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'loading' } })

    const { getByTestId, getByText, queryByText } = await renderWithProviders(<ShareScreen />)

    expect(getByText('Сайт')).toBeTruthy()
    expect(getByText(LANDING_URL)).toBeTruthy()
    expect(getByTestId('qr-code')).toBeTruthy()
    expect(getByText('Приложение')).toBeTruthy()
    expect(queryByText('Не удалось загрузить информацию о релизе')).toBeNull()
  })

  test('pressing the landing header collapses it', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'loading' } })

    const { getByTestId, queryByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Сайт'))

    expect(queryByText(LANDING_URL)).toBeNull()
  })

  test('expanding the release section collapses the landing section', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: READY_STATE })

    const { getByTestId, queryByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))

    expect(queryByText(LANDING_URL)).toBeNull()
    expect(queryByText('Релиз 1.2.0')).toBeTruthy()
  })

  test('landing copy button copies the landing url and shows feedback', async () => {
    ;(Clipboard.setStringAsync as jest.Mock).mockResolvedValue(true)
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'loading' } })

    const { getByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByText('Скопировать ссылку'))
    await act(async () => {})

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(LANDING_URL)
    expect(getByText('Скопировано')).toBeTruthy()
  })

  test('expanding the release section while loading shows no error message', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'loading' } })

    const { getByTestId, queryByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))

    expect(queryByText('Не удалось загрузить информацию о релизе')).toBeNull()
  })

  test('expanding the release section on error shows error message and retry button', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'error' } })

    const { getByTestId, getByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))

    expect(getByText('Не удалось загрузить информацию о релизе')).toBeTruthy()
    expect(getByText('Повторить')).toBeTruthy()
  })

  test('retry button calls retry', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: { status: 'error' } })

    const { getByTestId, getByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))
    await fireEvent.press(getByText('Повторить'))

    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  test('expanding the release section when ready shows release name, version, url and qr code', async () => {
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: READY_STATE })

    const { getAllByTestId, getByTestId, getByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))

    expect(getByText('Релиз 1.2.0')).toBeTruthy()
    expect(getByText('Версия 1.2.0')).toBeTruthy()
    expect(getByText(RELEASE_URL)).toBeTruthy()
    expect(getAllByTestId('qr-code')).toHaveLength(1)
  })

  test('release copy button copies release url to clipboard and shows feedback', async () => {
    ;(Clipboard.setStringAsync as jest.Mock).mockResolvedValue(true)
    mockUseLatestReleaseUrl.mockReturnValue({ retry: mockRetry, state: READY_STATE })

    const { getByTestId, getByText } = await renderWithProviders(<ShareScreen />)
    await fireEvent.press(getByTestId('share-section-header-Приложение'))
    await fireEvent.press(getByText('Скопировать ссылку'))
    await act(async () => {})

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(RELEASE_URL)
    expect(getByText('Скопировано')).toBeTruthy()
  })
})

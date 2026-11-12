import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { PlaylistShareModal } from './PlaylistShareModal'

const mockQrCodeValue = jest.fn()
let mockIsShareSupported = true

jest.mock('react-native-qrcode-svg', () => {
  const { View } = jest.requireActual('react-native')
  return {
    __esModule: true,
    default: ({ value }: { value: string }) => {
      mockQrCodeValue(value)
      return <View testID='qr-code' />
    },
  }
})

jest.mock('shared/lib/isShareSupported', () => ({
  get isShareSupported() {
    return mockIsShareSupported
  },
}))

jest.mock('features/onboarding', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    OnboardingTarget: ({ children, id }: { children: React.ReactNode; id?: string }) => (
      <>
        {id === undefined ? null : <Text>{id}</Text>}
        {children}
      </>
    ),
  }
})

const URL = 'https://slovo-propovedi.ru/listen/playlist?playlist=abc-123'
const COPY_TEXT = 'Копировать ссылку'
const SEND_TEXT = 'Отправить ссылку'
const QR_TEST_ID = 'qr-code'
const MAX_QR_URL_LENGTH = 1000

const renderModal = ({
  onClose = jest.fn(),
  onCopy = jest.fn(),
  onShare = jest.fn(),
  url = URL,
}: {
  onClose?: () => void
  onCopy?: () => void
  onShare?: () => void
  url?: string
} = {}): Promise<void> =>
  renderWithProviders(
    <PlaylistShareModal isVisible url={url} onCopy={onCopy} onClose={onClose} onShare={onShare} />,
  ).then(() => undefined)

describe('<PlaylistShareModal>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsShareSupported = true
  })

  test('renders the QR code with the share URL', async () => {
    await renderModal()

    expect(mockQrCodeValue).toHaveBeenCalledWith(URL)
    expect(screen.getByTestId(QR_TEST_ID)).toBeTruthy()
  })

  test('always shows the copy row and calls onCopy when pressed', async () => {
    mockIsShareSupported = false
    const onCopy = jest.fn()

    await renderModal({ onCopy })

    fireEvent.press(screen.getByText(COPY_TEXT))

    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  test('shows the send row when sharing is supported and calls onShare', async () => {
    const onShare = jest.fn()

    await renderModal({ onShare })

    expect(screen.getByText(SEND_TEXT)).toBeTruthy()

    fireEvent.press(screen.getByText(SEND_TEXT))

    expect(onShare).toHaveBeenCalledTimes(1)
  })

  test('hides the send row when sharing is unsupported', async () => {
    mockIsShareSupported = false

    await renderModal()

    expect(screen.queryByText(SEND_TEXT)).toBeNull()
    expect(screen.getByText(COPY_TEXT)).toBeTruthy()
  })

  test('pressing the backdrop calls onClose', async () => {
    const onClose = jest.fn()

    await renderModal({ onClose })

    fireEvent.press(screen.getByTestId('modal-backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('hides the QR code beyond the scannable maximum while keeping the rows', async () => {
    await renderModal({ url: 'a'.repeat(MAX_QR_URL_LENGTH + 1) })

    expect(mockQrCodeValue).not.toHaveBeenCalled()
    expect(screen.queryByTestId(QR_TEST_ID)).toBeNull()
    expect(screen.getByText(COPY_TEXT)).toBeTruthy()
    expect(screen.getByText(SEND_TEXT)).toBeTruthy()
  })

  test('renders the QR code at the maximum URL length boundary', async () => {
    const boundaryUrl = 'a'.repeat(MAX_QR_URL_LENGTH)

    await renderModal({ url: boundaryUrl })

    expect(mockQrCodeValue).toHaveBeenCalledWith(boundaryUrl)
    expect(screen.getByTestId(QR_TEST_ID)).toBeTruthy()
  })
})

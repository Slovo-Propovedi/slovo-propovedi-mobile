import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ConfirmDialog } from './ConfirmDialog'

const TITLE = 'Confirm Action'
const MESSAGE = 'Are you sure you want to proceed?'
const MESSAGES = ['First line', 'Second line', 'Third line']
const onCancelMock = jest.fn()
const onConfirmMock = jest.fn()

const defaultProps = {
  message: MESSAGE,
  onCancel: onCancelMock,
  onConfirm: onConfirmMock,
  title: TITLE,
  visible: true,
}

describe('<ConfirmDialog>', () => {
  beforeEach(() => {
    onCancelMock.mockClear()
    onConfirmMock.mockClear()
  })

  test('renders nothing when visible is false', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} visible={false} />)

    expect(screen.queryByText(TITLE)).toBeNull()
  })

  test('renders the title when visible is true', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText(TITLE)).toBeTruthy()
  })

  test('renders the message as text when message is a string', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText(MESSAGE)).toBeTruthy()
  })

  test('renders multiple message lines when message is a string array', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} message={MESSAGES} />)

    for (const line of MESSAGES) expect(screen.getByText(line)).toBeTruthy()
  })

  test('shows both cancel and confirm buttons by default', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Отмена')).toBeTruthy()
    expect(screen.getByText('ОК')).toBeTruthy()
  })

  test('hides the cancel button when hideCancel is true', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} hideCancel />)

    expect(screen.queryByText('Отмена')).toBeNull()
    expect(screen.getByText('ОК')).toBeTruthy()
  })

  test('calls onCancel when cancel button is pressed', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('Отмена'))

    expect(onCancelMock).toHaveBeenCalledTimes(1)
  })

  test('calls onConfirm when confirm button is pressed', async () => {
    await renderWithProviders(<ConfirmDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('ОК'))

    expect(onConfirmMock).toHaveBeenCalledTimes(1)
  })
})

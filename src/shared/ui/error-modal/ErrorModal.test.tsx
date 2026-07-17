import { fireEvent, screen } from '@testing-library/react-native'
import { Clipboard, Text as MockText } from 'react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ErrorModal } from './ErrorModal'

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: { name: string }) => <MockText>{props.name}</MockText>,
}))

const COPY_BUTTON_TEXT = 'Скопировать'

const TITLE = 'Ошибка'
const FALLBACK_MESSAGE = 'Произошла ошибка'
const ERROR_MESSAGE = 'Network request failed'
const ERROR_STACK = 'at fetchData (app.js:10:5)'

const onCloseMock = jest.fn()

const createError = (message: string, stack?: string) => {
  const err = new Error(message)
  if (stack) err.stack = stack
  return err
}

const defaultProps = {
  error: createError(ERROR_MESSAGE, ERROR_STACK),
  onClose: onCloseMock,
  visible: true,
}

const setStringSpy = jest.spyOn(Clipboard, 'setString')

describe('<ErrorModal>', () => {
  beforeEach(() => {
    onCloseMock.mockClear()
    setStringSpy.mockClear()
  })

  test('renders nothing when visible is false', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} visible={false} />)

    expect(screen.queryByText(TITLE)).toBeNull()
  })

  test('renders title when visible', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} />)

    expect(screen.getByText(TITLE)).toBeTruthy()
  })

  test('renders error.message when error is provided', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} />)

    expect(screen.getByText(ERROR_MESSAGE)).toBeTruthy()
  })

  test('renders fallback message when error.message is empty string', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} error={createError('')} />)

    expect(screen.getByText(FALLBACK_MESSAGE)).toBeTruthy()
  })

  test('renders fallback message when error is null', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} error={null} />)

    expect(screen.getByText(FALLBACK_MESSAGE)).toBeTruthy()
  })

  test('shows copy button by default', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} />)

    expect(screen.getByText(COPY_BUTTON_TEXT)).toBeTruthy()
  })

  test('hides copy button when showCopyButton is false', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} showCopyButton={false} />)

    expect(screen.queryByText(COPY_BUTTON_TEXT)).toBeNull()
  })

  test('pressing copy calls Clipboard.setString with formatted error text', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} />)

    fireEvent.press(screen.getByText(COPY_BUTTON_TEXT))

    const expected = `Error: ${ERROR_MESSAGE}\n\nStack trace:\n${ERROR_STACK}`
    expect(Clipboard.setString).toHaveBeenCalledTimes(1)
    expect(Clipboard.setString).toHaveBeenCalledWith(expected)
  })

  test('does not call Clipboard.setString when error is null', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} error={null} />)

    fireEvent.press(screen.getByText(COPY_BUTTON_TEXT))

    expect(Clipboard.setString).not.toHaveBeenCalled()
  })

  test('pressing close calls onClose', async () => {
    await renderWithProviders(<ErrorModal {...defaultProps} />)

    fireEvent.press(screen.getByText('Закрыть'))

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})

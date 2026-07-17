import { act, fireEvent, screen } from '@testing-library/react-native'
import { Text as MockText } from 'react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ErrorDialog } from './ErrorDialog'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => <MockText>{props.name}</MockText>,
}))

const COPY_LABEL = '📋 Копировать'
const COPIED_LABEL = '✓ Скопировано'

const MESSAGE = 'Something went wrong'
const DETAIL = 'Error at line 42'
const onDismissMock = jest.fn()

const defaultProps = {
  detail: DETAIL,
  message: MESSAGE,
  onDismiss: onDismissMock,
  visible: true,
}

const expectedCopyText = `ОШИБКА: ${MESSAGE}\n\nДЕТАЛИ:\n${DETAIL}`

describe('<ErrorDialog>', () => {
  beforeEach(() => {
    onDismissMock.mockClear()
  })

  test('does not render content when visible=false', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} visible={false} />)

    expect(screen.queryByText('Ошибка')).toBeNull()
  })

  test('renders the title when visible=true', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText('Ошибка')).toBeTruthy()
  })

  test('renders the message text', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(MESSAGE)).toBeTruthy()
  })

  test('renders the detail text', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(DETAIL)).toBeTruthy()
  })

  test('copy button initially shows copy label', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    expect(screen.getByText(COPY_LABEL)).toBeTruthy()
  })

  test('pressing copy calls setStringAsync with formatted error text', async () => {
    const clipboard = jest.requireMock('expo-clipboard') as { setStringAsync: jest.Mock }
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(clipboard.setStringAsync).toHaveBeenCalledTimes(1)
    expect(clipboard.setStringAsync).toHaveBeenCalledWith(expectedCopyText)
  })

  test('copy button changes to copied label after press', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(screen.getByText(COPIED_LABEL)).toBeTruthy()
  })

  test('copy button reverts after 2s timeout', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    jest.useFakeTimers()

    await act(async () => {
      fireEvent.press(screen.getByText(COPY_LABEL))
    })

    expect(screen.getByText(COPIED_LABEL)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText(COPY_LABEL)).toBeTruthy()

    jest.useRealTimers()
  })

  test('close button calls onDismiss', async () => {
    await renderWithProviders(<ErrorDialog {...defaultProps} />)

    fireEvent.press(screen.getByText('Закрыть'))

    expect(onDismissMock).toHaveBeenCalledTimes(1)
  })
})

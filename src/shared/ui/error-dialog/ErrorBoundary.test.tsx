import { act, fireEvent, screen } from '@testing-library/react-native'
import { Text as MockText, Text } from 'react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { ErrorBoundary } from './ErrorBoundary'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => <MockText>{props.name}</MockText>,
}))

const THROW_ERROR_MESSAGE = 'Test child error'
const ERROR_TITLE = 'Ошибка'
const CLOSE_BUTTON_LABEL = 'Закрыть'
const SAFE_CONTENT = 'Safe content'
const ThrowOnRender = () => {
  throw new Error(THROW_ERROR_MESSAGE)
}

const SafeChild = () => <Text>{SAFE_CONTENT}</Text>

describe('<ErrorBoundary>', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders children when no error occurs', async () => {
    await renderWithProviders(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText(SAFE_CONTENT)).toBeTruthy()
    expect(screen.queryByText(ERROR_TITLE)).toBeNull()
  })

  test('renders ErrorDialog when a child throws', async () => {
    await renderWithProviders(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    )

    expect(screen.getByText(ERROR_TITLE)).toBeTruthy()
  })

  test('ErrorDialog shows the error message', async () => {
    await renderWithProviders(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    )

    expect(screen.getByText(THROW_ERROR_MESSAGE)).toBeTruthy()
  })

  test('after dismissing ErrorDialog, safe children render again', async () => {
    const { rerender } = await renderWithProviders(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>,
    )

    expect(screen.getByText(ERROR_TITLE)).toBeTruthy()

    await rerender(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>,
    )

    await act(async () => {
      fireEvent.press(screen.getByText(CLOSE_BUTTON_LABEL))
    })

    expect(screen.getByText(SAFE_CONTENT)).toBeTruthy()
    expect(screen.queryByText(ERROR_TITLE)).toBeNull()
  })

  test('renders ErrorDialog when error has empty message', async () => {
    const EmptyMessageThrower = () => {
      throw new Error()
    }

    await renderWithProviders(
      <ErrorBoundary>
        <EmptyMessageThrower />
      </ErrorBoundary>,
    )

    expect(screen.getByText(ERROR_TITLE)).toBeTruthy()
  })
})

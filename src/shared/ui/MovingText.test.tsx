import '@testing-library/jest-native/extend-expect'
import { screen } from '@testing-library/react-native'
import { type StyleProp, Text, type TextStyle } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { MovingText } from './MovingText'

jest.mock('react-native-text-ticker', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const TEST_ID = 'moving-text'

let capturedProps: null | Record<string, unknown> = null

const MockedTextTicker = jest.mocked(TextTicker)

const getCapturedProps = () => {
  expect(capturedProps).not.toBeNull()
  return capturedProps as Record<string, unknown>
}

describe('<MovingText />', () => {
  beforeEach(() => {
    capturedProps = null
    MockedTextTicker.mockImplementation(((props: Record<string, unknown>) => {
      capturedProps = { ...props }
      return (
        <Text testID={props.testID as string} style={props.style as StyleProp<TextStyle>}>
          {props.children as string}
        </Text>
      )
    }) as never)
  })

  test('renders the provided text', async () => {
    const text = 'Short text'
    await renderWithProviders(<MovingText text={text} />)

    expect(screen.getByText(text)).toBeTruthy()
  })

  test('short text renders with non-animated props', async () => {
    const text = 'Hello World'
    await renderWithProviders(<MovingText text={text} />)

    const props = getCapturedProps()
    expect(props.duration).toBe(0)
    expect(props.loop).toBe(false)
    expect(props.bounce).toBe(false)
    expect(props.isInteraction).toBe(false)
    expect(props.marqueeDelay).toBe(0)
  })

  test('long text renders with animated props', async () => {
    const text = 'This text is definitely longer than twenty five chars'
    await renderWithProviders(<MovingText text={text} />)

    const props = getCapturedProps()
    expect(props.loop).toBe(true)
    expect(props.bounce).toBe(false)
    expect(props.isInteraction).toBe(false)
    expect(props.scrollSpeed).toBe(30)
    expect(props.numberOfLines).toBe(1)
    expect(props.repeatSpacer).toBe(50)
    expect(props.marqueeDelay).toBe(2000)
  })

  test('custom threshold: text above threshold animates', async () => {
    const text = '123456789012345'
    await renderWithProviders(<MovingText text={text} animationThreshold={10} />)

    const props = getCapturedProps()
    expect(props.loop).toBe(true)
    expect(props.scrollSpeed).toBe(30)
  })

  test('custom threshold: text below threshold does not animate', async () => {
    const text = '123456789012'
    await renderWithProviders(<MovingText text={text} animationThreshold={15} />)

    const props = getCapturedProps()
    expect(props.loop).toBe(false)
    expect(props.duration).toBe(0)
  })

  test('theme color is applied to TextTicker style', async () => {
    const text = 'Some text'
    await renderWithProviders(<MovingText text={text} />)

    const props = getCapturedProps()
    const styleArray = props.style as Array<Record<string, unknown>>

    expect(styleArray).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) })]),
    )
  })

  test('testID is passed through to TextTicker', async () => {
    const text = 'Some text'
    await renderWithProviders(<MovingText text={text} testID={TEST_ID} />)

    const props = getCapturedProps()
    expect(props.testID).toBe(TEST_ID)
    expect(screen.getByTestId(TEST_ID)).toBeTruthy()
  })

  test('custom style is merged with theme color style', async () => {
    const text = 'Some text'
    const customStyle = { fontSize: 20 }
    await renderWithProviders(<MovingText text={text} style={customStyle} />)

    const props = getCapturedProps()
    const styleArray = props.style as Array<Record<string, unknown>>

    expect(styleArray).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) }), customStyle]),
    )
  })
})

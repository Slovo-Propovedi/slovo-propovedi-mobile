import { act, screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { MovingText } from './MovingText'

const { __gestureMock } = jest.requireMock('react-native-gesture-handler') as {
  __gestureMock: {
    pan: () => Record<string, ((...args: unknown[]) => unknown) | undefined>
    reset: () => void
  }
}

const { __textTickerMock } = jest.requireMock('react-native-text-ticker') as {
  __textTickerMock: {
    lastProps: () => Record<string, unknown> | undefined
    reset: () => void
  }
}

const TEST_ID = 'moving-text'
const LONG_TEXT = 'This text is definitely longer than twenty five chars'

const getCapturedProps = () => {
  const props = __textTickerMock.lastProps()
  if (!props) throw new Error('Expected TextTicker to render, but no props were captured')
  return props
}

const fireDragEnd = async (translationX: number) => {
  await act(async () => {
    __gestureMock.pan().onEnd?.({ translationX })
  })
}

describe('<MovingText />', () => {
  beforeEach(() => {
    __gestureMock.reset()
    __textTickerMock.reset()
  })

  test('renders the provided text', async () => {
    const text = 'Short text'
    await renderWithProviders(<MovingText text={text} />)

    expect(screen.getByText(text)).toBeTruthy()
  })

  test('short text renders through the gated ticker (no length threshold)', async () => {
    const text = 'Short' // length 5 — below the old DEFAULT_THRESHOLD of 25
    await renderWithProviders(<MovingText text={text} />)

    const props = getCapturedProps()
    expect(props.loop).toBe(true)
    expect(props.bounce).toBe(false)
    expect(props.isInteraction).toBe(false)
    expect(props.scrollSpeed).toBe(30)
    expect(props.numberOfLines).toBe(1)
    expect(props.repeatSpacer).toBe(50)
    expect(props.marqueeDelay).toBe(2000)
    expect(props.marqueeOnMount).toBe(false)
  })

  test('long text renders through the gated ticker', async () => {
    const text = LONG_TEXT
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

  test('short-but-wide text arms the ticker after a real drag (reported bug)', async () => {
    // The reported bug: a title with few characters but wide glyphs fell into
    // the static duration={0} branch (text.length < threshold) and showed
    // ellipsis forever — drag did nothing. Now every text goes through the
    // gated ticker, so a real drag arms it regardless of character length.
    const text = 'Short'
    await renderWithProviders(<MovingText text={text} />)

    expect(getCapturedProps().marqueeOnMount).toBe(false)

    await fireDragEnd(5)

    expect(getCapturedProps().marqueeOnMount).toBe(true)
  })

  test('genuinely fitting text stays static without a drag', async () => {
    // The ticker itself is inert for non-overflowing text: react-native-text-
    // ticker measures contentFits and skips the animation, so the component
    // contract is simply "static until armed by a real drag".
    const text = 'Short'
    await renderWithProviders(<MovingText text={text} />)

    expect(getCapturedProps().marqueeOnMount).toBe(false)
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

  test('long text stays static before any drag', async () => {
    const text = LONG_TEXT
    await renderWithProviders(<MovingText text={text} />)

    expect(getCapturedProps().marqueeOnMount).toBe(false)
  })

  test('arms the ticker after a real drag', async () => {
    const text = LONG_TEXT
    await renderWithProviders(<MovingText text={text} />)

    await fireDragEnd(5)

    expect(getCapturedProps().marqueeOnMount).toBe(true)
  })

  test('long-press without movement does not arm the ticker', async () => {
    const text = LONG_TEXT
    await renderWithProviders(<MovingText text={text} />)

    await fireDragEnd(0)

    expect(getCapturedProps().marqueeOnMount).toBe(false)
  })

  test('disarms on text change', async () => {
    const firstText = LONG_TEXT
    const secondText = 'Another very long title that definitely overflows the container'
    const { rerender } = await renderWithProviders(<MovingText text={firstText} />)

    await fireDragEnd(5)
    expect(getCapturedProps().marqueeOnMount).toBe(true)

    await rerender(<MovingText text={secondText} />)

    expect(getCapturedProps().marqueeOnMount).toBe(false)
  })
})

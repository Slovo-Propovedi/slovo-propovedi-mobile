import { render, screen } from '@testing-library/react-native'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { MovingText } from './MovingText'
import { DarkTheme, ThemeContext, type ThemeContextValue } from './theme'

let mockLastProps: Record<string, unknown> | undefined
let mockMarqueeRenderCount = 0

jest.mock('./marquee-text/marquee-text', () => ({
  MarqueeText: (props: {
    autoStart?: boolean
    centerWhenStatic?: boolean
    testID?: string
    text: string
    textStyle?: unknown
  }) => {
    mockMarqueeRenderCount += 1
    mockLastProps = { ...props }
    return <MockText testID={props.testID}>{props.text}</MockText>
  },
}))

const TEST_ID = 'moving-text'

// A stable context value: the real ThemeProvider rebuilds its value object on
// every render, which would re-render context consumers and mask memo. The
// player's position ticks re-render the widget subtree, not the root provider.
const STABLE_THEME: ThemeContextValue = {
  currentTheme: DarkTheme,
  isLight: false,
  themeMode: 'dark',
}

const getCapturedProps = () => {
  if (!mockLastProps) throw new Error('Expected MarqueeText to render, but no props were captured')
  return mockLastProps
}

describe('<MovingText />', () => {
  beforeEach(() => {
    mockLastProps = undefined
    mockMarqueeRenderCount = 0
  })

  test('renders the provided text', async () => {
    const text = 'Short text'
    await renderWithProviders(<MovingText text={text} />)

    expect(screen.getByText(text)).toBeTruthy()
  })

  test('passes the text through to MarqueeText', async () => {
    const text = 'Short text'
    await renderWithProviders(<MovingText text={text} />)

    expect(getCapturedProps().text).toBe(text)
  })

  test('passes testID through to MarqueeText', async () => {
    await renderWithProviders(<MovingText text='Some text' testID={TEST_ID} />)

    expect(getCapturedProps().testID).toBe(TEST_ID)
    expect(screen.getByTestId(TEST_ID)).toBeTruthy()
  })

  test('forwards autoStart as undefined by default (drag-gated)', async () => {
    await renderWithProviders(<MovingText text='Some text' />)

    expect(getCapturedProps().autoStart).toBeUndefined()
  })

  test('forwards autoStart when set', async () => {
    await renderWithProviders(<MovingText autoStart text='Some text' />)

    expect(getCapturedProps().autoStart).toBe(true)
  })

  test('forwards centerWhenStatic as undefined by default', async () => {
    await renderWithProviders(<MovingText text='Some text' />)

    expect(getCapturedProps().centerWhenStatic).toBeUndefined()
  })

  test('forwards centerWhenStatic when set', async () => {
    await renderWithProviders(<MovingText centerWhenStatic text='Some text' />)

    expect(getCapturedProps().centerWhenStatic).toBe(true)
  })

  test('does not re-render MarqueeText when props are identical (memoized)', async () => {
    // The fullscreen player re-renders on every audio-position tick (~2/s) but
    // passes the same title/StyleSheet style. memo on MovingText must bail out
    // so the inner marquee (and its frame clock) is not re-run.
    const style = { fontSize: 20 }
    const tree = () => (
      <ThemeContext.Provider value={STABLE_THEME}>
        <MovingText style={style} testID={TEST_ID} text='Short text' />
      </ThemeContext.Provider>
    )

    const { rerender } = await render(tree())
    expect(mockMarqueeRenderCount).toBe(1)

    await rerender(tree())

    expect(mockMarqueeRenderCount).toBe(1)
  })

  test('applies the theme text color via textStyle', async () => {
    await renderWithProviders(<MovingText text='Some text' />)

    const textStyle = getCapturedProps().textStyle as Array<Record<string, unknown>>

    expect(textStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) })]),
    )
  })

  test('merges the custom style into textStyle after the theme color', async () => {
    const customStyle = { fontSize: 20 }
    await renderWithProviders(<MovingText text='Some text' style={customStyle} />)

    const textStyle = getCapturedProps().textStyle as Array<Record<string, unknown>>

    expect(textStyle).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) }), customStyle]),
    )
  })
})

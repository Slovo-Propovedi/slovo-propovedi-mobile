import { screen } from '@testing-library/react-native'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { MovingText } from './MovingText'

let mockLastProps: Record<string, unknown> | undefined

jest.mock('./marquee-text/marquee-text', () => ({
  MarqueeText: (props: {
    autoStart?: boolean
    testID?: string
    text: string
    textStyle?: unknown
  }) => {
    mockLastProps = { ...props }
    return <MockText testID={props.testID}>{props.text}</MockText>
  },
}))

const TEST_ID = 'moving-text'

const getCapturedProps = () => {
  if (!mockLastProps) throw new Error('Expected MarqueeText to render, but no props were captured')
  return mockLastProps
}

describe('<MovingText />', () => {
  beforeEach(() => {
    mockLastProps = undefined
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

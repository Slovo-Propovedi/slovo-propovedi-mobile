import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { ContinueCircleButton } from './ContinueCircleButton'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    Circle: (props: object) => <View {...props} />,
    default: (props: object) => <View {...props} />,
    Defs: (props: object) => <View {...props} />,
    G: (props: object) => <View {...props} />,
    RadialGradient: (props: object) => <View {...props} />,
    Stop: (props: object) => <View {...props} />,
  }
})

const mockEntypoSpy = jest.fn()

const WRAPPER_TEST_ID = 'continue-circle-wrapper'
const INNER_TEST_ID = 'continue-circle-inner'

jest.mock('@expo/vector-icons', () => {
  const Actual = jest.requireActual('@expo/vector-icons')
  return {
    ...Actual,
    Entypo: (props: Record<string, unknown>) => {
      mockEntypoSpy(props)
      return <Actual.Entypo {...props} />
    },
  }
})

describe('<ContinueCircleButton>', () => {
  beforeEach(() => {
    mockEntypoSpy.mockClear()
  })

  test('renders the play icon and the glow ring when paused', async () => {
    const { getByTestId } = await renderWithProviders(<ContinueCircleButton isPlaying={false} />)

    const iconNames = mockEntypoSpy.mock.calls.map(call => call[0].name)
    expect(iconNames).toContain('controller-play')
    expect(iconNames).not.toContain('controller-paus')
    expect(getByTestId('glow-ring')).toBeTruthy()
  })

  test('renders the pause icon and the glow ring when playing', async () => {
    const { getByTestId } = await renderWithProviders(<ContinueCircleButton isPlaying={true} />)

    const iconNames = mockEntypoSpy.mock.calls.map(call => call[0].name)
    expect(iconNames).toContain('controller-paus')
    expect(iconNames).not.toContain('controller-play')
    expect(getByTestId('glow-ring')).toBeTruthy()
  })

  test('glow ring is an absolute overlay concentric with the inner circle', async () => {
    const { getByTestId } = await renderWithProviders(<ContinueCircleButton isPlaying={false} />)

    const flatStyle = StyleSheet.flatten(getByTestId('glow-ring').props.style)

    expect(flatStyle.position).toBe('absolute')
    expect(flatStyle.top).toBe(0)
    expect(flatStyle.left).toBe(0)
  })

  test('staged scaling: glow canvas shrinks first, then the circle and icon', async () => {
    const wide = await renderWithProviders(<ContinueCircleButton width={190} isPlaying={false} />)

    expect(StyleSheet.flatten(wide.getByTestId(WRAPPER_TEST_ID).props.style).width).toBe(190)
    expect(StyleSheet.flatten(wide.getByTestId(INNER_TEST_ID).props.style).width).toBe(168)

    const narrow = await renderWithProviders(<ContinueCircleButton width={140} isPlaying={false} />)

    expect(StyleSheet.flatten(narrow.getByTestId(INNER_TEST_ID).props.style).width).toBe(140)
    const iconSize = mockEntypoSpy.mock.calls.at(-1)?.[0].size
    expect(iconSize).toBe(83)
  })

  test('scales the circle and icon down to the WCAG 2.5.8 floor width', async () => {
    const floor = await renderWithProviders(<ContinueCircleButton width={44} isPlaying={false} />)

    expect(StyleSheet.flatten(floor.getByTestId(WRAPPER_TEST_ID).props.style).width).toBe(44)
    expect(StyleSheet.flatten(floor.getByTestId(INNER_TEST_ID).props.style).width).toBe(44)
    // round(100 × 44 / 168) = round(26.19) = 26
    const iconSize = mockEntypoSpy.mock.calls.at(-1)?.[0].size
    expect(iconSize).toBe(26)
  })
})

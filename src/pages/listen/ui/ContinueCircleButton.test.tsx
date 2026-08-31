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
})

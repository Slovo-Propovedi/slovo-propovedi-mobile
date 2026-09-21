import * as Reanimated from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks'
import { GlowRing } from './GlowRing'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    Circle: (props: object) => <View testID='glow-blob' {...props} />,
    default: (props: object) => <View testID='glow-svg' {...props} />,
    Defs: (props: object) => <View {...props} />,
    G: (props: object) => <View {...props} />,
    RadialGradient: (props: object) => <View testID='glow-gradient' {...props} />,
    Stop: (props: object) => <View {...props} />,
  }
})

describe('<GlowRing>', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders both counter-rotating layers with their blobs when paused', async () => {
    const { getAllByTestId, getByTestId } = await renderWithProviders(
      <GlowRing isPlaying={false} />,
    )

    expect(getByTestId('glow-ring')).toBeTruthy()
    // LAYER_BASE (6) + LAYER_CW (4) + LAYER_CCW (4) кляксы.
    expect(getAllByTestId('glow-blob')).toHaveLength(14)
    // Один общий набор градиентов accent -1..3.
    expect(getAllByTestId('glow-gradient')).toHaveLength(5)
  })

  test('still renders the ring while playing (animation frozen)', async () => {
    const { getAllByTestId, getByTestId } = await renderWithProviders(<GlowRing isPlaying={true} />)

    expect(getByTestId('glow-ring')).toBeTruthy()
    expect(getAllByTestId('glow-blob')).toHaveLength(14)
  })

  test('freezes the ring while paused (scroll / tab unfocused) and resumes when unpaused', async () => {
    const cancelAnimationSpy = jest.spyOn(Reanimated, 'cancelAnimation')
    const withRepeatSpy = jest.spyOn(Reanimated, 'withRepeat')

    const { getAllByTestId, getByTestId, rerender } = await renderWithProviders(
      <GlowRing isPaused={false} isPlaying={false} />,
    )

    // Running: all three loops (cw + ccw + breathe) are started.
    expect(withRepeatSpy).toHaveBeenCalledTimes(3)
    expect(cancelAnimationSpy).not.toHaveBeenCalled()

    cancelAnimationSpy.mockClear()

    await rerender(<GlowRing isPaused={true} isPlaying={false} />)

    // Paused: every running loop is cancelled with its own shared value.
    const cancelledValues = cancelAnimationSpy.mock.calls.map(call => call[0])
    expect(cancelledValues).toHaveLength(3)
    expect(new Set(cancelledValues).size).toBe(3)

    expect(getByTestId('glow-ring')).toBeTruthy()
    expect(getAllByTestId('glow-blob')).toHaveLength(14)

    withRepeatSpy.mockClear()

    // isPaused flips back to false — the effect restarts the loops like a play toggle.
    await rerender(<GlowRing isPaused={false} isPlaying={false} />)

    expect(withRepeatSpy).toHaveBeenCalledTimes(3)
    expect(getByTestId('glow-ring')).toBeTruthy()
    expect(getAllByTestId('glow-blob')).toHaveLength(14)
  })

  test('applies the passed size to the Svg canvas', async () => {
    const { getByTestId } = await renderWithProviders(<GlowRing size={150} isPlaying={false} />)

    const svg = getByTestId('glow-svg')
    expect(svg.props.width).toBe(150)
    expect(svg.props.height).toBe(150)
  })
})

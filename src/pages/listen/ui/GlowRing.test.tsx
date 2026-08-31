import { renderWithProviders } from 'shared/mocks'
import { GlowRing } from './GlowRing'

jest.mock('react-native-svg', () => {
  const { View } = jest.requireActual('react-native')

  return {
    __esModule: true,
    Circle: (props: object) => <View testID='glow-blob' {...props} />,
    default: (props: object) => <View {...props} />,
    Defs: (props: object) => <View {...props} />,
    G: (props: object) => <View {...props} />,
    RadialGradient: (props: object) => <View testID='glow-gradient' {...props} />,
    Stop: (props: object) => <View {...props} />,
  }
})

describe('<GlowRing>', () => {
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
})

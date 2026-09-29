import { screen } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { ValueSlider } from './ValueSlider'

const VOLUME_LABEL = 'Громкость'
const BALANCE_LABEL = 'Баланс'
const mockOnChange = jest.fn()

const findPanResponderNode = (container: TestInstance): TestInstance =>
  // PanResponder maps onStartShouldSetPanResponder → onStartShouldSetResponder
  // on the host props, hence the Responder-level names here.
  container.queryAll(node => node.props.onStartShouldSetResponder !== undefined)[0]

describe('<ValueSlider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with slider role and accessibility value', async () => {
    await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        step={0.05}
        value={0.8}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
      />,
    )

    const slider = screen.getByRole('adjustable', { name: VOLUME_LABEL })

    expect(slider.props.accessibilityValue).toEqual({ max: 1, min: 0, now: 0.8 })
  })

  test('exposes custom min and max for ranged sliders', async () => {
    await renderWithProviders(
      <ValueSlider
        max={1}
        min={-1}
        value={-0.5}
        onChange={mockOnChange}
        accessibilityLabel={BALANCE_LABEL}
      />,
    )

    const slider = screen.getByRole('adjustable', { name: BALANCE_LABEL })

    expect(slider.props.accessibilityValue).toEqual({ max: 1, min: -1, now: -0.5 })
  })

  test('disabled slider rejects the pan gesture', async () => {
    const { container } = await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        disabled
        value={0.5}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
      />,
    )

    const track = findPanResponderNode(container)

    expect(track.props.onStartShouldSetResponder({}, { dx: 0, dy: 0 })).toBe(false)
    expect(track.props.onMoveShouldSetResponder({}, { dx: 10, dy: 0 })).toBe(false)
  })

  test('enabled slider accepts a pan start', async () => {
    const { container } = await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        value={0.5}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
      />,
    )

    const track = findPanResponderNode(container)

    expect(track.props.onStartShouldSetResponder({}, { dx: 0, dy: 0 })).toBe(true)
  })

  test('accessibility increment steps the value by step', async () => {
    const mockOnSlidingComplete = jest.fn()
    await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        step={0.05}
        value={0.4}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
        onSlidingComplete={mockOnSlidingComplete}
      />,
    )

    const slider = screen.getByRole('adjustable', { name: VOLUME_LABEL })
    slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } })

    expect(mockOnChange).toHaveBeenCalledWith(0.45)
    expect(mockOnSlidingComplete).toHaveBeenCalledWith(0.45)
  })

  test('accessibility decrement clamps to min', async () => {
    await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        value={0}
        step={0.05}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
      />,
    )

    const slider = screen.getByRole('adjustable', { name: VOLUME_LABEL })
    slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } })

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  test('disabled slider rejects accessibility actions', async () => {
    await renderWithProviders(
      <ValueSlider
        max={1}
        min={0}
        disabled
        value={0.4}
        onChange={mockOnChange}
        accessibilityLabel={VOLUME_LABEL}
      />,
    )

    const slider = screen.getByRole('adjustable', { name: VOLUME_LABEL })
    slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } })

    expect(mockOnChange).not.toHaveBeenCalled()
  })
})

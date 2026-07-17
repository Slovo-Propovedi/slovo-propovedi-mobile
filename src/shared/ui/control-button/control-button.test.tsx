import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { PlayerControlButton } from './control-button'
import { PlayerControlButtonType } from './control-button.types'

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

const renderButton = (props = {}) =>
  renderWithProviders(<PlayerControlButton type={PlayerControlButtonType.Play} {...props} />)

const getLastIconProps = async (props = {}) => {
  mockEntypoSpy.mockClear()
  await renderButton(props)
  return mockEntypoSpy.mock.calls[0][0]
}

describe('<PlayerControlButton>', () => {
  beforeEach(() => {
    mockEntypoSpy.mockClear()
  })

  test('renders a button', async () => {
    await renderButton()

    const button = screen.getByRole('button')

    expect(button).toBeTruthy()
  })

  test('calls onPress when pressed', async () => {
    const onPressMock = jest.fn()

    await renderButton({ onPress: onPressMock })

    fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  test('calls onPressOut when pressed out', async () => {
    const onPressOutMock = jest.fn()

    await renderButton({ onPressOut: onPressOutMock })

    fireEvent(screen.getByRole('button'), 'pressOut')

    expect(onPressOutMock).toHaveBeenCalledTimes(1)
  })

  test('calls onLongPress on long press', async () => {
    const onLongPressMock = jest.fn()

    await renderButton({ onLongPress: onLongPressMock })

    fireEvent(screen.getByRole('button'), 'longPress')

    expect(onLongPressMock).toHaveBeenCalledTimes(1)
  })

  test('is disabled when isDisabled is true', async () => {
    await renderButton({ isDisabled: true })

    const button = screen.getByRole('button')

    expect(button).toBeDisabled()
  })

  test('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn()

    await renderButton({ isDisabled: true, onPress: onPressMock })

    fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).not.toHaveBeenCalled()
  })

  test('renders correct icon name for type=Next', async () => {
    const iconProps = await getLastIconProps({ type: PlayerControlButtonType.Next })

    expect(iconProps.name).toBe('controller-fast-forward')
  })

  test('renders correct icon name for type=Pause', async () => {
    const iconProps = await getLastIconProps({ type: PlayerControlButtonType.Pause })

    expect(iconProps.name).toBe('controller-paus')
  })

  test('renders correct icon name for type=Play', async () => {
    const iconProps = await getLastIconProps({ type: PlayerControlButtonType.Play })

    expect(iconProps.name).toBe('controller-play')
  })

  test('renders correct icon name for type=Prev', async () => {
    const iconProps = await getLastIconProps({ type: PlayerControlButtonType.Prev })

    expect(iconProps.name).toBe('controller-fast-backward')
  })

  test('applies custom color to icon when color prop is provided', async () => {
    const iconProps = await getLastIconProps({ color: 'red' })

    const hasColorStyle = iconProps.style?.some?.(
      (s: Record<string, unknown>) => s?.color === 'red',
    )
    expect(hasColorStyle).toBe(true)
  })

  test('applies disabled icon style when isDisabled is true', async () => {
    const iconProps = await getLastIconProps({ isDisabled: true })

    const hasDisabledStyle = iconProps.style?.some?.(
      (s: Record<string, unknown>) => s?.color === '#d3d3d3',
    )
    expect(hasDisabledStyle).toBe(true)
  })

  test('passes custom size to Entypo', async () => {
    const iconProps = await getLastIconProps({ size: 32 })

    expect(iconProps.size).toBe(32)
  })
})

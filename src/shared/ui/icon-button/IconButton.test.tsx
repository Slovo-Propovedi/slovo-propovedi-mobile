import { render, screen, userEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { IconButton } from './IconButton'

const LABEL = 'Test button'

// children and testID are rejected at the type level (IconButtonProps bans
// them), so there is no runtime behaviour to assert for those props.
const renderIconButton = (props = {}) =>
  render(<IconButton Icon={<Text>icon</Text>} accessibilityLabel={LABEL} {...props} />)

describe('<IconButton>', () => {
  test('renders the Icon node', async () => {
    await renderIconButton()

    expect(screen.getByText('icon')).toBeTruthy()
  })

  test('propagates accessibilityLabel to the button role', async () => {
    await renderIconButton()

    expect(screen.getByRole('button', { name: LABEL })).toBeTruthy()
  })

  test('style function receives the pressed state', async () => {
    const styleFn = jest.fn(() => ({ backgroundColor: 'red' }))
    await renderIconButton({ style: styleFn })

    const user = userEvent.setup()
    await user.press(screen.getByRole('button', { name: LABEL }))

    expect(styleFn).toHaveBeenCalledWith({ pressed: true })
  })

  test('applies the default pressed opacity on top of a static style', async () => {
    await renderIconButton({ style: { backgroundColor: 'red' } })

    const button = screen.getByRole('button', { name: LABEL })
    const user = userEvent.setup()
    const pressPromise = user.press(button)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(button).toHaveStyle({ backgroundColor: 'red', opacity: 0.6 })

    await pressPromise
  })

  test('calls onPress when pressed', async () => {
    const onPressMock = jest.fn()
    await renderIconButton({ onPress: onPressMock })

    const user = userEvent.setup()
    await user.press(screen.getByRole('button', { name: LABEL }))

    expect(onPressMock).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from '@testing-library/react-native'
import { PressableButton } from './PressableButton'

const BUTTON_LABEL = 'test-button'
const LINK_LABEL = 'test-link'

describe('<PressableButton>', () => {
  test('renders with button role by default', async () => {
    await render(<PressableButton accessibilityLabel={BUTTON_LABEL} />)

    expect(screen.getByRole('button', { name: BUTTON_LABEL })).toBeTruthy()
  })

  test('explicit accessibilityRole overrides the default', async () => {
    await render(<PressableButton accessibilityRole='link' accessibilityLabel={LINK_LABEL} />)

    expect(screen.getByRole('link', { name: LINK_LABEL })).toBeTruthy()
    expect(screen.queryByRole('button', { name: LINK_LABEL })).toBeNull()
  })
})

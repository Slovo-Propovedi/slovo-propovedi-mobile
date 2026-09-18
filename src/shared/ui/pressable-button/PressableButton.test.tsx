import { fireEvent, render, screen } from '@testing-library/react-native'
import { impactAsync } from 'expo-haptics'
import { PressableButton } from './PressableButton'

const BUTTON_LABEL = 'test-button'
const LINK_LABEL = 'test-link'

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>

describe('<PressableButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with button role by default', async () => {
    await render(<PressableButton accessibilityLabel={BUTTON_LABEL} />)

    expect(screen.getByRole('button', { name: BUTTON_LABEL })).toBeTruthy()
  })

  test('explicit accessibilityRole overrides the default', async () => {
    await render(<PressableButton accessibilityRole='link' accessibilityLabel={LINK_LABEL} />)

    expect(screen.getByRole('link', { name: LINK_LABEL })).toBeTruthy()
    expect(screen.queryByRole('button', { name: LINK_LABEL })).toBeNull()
  })

  test('disabled button does not trigger haptics on press-in', async () => {
    await render(<PressableButton disabled accessibilityLabel={BUTTON_LABEL} />)

    fireEvent(screen.getByRole('button', { name: BUTTON_LABEL }), 'pressIn')

    expect(mockedImpactAsync).not.toHaveBeenCalled()
  })
})

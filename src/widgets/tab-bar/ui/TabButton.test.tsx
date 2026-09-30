import { fireEvent, screen } from '@testing-library/react-native'
import { hapticLight } from 'shared/lib/haptics'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TabButton } from './TabButton'

jest.mock('shared/lib/haptics', () => ({ hapticLight: jest.fn() }))

const mockedHapticLight = hapticLight as jest.MockedFunction<typeof hapticLight>

const noop = () => {}

const renderTabButton = async (routeName: string, isActive = false) =>
  await renderWithProviders(
    <TabButton onPress={noop} isActive={isActive} routeKey={routeName} routeName={routeName} />,
  )

describe('<TabButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['listen', 'Слушать'],
    ['read', 'Читать'],
    ['study', 'Учиться'],
    ['more', 'Еще'],
  ])('renders single-line label for %s', async (routeName, displayName) => {
    await renderTabButton(routeName)

    const label = screen.getByText(displayName)

    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.maxFontSizeMultiplier).toBe(1.2)
  })

  test('renders as a button role so web renders a real <button>', async () => {
    await renderTabButton('listen')

    expect(screen.getByRole('button', { name: /Слушать/ })).toBeTruthy()
  })

  test('inactive tab triggers haptic on press-in', async () => {
    await renderTabButton('listen')

    fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'pressIn')

    expect(mockedHapticLight).toHaveBeenCalledTimes(1)
  })

  test('active tab does not trigger haptic on press-in', async () => {
    await renderTabButton('listen', true)

    fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'pressIn')

    expect(mockedHapticLight).not.toHaveBeenCalled()
  })

  test('active tab tints the label with the theme primary color', async () => {
    await renderTabButton('listen', true)

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#f16031' })
  })

  test('inactive tab tints the label with the muted text color', async () => {
    await renderTabButton('listen', false)

    expect(screen.getByText('Слушать')).not.toHaveStyle({ color: '#f16031' })
  })

  test('active tab has no background fill on the label', async () => {
    await renderTabButton('listen', true)

    const label = screen.getByText('Слушать')
    expect(label).not.toHaveStyle({ backgroundColor: '#f16031' })
  })
})

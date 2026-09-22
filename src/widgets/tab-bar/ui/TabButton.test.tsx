import { fireEvent, screen } from '@testing-library/react-native'
import { hapticLight } from 'shared/lib/haptics'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TabButton } from './TabButton'

jest.mock('shared/lib/haptics', () => ({ hapticLight: jest.fn() }))

const mockedHapticLight = hapticLight as jest.MockedFunction<typeof hapticLight>

const noop = () => {}

const renderTabButton = async (routeName: string, isActive = false) =>
  await renderWithProviders(
    <TabButton
      onPress={noop}
      onLayout={noop}
      isActive={isActive}
      routeKey={routeName}
      routeName={routeName}
    />,
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
})

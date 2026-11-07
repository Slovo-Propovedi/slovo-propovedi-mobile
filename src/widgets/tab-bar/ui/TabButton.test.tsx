import { fireEvent, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { hapticLight } from 'shared/lib/haptics'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { styles } from './styles'
import { TabButton } from './TabButton'

jest.mock('shared/lib/haptics', () => ({ hapticLight: jest.fn() }))

const mockedHapticLight = hapticLight as jest.MockedFunction<typeof hapticLight>
const noop = () => {}
const CAPSULE_COLOR = 'rgba(241, 96, 49, 0.18)'

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const findCapsule = () =>
  screen.root?.queryAll(
    instance => StyleSheet.flatten(instance.props.style)?.backgroundColor === CAPSULE_COLOR,
  )[0]

const renderTabButton = async (
  routeName: string,
  isActive = false,
  collapseProgress = progressValue(0),
) =>
  await renderWithProviders(
    <TabButton
      onPress={noop}
      isActive={isActive}
      routeKey={routeName}
      routeName={routeName}
      collapseProgress={collapseProgress}
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
    ['more', 'Ещё'],
  ])('renders single-line label for %s', async (routeName, displayName) => {
    await renderTabButton(routeName)

    const label = screen.getByText(displayName)

    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.maxFontSizeMultiplier).toBe(1.2)
  })

  test('takes the label out of layout so the icon centers in the collapsed circle', async () => {
    await renderTabButton('listen', true, progressValue(1))

    const label = screen.getByText('Слушать')

    expect(label).toHaveStyle({ position: 'absolute' })
    expect(label.parent).toHaveStyle({
      alignItems: 'center',
      height: 56,
      justifyContent: 'center',
    })
  })

  test('expanded item grows taller to leave a gap between icon and label', async () => {
    await renderTabButton('listen', true, progressValue(0))

    expect(screen.getByText('Слушать').parent).toHaveStyle({ height: 68 })
  })

  test('leaves the item height to the morph instead of a static fallback', () => {
    // A static height in the item's style array shadows the animated one on
    // device, so the expanded item stayed 56 tall and the icon+label looked
    // cramped inside the 76 island.
    expect(styles.tabItem).not.toHaveProperty('height')
  })

  test('draws the bar icon at the enlarged size', async () => {
    await renderTabButton('listen')

    const iconGlyphs = screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.fontSize === 28,
    )

    expect(iconGlyphs).toHaveLength(1)
  })

  test('renders as a button role so web renders a real <button>', async () => {
    await renderTabButton('listen')

    expect(screen.getByRole('button', { name: /Слушать/ })).toBeTruthy()
  })

  test('inactive tab triggers haptic on press', async () => {
    await renderTabButton('listen')

    await fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'press')

    expect(mockedHapticLight).toHaveBeenCalledTimes(1)
  })

  test('active tab does not trigger haptic on press', async () => {
    await renderTabButton('listen', true)

    await fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'press')

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

  test('active tab renders a primary-tinted capsule behind the item when expanded', async () => {
    await renderTabButton('listen', true, progressValue(0))

    expect(findCapsule()).toHaveStyle({ backgroundColor: CAPSULE_COLOR, opacity: 1 })
  })

  test('active capsule overhangs its slot so the label is not flush with the edges', async () => {
    // The reference capsule is wider than one tab slot (143dp over a 132dp
    // pitch), so it bleeds into the inter-item gap instead of hugging the label.
    await renderTabButton('listen', true, progressValue(0))

    expect(findCapsule()).toHaveStyle({ left: -12, right: -12 })
  })

  test('tab items keep a 12dp gap between neighbours', () => {
    expect(styles.tabItem).toMatchObject({ marginHorizontal: 6 })
  })

  test('keeps the pressable tab at the 48dp minimum touch target', () => {
    expect(styles.tabButton).toMatchObject({ minHeight: 48 })
  })

  test('collapsed active tab hides the capsule highlight inside the circle', async () => {
    await renderTabButton('listen', true, progressValue(1))

    expect(findCapsule()).toHaveStyle({ backgroundColor: CAPSULE_COLOR, opacity: 0 })
  })

  test('inactive tab renders no capsule background', async () => {
    await renderTabButton('listen', false)

    expect(findCapsule()).toBeUndefined()
  })
})

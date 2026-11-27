import { fireEvent, screen } from '@testing-library/react-native'
import { Platform, StyleSheet } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { hapticLight } from 'shared/lib/haptics'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TAB_BAR_ISLAND_HEIGHT } from 'shared/ui/layout'
import { type SlotCapsuleMotion } from '../lib/capsuleTravel'
import { WIDE_TAB_LABEL_SIZE } from '../lib/getIslandStyle'
import { styles } from './styles'
import { TabButton } from './TabButton'

jest.mock('shared/lib/haptics', () => ({ hapticLight: jest.fn() }))

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return {
    ...actual,
    useTheme: () => ({ currentTheme: actual.LightTheme, isLight: true, themeMode: 'light' }),
  }
})

const mockedHapticLight = hapticLight as jest.MockedFunction<typeof hapticLight>
const noop = () => {}

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const travelMotion = ({
  arrivalPulse = 0,
  capsuleCenter,
  isTravelTarget = false,
  slotCenter,
  travelActivity = 1,
}: {
  arrivalPulse?: number
  capsuleCenter: number
  isTravelTarget?: boolean
  slotCenter: number
  travelActivity?: number
}): SlotCapsuleMotion => ({
  arrivalPulse: progressValue(arrivalPulse),
  capsuleCenter: progressValue(capsuleCenter),
  isTravelTarget,
  slotCenter,
  slotWidth: 88,
  travelActivity: progressValue(travelActivity),
})

const findIconGlyphs = (color: string) =>
  screen.root?.queryAll(instance => {
    const style = StyleSheet.flatten(instance.props.style)

    return style?.color === color && style?.fontSize === 28
  })

const renderTabButton = async (
  routeName: string,
  isActive = false,
  collapseProgress = progressValue(0),
  isBarVisuallyCollapsed = false,
  oneLineProgress = progressValue(0),
  {
    capsuleMotion,
    isSearchSlot = false,
    isWideLayout = false,
  }: {
    capsuleMotion?: SlotCapsuleMotion
    isSearchSlot?: boolean
    isWideLayout?: boolean
  } = {},
) =>
  await renderWithProviders(
    <TabButton
      onPress={noop}
      isActive={isActive}
      routeKey={routeName}
      routeName={routeName}
      isSearchSlot={isSearchSlot}
      isWideLayout={isWideLayout}
      capsuleMotion={capsuleMotion}
      oneLineProgress={oneLineProgress}
      collapseProgress={collapseProgress}
      isBarVisuallyCollapsed={isBarVisuallyCollapsed}
    />,
  )

describe('<TabButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    ['listen', 'Слушать'],
    ['read', 'Читать'],
    ['more', 'Ещё'],
  ])('renders single-line label for %s', async (routeName, displayName) => {
    await renderTabButton(routeName)

    const label = screen.getByText(displayName)

    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.maxFontSizeMultiplier).toBe(1.2)
  })

  test('takes the label out of layout so the icon centers in the collapsed circle', async () => {
    await renderTabButton('listen', true, progressValue(1), false, progressValue(1))

    const label = screen.getByText('Слушать')

    expect(label).toHaveStyle({ position: 'absolute' })
    expect(label.parent).toHaveStyle({
      alignItems: 'center',
      // Uniform 48dp one-line row minus the item's two 4dp vertical margins.
      height: TAB_BAR_ISLAND_HEIGHT - 4 * 2,
      justifyContent: 'center',
    })
  })

  test('sizes the item from the one-line axis so the icon centers in the search-open circle', async () => {
    // Search-open: shape collapsed (A = 1) but the visible field keeps the
    // island at 60. The item must be 60 - 8 margins; sizing it from A leaves a
    // 40-tall item resting above the circle centre.
    await renderTabButton('listen', true, progressValue(1), false, progressValue(0))

    expect(screen.getByText('Слушать').parent).toHaveStyle({ height: 52 })
  })

  test('expanded item grows taller to leave a gap between icon and label', async () => {
    await renderTabButton('listen', true, progressValue(0))

    expect(screen.getByText('Слушать').parent).toHaveStyle({ height: 52 })
  })

  test('leaves the item height to the morph instead of a static fallback', () => {
    // A static height in the item's style array shadows the animated one on
    // device, so the expanded item stayed short and the icon+label looked
    // cramped inside the 60 island.
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

  test('inactive tab does not fire the immediate press haptic on native', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      await renderTabButton('listen')

      await fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'press')

      // Switching tabs is silent: the capsule's landing cue is the one haptic.
      expect(mockedHapticLight).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
    }
  })

  test('active tab does not trigger haptic on press in the expanded bar', async () => {
    await renderTabButton('listen', true)

    await fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'press')

    expect(mockedHapticLight).not.toHaveBeenCalled()
  })

  test('collapsed active tab triggers haptic on press to confirm the expand tap', async () => {
    await renderTabButton('listen', true, progressValue(1), true)

    await fireEvent(screen.getByRole('button', { name: /Слушать/ }), 'press')

    expect(mockedHapticLight).toHaveBeenCalledTimes(1)
  })

  test('active tab tints the label with the theme primary color', async () => {
    await renderTabButton('listen', true)

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#f16031' })
  })

  test('lets the traveling capsule own the label tint while it is away', async () => {
    // The destination is active, but the capsule is still parked on the old
    // slot: the label must not jump to the primary tint before it arrives.
    await renderTabButton('listen', true, progressValue(0), false, progressValue(0), {
      capsuleMotion: travelMotion({ capsuleCenter: 0, slotCenter: 88 }),
    })

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#000' })
    expect(findIconGlyphs('#000')).toHaveLength(1)
  })

  test('lights the label as the capsule covers the slot', async () => {
    await renderTabButton('listen', false, progressValue(0), false, progressValue(0), {
      capsuleMotion: travelMotion({ capsuleCenter: 88, slotCenter: 88 }),
    })

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#f16031' })
    expect(findIconGlyphs('#f16031')).toHaveLength(1)
  })

  test('pulses the slot content while the capsule crosses it', async () => {
    await renderTabButton('listen', false, progressValue(0), false, progressValue(0), {
      capsuleMotion: travelMotion({ capsuleCenter: 88, slotCenter: 88 }),
    })

    expect(screen.getByText('Слушать').parent).toHaveStyle({ transform: [{ scale: 1.04 }] })
  })

  test('pulses stronger on arrival than on a pass-through', async () => {
    await renderTabButton('listen', true, progressValue(0), false, progressValue(0), {
      capsuleMotion: travelMotion({
        arrivalPulse: 1,
        capsuleCenter: 88,
        isTravelTarget: true,
        slotCenter: 88,
      }),
    })

    expect(screen.getByText('Слушать').parent).toHaveStyle({ transform: [{ scale: 1.12 }] })
  })

  test('inactive tab tints the label with the theme text color', async () => {
    await renderTabButton('listen', false)

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#000' })
    expect(findIconGlyphs('#000')).toHaveLength(1)
  })

  test('disabled tab tints the label with the muted text color', async () => {
    await renderWithProviders(
      <TabButton
        isDisabled
        onPress={noop}
        isActive={false}
        routeKey='listen'
        routeName='listen'
        oneLineProgress={progressValue(0)}
      />,
    )

    expect(screen.getByText('Слушать')).toHaveStyle({ color: '#666' })
    expect(findIconGlyphs('#666')).toHaveLength(1)
  })

  test('expanded items split the 8dp neighbour gap on both sides', async () => {
    await renderTabButton('listen', true, progressValue(0))

    expect(screen.getByText('Слушать').parent).toHaveStyle({
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
      marginTop: 4,
    })
  })

  test('collapsed active item drops every horizontal margin so the icon centres in the circle', async () => {
    // Island padding is 0 at progress 1; a leftover margin would push the icon
    // right of the 48dp circle centre.
    await renderTabButton('listen', true, progressValue(1))

    expect(screen.getByText('Слушать').parent).toHaveStyle({
      marginBottom: 4,
      marginLeft: 0,
      marginRight: 0,
      marginTop: 4,
    })
  })

  test('animates longhand margins so the morph reaches the web DOM', async () => {
    // react-native-web expands `marginHorizontal`/`marginVertical` only in its
    // preprocess step, which Reanimated's web DOM updater skips — a shortform in
    // an animated style stays frozen at its mount value on web.
    await renderTabButton('listen', true, progressValue(1))

    const itemStyle = StyleSheet.flatten(screen.getByText('Слушать').parent?.props.style)

    expect(itemStyle).not.toHaveProperty('marginHorizontal')
    expect(itemStyle).not.toHaveProperty('marginVertical')
  })

  test('the item margins live in the morph, not a static style', () => {
    // A static margin in the same style array would shadow the animated one and
    // keep the collapsed item off-centre.
    expect(styles.tabItem).not.toHaveProperty('marginHorizontal')
    expect(styles.tabItem).not.toHaveProperty('marginVertical')
  })

  test('keeps the pressable tab at the 48dp minimum touch target', () => {
    expect(styles.tabButton).toMatchObject({ minHeight: 48 })
  })

  test('never paints a capsule of its own: the traveling capsule owns it', async () => {
    await renderTabButton('listen', true, progressValue(0))

    expect(
      screen.root?.queryAll(
        instance =>
          StyleSheet.flatten(instance.props.style)?.backgroundColor === 'rgba(241, 96, 49, 0.18)',
      ),
    ).toHaveLength(0)
  })

  test('wide tab renders only its label at the wide font size', async () => {
    await renderTabButton('listen', false, progressValue(0), false, progressValue(0), {
      isWideLayout: true,
    })

    expect(screen.getByText('Слушать')).toHaveStyle({ fontSize: WIDE_TAB_LABEL_SIZE })
    expect(findIconGlyphs('#000')).toHaveLength(0)
  })

  test('wide search slot renders only its icon, without a label', async () => {
    await renderTabButton('search', false, progressValue(0), false, progressValue(0), {
      isSearchSlot: true,
      isWideLayout: true,
    })

    expect(screen.queryByText('Поиск')).toBeNull()
    expect(findIconGlyphs('#000')).toHaveLength(1)
  })
})

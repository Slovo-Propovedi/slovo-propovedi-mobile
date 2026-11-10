import { fireEvent, render, screen, within } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { GLASS } from './glass'
import { GlassIsland } from './GlassIsland'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

const HOST_MARGIN = 11

const findHost = () => {
  const candidate =
    screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.marginTop === HOST_MARGIN,
    )[0] ?? screen.root

  if (!candidate) throw new Error('island host not found')

  return candidate
}

const findBlurs = () =>
  screen.root?.queryAll(instance => instance.props.intensity === GLASS.blur.intensity) ?? []

const renderIsland = async (onPress?: () => void) =>
  render(
    <GlassIsland isLight radius={28} onPress={onPress} hostStyle={{ marginTop: HOST_MARGIN }}>
      <Text>island content</Text>
    </GlassIsland>,
  )

describe('<GlassIsland>', () => {
  test('renders one glass surface behind its children', async () => {
    await renderIsland()

    expect(findBlurs()).toHaveLength(1)
    expect(within(findHost()).getByText('island content')).toBeTruthy()
  })

  test('composes host, shared slot and animated styles on the host', async () => {
    await render(
      <GlassIsland
        isLight
        radius={28}
        animatedStyle={{ opacity: 0.5 }}
        hostStyle={{ marginTop: HOST_MARGIN }}
      >
        <Text>island content</Text>
      </GlassIsland>,
    )

    expect(StyleSheet.flatten(findHost()?.props.style)).toMatchObject({
      marginTop: HOST_MARGIN,
      opacity: 0.5,
    })
  })

  test('calls onPress from the pressable host', async () => {
    const onPress = jest.fn()
    await renderIsland(onPress)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('exposes the pressable host as a button by default', async () => {
    await renderIsland(jest.fn())

    expect(screen.getByRole('button')).toBeTruthy()
  })
})

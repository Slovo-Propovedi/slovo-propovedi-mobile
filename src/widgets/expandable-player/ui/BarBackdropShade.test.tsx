import { createCtx } from '@reatom/framework'
import { act, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player/@x/sheet'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { keyboardBottomInsetSv, setBarCollapsed, setTabBarHeight } from 'shared/ui/layout'
import { BarBackdropShade } from './BarBackdropShade'

jest.mock('expo-linear-gradient', () => {
  const { View } = jest.requireActual('react-native')

  return { LinearGradient: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: 400 }),
}))

const TAB_BAR_HEIGHT = 98
// Detached pill: bottom = 98 − 4 + 6 = 100; shade = bottom + pill height.
const EXPANDED_HEIGHT = 164
// Collapsed row: bottom = 98 − (84 + 64) / 2 = 24; shade = 24 + 64.
const COLLAPSED_HEIGHT = 88
const SHADE_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.10)']
const SHADE_LOCATIONS = [0.4, 1]

const AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/sermon.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const findShade = () =>
  screen.root?.queryAll(instance => {
    const flat = StyleSheet.flatten(instance.props.style)

    return (
      flat?.position === 'absolute' &&
      flat?.bottom === 0 &&
      flat?.left === 0 &&
      flat?.right === 0 &&
      typeof flat?.height === 'number'
    )
  })[0]

const findGradient = () =>
  screen.root?.queryAll(
    instance =>
      Array.isArray(instance.props.colors) &&
      instance.props.colors.join('|') === SHADE_COLORS.join('|'),
  )[0]

const renderShade = async ({
  audio = AUDIO,
  expanded = false,
  measured = true,
}: {
  audio?: AudioPlayerData | null
  expanded?: boolean
  measured?: boolean
} = {}) => {
  const ctx = createCtx()
  currentAudioAtom(ctx, audio)
  isPlayerExpandedAtom(ctx, expanded)
  if (measured) setTabBarHeight(ctx, TAB_BAR_HEIGHT)

  const result = await renderWithProviders(<BarBackdropShade />, { ctx })

  return { ...result, ctx }
}

describe('<BarBackdropShade>', () => {
  beforeEach(() => {
    keyboardBottomInsetSv.value = 0
  })

  test('paints one subtle gradient from the screen bottom to the detached pill top', async () => {
    await renderShade()
    const gradient = findGradient()

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      bottom: 0,
      height: EXPANDED_HEIGHT,
      left: 0,
      right: 0,
    })
    expect(gradient?.props.colors).toEqual(SHADE_COLORS)
    expect(gradient?.props.locations).toEqual(SHADE_LOCATIONS)
  })

  test('tracks the collapsed pill geometry', async () => {
    const { ctx, rerender } = await renderShade()

    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    await rerender(<BarBackdropShade />)

    expect(StyleSheet.flatten(findShade()?.props.style)).toMatchObject({
      height: COLLAPSED_HEIGHT,
    })
  })

  test('renders nothing while no audio is active', async () => {
    await renderShade({ audio: null })

    expect(findShade()).toBeUndefined()
    expect(findGradient()).toBeUndefined()
  })

  test('renders nothing while the player is expanded to fullscreen', async () => {
    await renderShade({ expanded: true })

    expect(findShade()).toBeUndefined()
  })

  test('renders nothing until the tab bar has a measured height', async () => {
    await renderShade({ measured: false })

    expect(findShade()).toBeUndefined()
  })
})

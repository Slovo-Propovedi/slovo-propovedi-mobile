import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'
import { WIDE_MINI_PLAYER_MAX_WIDTH } from 'shared/ui/layout'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { useGeometryAnimatedStyles } from './useGeometryAnimatedStyles'

const COMPACT_WIDTH = 390
const WIDE_WIDTH = 1024
const WINDOW_HEIGHT = 800
const TAB_BAR_HEIGHT = 98
const WIDE_BOTTOM_INSET = 20
// Compact pill is sized from the frozen layout base (the short side).
const CONTENT_WIDTH = COMPACT_WIDTH
// Layout base once the wide window has committed: the short side of 1024×800.
const WIDE_LAYOUT_BASE = WINDOW_HEIGHT

type StyleWorklet = () => Record<string, number>

interface WindowChannels {
  contentWidthShared: SharedValue<number>
  fullScreenHeightShared: SharedValue<number>
  screenWidthShared: SharedValue<number>
}

const worklets: StyleWorklet[] = []
const channelsRef: { current: null | WindowChannels } = { current: null }

const Harness = ({
  initialHeight,
  initialWidth,
  onChannels,
}: {
  initialHeight: number
  initialWidth: number
  onChannels: (channels: WindowChannels) => void
}) => {
  const barProgress = useSharedValue(1)
  const contentWidthShared = useSharedValue(CONTENT_WIDTH)
  const expandedShared = useSharedValue(0)
  const fullScreenHeightShared = useSharedValue(initialHeight)
  const geometryReapplyTick = useSharedValue(0)
  const progress = useSharedValue(0)
  const screenWidthShared = useSharedValue(initialWidth)
  const tabBarHeightShared = useSharedValue(TAB_BAR_HEIGHT)

  useGeometryAnimatedStyles({
    barProgress,
    contentWidthShared,
    expandedShared,
    fullScreenHeightShared,
    geometryReapplyTick,
    progress,
    screenWidthShared,
    tabBarHeightShared,
    wideBottomInset: WIDE_BOTTOM_INSET,
  })
  onChannels({ contentWidthShared, fullScreenHeightShared, screenWidthShared })

  return <Text>harness</Text>
}

const readChannels = (): null | WindowChannels => channelsRef.current

const renderHarness = async (initialWidth: number, initialHeight: number) => {
  worklets.length = 0
  channelsRef.current = null

  await render(
    <Harness
      initialWidth={initialWidth}
      initialHeight={initialHeight}
      onChannels={channels => {
        channelsRef.current = channels
      }}
    />,
  )

  const channels = readChannels()
  if (!channels) throw new Error('window channels were not exposed')
  // The hook registers the container style first and the pill style second.
  if (worklets.length < 2) throw new Error('both animated styles were not registered')

  return { channels, miniBarWorklet: worklets[1] }
}

describe('useGeometryAnimatedStyles wide-layout self-derivation', () => {
  beforeEach(() => {
    jest
      .spyOn(Reanimated, 'useAnimatedStyle')
      .mockImplementation(((worklet: StyleWorklet) =>
        worklets.push(worklet)) as unknown as typeof Reanimated.useAnimatedStyle)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('flips the wide pose from the shared window channels without a re-render', async () => {
    const { channels, miniBarWorklet } = await renderHarness(COMPACT_WIDTH, WINDOW_HEIGHT)

    // Compact at mount.
    expect(miniBarWorklet().height).toBe(PLAYER_SIZES.miniPlayerHeight)

    // A layout flip writes the pre-paint window channels without a React commit.
    channels.screenWidthShared.value = WIDE_WIDTH
    channels.fullScreenHeightShared.value = WINDOW_HEIGHT

    // The pose flips on the next worklet evaluation: the flag is derived from
    // the channels, not captured from a stale React render.
    expect(miniBarWorklet().height).toBe(PLAYER_SIZES.wideMiniPlayerHeight)

    // The pill is still sized from the frozen layout base until that channel
    // catches up on the same commit — a rotation must never resize it.
    expect(miniBarWorklet().width).toBe(CONTENT_WIDTH)

    channels.contentWidthShared.value = WIDE_LAYOUT_BASE

    expect(miniBarWorklet().width).toBe(WIDE_MINI_PLAYER_MAX_WIDTH)
  })

  test('returns to the compact geometry from the shared window channels without a re-render', async () => {
    // Wide at mount: the worklet derives it from the channels, no React flag.
    const { channels, miniBarWorklet } = await renderHarness(WIDE_WIDTH, WINDOW_HEIGHT)

    expect(miniBarWorklet().height).toBe(PLAYER_SIZES.wideMiniPlayerHeight)

    channels.screenWidthShared.value = COMPACT_WIDTH
    channels.fullScreenHeightShared.value = WINDOW_HEIGHT

    const compact = miniBarWorklet()

    expect(compact.height).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(compact.width).toBeLessThan(WIDE_MINI_PLAYER_MAX_WIDTH)
  })
})

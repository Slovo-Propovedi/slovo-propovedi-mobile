import { act } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { getSharedTestCtx, renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { PLAYER_SIZES } from '../../theme/themed'
import {
  BAR_BOTTOM_INSET_MIN,
  BAR_OUTER_GAP,
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_CONTENT_TOP_GAP,
} from '../bottomBarLayout'
import { setTabBarHeight } from '../model'
import { useScreenChromePadding } from './useScreenChromePadding'

// Mirrors BAR_BOTTOM_INSET_WEB, which stays module-private in bottomBarLayout.
const WEB_BOTTOM_INSET = 25

let mockWindowWidth = 1024
let mockTopInset = 20
let mockBottomInset = 0

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: mockWindowWidth }),
}))

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context')

  return {
    ...actual,
    useSafeAreaInsets: () => ({
      bottom: mockBottomInset,
      left: 0,
      right: 0,
      top: mockTopInset,
    }),
  }
})

const ORIGINAL_PLATFORM = Platform.OS

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
  mockWindowWidth = 1024
  mockTopInset = 20
  mockBottomInset = 0
  setTabBarHeight(getSharedTestCtx(), PLAYER_SIZES.tabBarHeight)
})

describe('useScreenChromePadding', () => {
  test('compact: bottom reserves the tab bar and mini player, no top chrome', async () => {
    mockWindowWidth = 390

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current).toMatchObject({
      bottomBarHeight: BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN,
      bottomChromeHeight: BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN + PLAYER_SIZES.miniPlayerHeight,
      topChromeHeight: 0,
      topChromeScrollInset: 0,
    })
    // The bottom reserve is also handed over as an animated spacer height so a
    // screen can glide it on an inset change (the padding itself cannot animate).
    expect(result.current.bottomChromeSpaceStyle).toEqual({
      height: BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN + PLAYER_SIZES.miniPlayerHeight,
    })
  })

  test('compact: the bottom reserve follows the insets in the same render, not the atom', async () => {
    mockWindowWidth = 390
    mockBottomInset = 24
    // A post-rotation atom still carries the other orientation's height; it must
    // not pin the reserve to a stale value.
    setTabBarHeight(getSharedTestCtx(), 200)

    const { rerender, result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      BAR_ROW_MIN_HEIGHT + 24 + PLAYER_SIZES.miniPlayerHeight,
    )

    mockBottomInset = 0
    await act(async () => {
      await rerender(undefined)
    })

    expect(result.current.bottomChromeHeight).toBe(
      BAR_ROW_MIN_HEIGHT + BAR_BOTTOM_INSET_MIN + PLAYER_SIZES.miniPlayerHeight,
    )
  })

  test('wide: the island clearance and the first-content gap live in scroll content', async () => {
    mockWindowWidth = 1024

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    // The screen root keeps only the safe-area strip: the island band above the
    // scroller is gone, so content scrolls and takes taps under the glass. The
    // extra gap pushes the first section header clear of the island's bottom edge.
    expect(result.current.topChromeScrollInset).toBe(
      BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP + WIDE_CONTENT_TOP_GAP,
    )
    expect(result.current.topChromeHeight).toBe(
      mockTopInset + BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP,
    )
  })

  test('wide native: the mini pill rests on the real safe-area line (iPad 20)', async () => {
    Platform.OS = 'android'
    mockWindowWidth = 768
    mockBottomInset = 20

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    // The pill grew to 64; the screen's bottom reservation follows it.
    expect(PLAYER_SIZES.wideMiniPlayerHeight).toBe(64)
    expect(result.current).toMatchObject({
      bottomBarHeight: WIDE_BAR_ROW_HEIGHT + 20,
      bottomChromeHeight: 64 + 20 + BAR_OUTER_GAP,
      topChromeHeight: mockTopInset + BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP,
      topChromeScrollInset:
        BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP + WIDE_CONTENT_TOP_GAP,
    })
    expect(result.current.bottomChromeSpaceStyle).toEqual({ height: 64 + 20 + BAR_OUTER_GAP })
  })

  test('wide: the measured row height (with its bottom padding) does not inflate the top', async () => {
    Platform.OS = 'android'
    mockWindowWidth = 768
    mockBottomInset = 20
    // A measured row on a home-indicator tablet: 68 content box + 20 padding.
    setTabBarHeight(getSharedTestCtx(), BAR_ROW_MIN_HEIGHT + mockBottomInset)

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.topChromeHeight).toBe(
      mockTopInset + BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT + BAR_OUTER_GAP,
    )
  })

  test('wide native: inset-less frames keep the chrome clearance floor', async () => {
    Platform.OS = 'android'
    mockWindowWidth = 768

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.wideMiniPlayerHeight + BAR_BOTTOM_INSET_MIN + BAR_OUTER_GAP,
    )
  })

  test('wide web: the mini player keeps the desktop-web bottom floor', async () => {
    Platform.OS = 'web'
    mockWindowWidth = 1024

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.wideMiniPlayerHeight + WEB_BOTTOM_INSET + BAR_OUTER_GAP,
    )
  })

  test('wide web PWA: a larger real inset wins over the web floor', async () => {
    Platform.OS = 'web'
    mockWindowWidth = 1024
    mockBottomInset = 34

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.wideMiniPlayerHeight + 34 + BAR_OUTER_GAP,
    )
  })
})

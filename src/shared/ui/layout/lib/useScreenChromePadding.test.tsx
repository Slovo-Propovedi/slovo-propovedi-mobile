import { Platform } from 'react-native'
import { renderHookWithProviders } from '../../../mocks/renderWithProviders'
import { PLAYER_SIZES } from '../../theme/themed'
import { BAR_BOTTOM_INSET_MIN, BAR_OUTER_GAP, BAR_TOP_ISLAND_MARGIN } from '../bottomBarLayout'
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
})

describe('useScreenChromePadding', () => {
  test('compact: bottom reserves the tab bar and mini player, no top chrome', async () => {
    mockWindowWidth = 390

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current).toEqual({
      bottomChromeHeight: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight,
      topChromeHeight: 0,
    })
  })

  test('wide native: the mini pill rests on the real safe-area line (iPad 20)', async () => {
    Platform.OS = 'android'
    mockWindowWidth = 768
    mockBottomInset = 20

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current).toEqual({
      bottomChromeHeight: PLAYER_SIZES.miniPlayerHeight + 20 + BAR_OUTER_GAP,
      topChromeHeight:
        mockTopInset + BAR_TOP_ISLAND_MARGIN + PLAYER_SIZES.tabBarHeight + BAR_OUTER_GAP,
    })
  })

  test('wide native: inset-less frames keep the chrome clearance floor', async () => {
    Platform.OS = 'android'
    mockWindowWidth = 768

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.miniPlayerHeight + BAR_BOTTOM_INSET_MIN + BAR_OUTER_GAP,
    )
  })

  test('wide web: the mini player keeps the desktop-web bottom floor', async () => {
    Platform.OS = 'web'
    mockWindowWidth = 1024

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.miniPlayerHeight + WEB_BOTTOM_INSET + BAR_OUTER_GAP,
    )
  })

  test('wide web PWA: a larger real inset wins over the web floor', async () => {
    Platform.OS = 'web'
    mockWindowWidth = 1024
    mockBottomInset = 34

    const { result } = await renderHookWithProviders(() => useScreenChromePadding())

    expect(result.current.bottomChromeHeight).toBe(
      PLAYER_SIZES.miniPlayerHeight + 34 + BAR_OUTER_GAP,
    )
  })
})

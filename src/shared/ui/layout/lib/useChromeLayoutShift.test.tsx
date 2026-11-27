import { act, renderHook } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { CHROME_LAYOUT_SHIFT_DURATION_MS } from '../bottomBarLayout'
import { getChromeShiftTranslateY, useChromeLayoutShift } from './useChromeLayoutShift'

let mockIsWideLayout = false
let mockWindowWidth = 400
let mockWindowHeight = 800

jest.mock('./useIsWideLayout', () => ({ useIsWideLayout: () => mockIsWideLayout }))

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: mockWindowHeight, width: mockWindowWidth }),
}))

const SHIFT_DISTANCE = 320
const mockedWithTiming = withTiming as jest.Mock

const renderChromeShift = () =>
  renderHook(() => useChromeLayoutShift({ distance: SHIFT_DISTANCE, wideAnchorSign: 1 }))

const rerenderInLayout = async (
  isWideLayout: boolean,
  rerender: (props: unknown) => Promise<void>,
) => {
  mockIsWideLayout = isWideLayout
  await act(async () => {
    rerender(undefined)
  })
}

describe('useChromeLayoutShift', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsWideLayout = false
    mockWindowWidth = 400
    mockWindowHeight = 800
  })

  test('mounts compact at rest without scheduling an animation', async () => {
    const { result } = await renderChromeShift()

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current.translateY.value).toBe(0)
  })

  test('mounts wide at rest without scheduling an animation', async () => {
    mockIsWideLayout = true

    const { result } = await renderChromeShift()

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current.translateY.value).toBe(0)
  })

  test('runs the layout shift slower than the compact morph', () => {
    // User feedback 2026-11-27: the full-anchor travel read as too fast at the
    // compact morph duration, so the duration is pinned here rather than derived.
    expect(CHROME_LAYOUT_SHIFT_DURATION_MS).toBe(400)
  })

  test('animates toward the wide anchor over the chrome layout shift duration', async () => {
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(1, {
      duration: CHROME_LAYOUT_SHIFT_DURATION_MS,
    })
  })

  test('animates back toward the compact anchor on the reverse flip', async () => {
    mockIsWideLayout = true
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(false, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(0, {
      duration: CHROME_LAYOUT_SHIFT_DURATION_MS,
    })
  })

  test('retargets on rapid flips instead of stacking animations', async () => {
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(true, rerender)
    await rerenderInLayout(false, rerender)
    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming.mock.calls).toEqual([
      [1, { duration: CHROME_LAYOUT_SHIFT_DURATION_MS }],
      [0, { duration: CHROME_LAYOUT_SHIFT_DURATION_MS }],
      [1, { duration: CHROME_LAYOUT_SHIFT_DURATION_MS }],
    ])
  })

  test('snaps the anchor move when the window dimensions change with the flip', async () => {
    const { rerender, result } = await renderChromeShift()

    // A rotation/resize rewrites every dimension-derived distance in the same
    // commit; tweening the anchor across 400ms would leave the chrome crooked
    // beside the already-snapped islands.
    mockWindowWidth = 900
    mockWindowHeight = 700
    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming).not.toHaveBeenCalled()
    expect(result.current.translateY.value).toBe(0)
  })

  test('still animates a flip that follows a dimension change', async () => {
    const { rerender } = await renderChromeShift()

    mockWindowWidth = 900
    await act(async () => {
      rerender(undefined)
    })

    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(1, {
      duration: CHROME_LAYOUT_SHIFT_DURATION_MS,
    })
  })
})

describe('getChromeShiftTranslateY', () => {
  const DISTANCE = 100

  test('a surface rising into wide starts below the top anchor and settles to zero', () => {
    expect(getChromeShiftTranslateY(false, 0, DISTANCE, 1)).toBe(0)
    expect(getChromeShiftTranslateY(true, 0, DISTANCE, 1)).toBe(DISTANCE)
    expect(getChromeShiftTranslateY(true, 1, DISTANCE, 1)).toBe(0)
  })

  test('the reverse flip starts above the bottom anchor and settles to zero', () => {
    expect(getChromeShiftTranslateY(false, 0, DISTANCE, 1)).toBe(0)
    expect(getChromeShiftTranslateY(false, 1, DISTANCE, 1)).toBe(-DISTANCE)
  })

  test('a surface descending into wide starts above its bottom rest and settles to zero', () => {
    expect(getChromeShiftTranslateY(true, 0, DISTANCE, -1)).toBe(-DISTANCE)
    expect(getChromeShiftTranslateY(true, 1, DISTANCE, -1)).toBe(0)
    expect(getChromeShiftTranslateY(false, 0, DISTANCE, -1)).toBe(0)
    expect(getChromeShiftTranslateY(false, 1, DISTANCE, -1)).toBe(DISTANCE)
  })
})

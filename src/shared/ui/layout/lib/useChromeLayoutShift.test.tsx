import { act, renderHook } from '@testing-library/react-native'
import * as Reanimated from 'react-native-reanimated'
import { withTiming } from 'react-native-reanimated'
import { usePersistentSharedValue } from '../../../mocks/usePersistentSharedValue'
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

  afterEach(() => {
    jest.restoreAllMocks()
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

  test('animates the anchor move when the window dimensions change with the flip', async () => {
    const { rerender, result } = await renderChromeShift()

    // A resize across the wide-layout breakpoint IS a layout flip: the chrome
    // still slides to the new anchor, the user should see the 400ms travel.
    mockWindowWidth = 900
    mockWindowHeight = 700
    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(1, {
      duration: CHROME_LAYOUT_SHIFT_DURATION_MS,
    })
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

  test('snaps a dimension change that does not flip the layout', async () => {
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof Reanimated.useSharedValue)
    // Hold the flip tween mid-flight: the mock returns the mid value instead of
    // the target, standing in for an animation that has not landed yet.
    mockedWithTiming.mockImplementationOnce(() => 0.5)

    const { rerender, result } = await renderChromeShift()

    await rerenderInLayout(true, rerender)
    // Re-render once to read the mid-flight value the effect just wrote (a
    // shared-value write alone does not trigger a React render in the mock).
    await act(async () => {
      rerender(undefined)
    })

    expect(result.current.translateY.value).toBe(160)

    // Resize inside the wide layout: no flip, nothing to slide, so progress is
    // pinned to the rest anchor and the in-flight slide is dropped.
    mockWindowWidth = 900
    await act(async () => {
      rerender(undefined)
    })
    // Read the snapped value on the next render.
    await act(async () => {
      rerender(undefined)
    })

    expect(mockedWithTiming).toHaveBeenCalledTimes(1)
    expect(result.current.translateY.value).toBe(0)
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

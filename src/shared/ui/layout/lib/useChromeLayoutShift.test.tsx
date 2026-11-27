import { act, renderHook } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { BAR_MORPH_DURATION_MS } from '../bottomBarLayout'
import { getChromeShiftTranslateY, useChromeLayoutShift } from './useChromeLayoutShift'

let mockIsWideLayout = false

jest.mock('./useIsWideLayout', () => ({ useIsWideLayout: () => mockIsWideLayout }))

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

  test('animates toward the wide anchor over the bar morph duration', async () => {
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(1, { duration: BAR_MORPH_DURATION_MS })
  })

  test('animates back toward the compact anchor on the reverse flip', async () => {
    mockIsWideLayout = true
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(false, rerender)

    expect(mockedWithTiming).toHaveBeenCalledWith(0, { duration: BAR_MORPH_DURATION_MS })
  })

  test('retargets on rapid flips instead of stacking animations', async () => {
    const { rerender } = await renderChromeShift()

    await rerenderInLayout(true, rerender)
    await rerenderInLayout(false, rerender)
    await rerenderInLayout(true, rerender)

    expect(mockedWithTiming.mock.calls).toEqual([
      [1, { duration: BAR_MORPH_DURATION_MS }],
      [0, { duration: BAR_MORPH_DURATION_MS }],
      [1, { duration: BAR_MORPH_DURATION_MS }],
    ])
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

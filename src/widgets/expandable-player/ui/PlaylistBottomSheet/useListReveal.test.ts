import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOffsetNegligible, useListReveal } from './useListReveal'

const FAR_INDEX = 10
const NEAR_INDEX = 2
const INTENDED_OFFSET = 700

const renderRevealHook = async (
  currentIndex: number,
  hasPendingScroll: () => boolean,
  intendedOffset: null | number,
) => {
  const intendedOffsetRef = { current: intendedOffset }
  const { result } = await renderHookWithProviders(() =>
    useListReveal({ currentIndex, hasPendingScroll, intendedOffsetRef }),
  )
  return { intendedOffsetRef, result }
}

const scrollTo = async (result: { current: ReturnType<typeof useListReveal> }, y: number) => {
  await act(async () => {
    result.current.handleListScroll(y)
  })
}

describe('useListReveal', () => {
  test('isOffsetNegligible treats near-top targets as negligible', () => {
    expect(isOffsetNegligible(0)).toBe(true)
    expect(isOffsetNegligible(2)).toBe(true)
    expect(isOffsetNegligible(3)).toBe(true)
    expect(isOffsetNegligible(4)).toBe(false)
  })

  test('reveals immediately for near-top targets', async () => {
    const { result } = await renderRevealHook(NEAR_INDEX, () => false, null)

    expect(result.current.isRevealed).toBe(true)
  })

  test('stays hidden for far targets', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, null)

    expect(result.current.isRevealed).toBe(false)
  })

  test('reveals immediately when a real scroll arrives without an estimate path', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, null)

    await scrollTo(result, INTENDED_OFFSET)

    expect(result.current.isRevealed).toBe(true)
  })

  test('keeps the skeleton while a retry is pending even at the intended offset', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => true, INTENDED_OFFSET)

    await scrollTo(result, INTENDED_OFFSET)

    expect(result.current.isRevealed).toBe(false)
  })

  test('reveals when the list converges to the intended offset and no retry is pending', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, INTENDED_OFFSET)

    await scrollTo(result, INTENDED_OFFSET)

    expect(result.current.isRevealed).toBe(true)
  })

  test('reveals when within tolerance of the intended offset', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, INTENDED_OFFSET)

    await scrollTo(result, INTENDED_OFFSET + 150)

    expect(result.current.isRevealed).toBe(true)
  })

  test('keeps the skeleton when far from the intended offset', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, INTENDED_OFFSET)

    await scrollTo(result, 300)

    expect(result.current.isRevealed).toBe(false)
  })

  test('does not reveal on y === 0', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => false, null)

    await scrollTo(result, 0)

    expect(result.current.isRevealed).toBe(false)
  })

  test('ceiling timer force-reveals even without convergence', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => true, INTENDED_OFFSET)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.noteScrollScheduled()
    })
    expect(result.current.isRevealed).toBe(false)

    await act(async () => {
      jest.advanceTimersByTime(1500)
    })

    expect(result.current.isRevealed).toBe(true)
    jest.useRealTimers()
  })

  test('revealNow reveals immediately (user drag/momentum)', async () => {
    const { result } = await renderRevealHook(FAR_INDEX, () => true, INTENDED_OFFSET)

    await act(async () => {
      result.current.revealNow()
    })

    expect(result.current.isRevealed).toBe(true)
  })

  test('noteScrollScheduled does not arm the ceiling for near-top targets', async () => {
    const { result } = await renderRevealHook(NEAR_INDEX, () => false, null)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.noteScrollScheduled()
    })
    await act(async () => {
      jest.advanceTimersByTime(1500)
    })

    expect(result.current.isRevealed).toBe(true)
    jest.useRealTimers()
  })
})

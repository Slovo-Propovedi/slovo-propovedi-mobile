import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { OVERLAY_CONCEAL_CAP_MS, useSearchOverlayConceal } from './useSearchOverlayConceal'

jest.useFakeTimers()

interface ConcealProps {
  isCovered: boolean
  isTransitioning: boolean
}

const renderConceal = (initialProps: ConcealProps) =>
  renderHookWithProviders(
    (props: ConcealProps) => useSearchOverlayConceal(props.isCovered, props.isTransitioning),
    { initialProps },
  )

describe('useSearchOverlayConceal', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('stays visible while the covered screen is still transitioning, then hides at the cap', async () => {
    const { result } = await renderConceal({ isCovered: true, isTransitioning: true })

    expect(result.current).toBe(false)

    await act(async () => {
      jest.advanceTimersByTime(OVERLAY_CONCEAL_CAP_MS - 1)
    })
    expect(result.current).toBe(false)

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  test('conceals as soon as the transition ends', async () => {
    const { rerender, result } = await renderConceal({ isCovered: true, isTransitioning: true })

    await rerender({ isCovered: true, isTransitioning: false })

    expect(result.current).toBe(true)
  })

  test('shows immediately when the cover is gone and cancels the cap timer', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const { rerender, result } = await renderConceal({ isCovered: true, isTransitioning: true })
    const capCallIndex = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === OVERLAY_CONCEAL_CAP_MS,
    )
    const capTimerId = setTimeoutSpy.mock.results[capCallIndex]?.value

    await rerender({ isCovered: false, isTransitioning: true })

    expect(result.current).toBe(false)
    expect(clearTimeoutSpy).toHaveBeenCalledWith(capTimerId)

    await act(async () => {
      jest.advanceTimersByTime(OVERLAY_CONCEAL_CAP_MS)
    })
    expect(result.current).toBe(false)
  })

  test('clears the cap timer on unmount', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    const { unmount } = await renderConceal({ isCovered: true, isTransitioning: true })
    const capCallIndex = setTimeoutSpy.mock.calls.findIndex(
      ([, delay]) => delay === OVERLAY_CONCEAL_CAP_MS,
    )
    const capTimerId = setTimeoutSpy.mock.results[capCallIndex]?.value

    await act(async () => {
      unmount()
    })

    expect(clearTimeoutSpy).toHaveBeenCalledWith(capTimerId)
  })
})

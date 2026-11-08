import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { useBarMorphProgress } from './useBarMorphProgress'

const mockedWithTiming = withTiming as jest.Mock
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

describe('useBarMorphProgress', () => {
  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('assigns the initial value without animating', async () => {
    const { result } = await renderHookWithProviders(() => useBarMorphProgress(true))

    expect(result.current.progress.value).toBe(1)
    expect(result.current.settledCollapsed).toBe(true)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('animates with the same duration as the tab-bar morph', async () => {
    const { rerender, result } = await renderHookWithProviders(
      ({ isCollapsed }: { isCollapsed: boolean }) => useBarMorphProgress(isCollapsed),
      { initialProps: { isCollapsed: false } },
    )

    mockedWithTiming.mockClear()

    await act(async () => {
      rerender({ isCollapsed: true })
    })

    expect(mockedWithTiming).toHaveBeenCalledWith(
      1,
      { duration: BAR_MORPH_DURATION_MS },
      expect.any(Function),
    )
    expect(result.current.progress.value).toBe(1)
  })

  test('keeps the settled bar state until the morph completes', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })

    const { rerender, result } = await renderHookWithProviders(
      ({ isCollapsed }: { isCollapsed: boolean }) => useBarMorphProgress(isCollapsed),
      { initialProps: { isCollapsed: false } },
    )

    await act(async () => {
      rerender({ isCollapsed: true })
    })

    // Committing the destination state at the flip paints the pill there for a
    // frame, before the animated layer asserts the start-of-morph value.
    expect(result.current.settledCollapsed).toBe(false)

    await act(async () => {
      completions[0](true)
    })

    expect(result.current.settledCollapsed).toBe(true)
  })

  test('keeps the settled bar state when the morph is interrupted', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })

    const { rerender, result } = await renderHookWithProviders(
      ({ isCollapsed }: { isCollapsed: boolean }) => useBarMorphProgress(isCollapsed),
      { initialProps: { isCollapsed: false } },
    )

    await act(async () => {
      rerender({ isCollapsed: true })
    })
    await act(async () => {
      completions[0](false)
    })

    expect(result.current.settledCollapsed).toBe(false)
  })
})

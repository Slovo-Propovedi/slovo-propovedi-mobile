import { act } from '@testing-library/react-native'
import { type LayoutChangeEvent } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useContainerGeometryGuard } from './useContainerGeometryGuard'

const EXPANDED_BAR_TOP = 679.45
const COLLAPSED_BAR_TOP = 755.27

const makeProgress = (value: number) => ({ value }) as unknown as SharedValue<number>

const makeEvent = (y: number): LayoutChangeEvent =>
  ({
    nativeEvent: {
      layout: { height: 60.19, width: 395.43, x: 8, y },
    },
  }) as LayoutChangeEvent

describe('useContainerGeometryGuard', () => {
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(Date, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('no mismatch when layout matches the expanded-bar resting top', async () => {
    const onLayout = jest.fn()
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0),
        onLayout,
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP))
    })

    expect(onMismatch).not.toHaveBeenCalled()
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('expects the collapsed resting top when progress is at collapsed rest', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(1),
        onMismatch,
      }),
    )

    // The reported bug signature: the live pill settled at the collapsed top
    // while the expectation still claimed the detached (expanded-bar) top.
    await act(async () => {
      result.current.onLayout(makeEvent(COLLAPSED_BAR_TOP))
    })

    expect(onMismatch).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('heals a container lower than the collapsed resting top', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(1),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(COLLAPSED_BAR_TOP + 24))
    })

    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'playerGeometryHeal',
      expect.objectContaining({
        attempt: 1,
        expectedTop: COLLAPSED_BAR_TOP,
        y: COLLAPSED_BAR_TOP + 24,
      }),
    )
  })

  test('no heal when container is above expected (animation direction)', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(1),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(COLLAPSED_BAR_TOP - 30))
    })

    expect(onMismatch).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('ignores violations while the bar morph is mid-progress', async () => {
    const onLayout = jest.fn()
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0.5),
        onLayout,
        onMismatch,
      }),
    )

    for (const y of [700, 780, COLLAPSED_BAR_TOP + 24])
      await act(async () => {
        result.current.onLayout(makeEvent(y))
      })

    // Mid-morph every frame is between the two resting positions: never heal,
    // never queue a heal for later, never warn.
    expect(onMismatch).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
    // The chained consumer layout handler still runs.
    expect(onLayout).toHaveBeenCalledTimes(3)
  })

  test('judges again once the morph reaches rest', async () => {
    const onMismatch = jest.fn()
    const progress = makeProgress(0.5)

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: progress,
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
    })
    expect(onMismatch).not.toHaveBeenCalled()

    progress.value = 0

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
    })

    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('stops after MAX_HEALS mismatches and warns only once', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0),
        onMismatch,
      }),
    )

    for (let i = 0; i < 7; i++)
      await act(async () => {
        result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
      })

    expect(onMismatch).toHaveBeenCalledTimes(5)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('window expiry — mismatch no longer heals after 15s', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0),
        onMismatch,
      }),
    )

    // First onLayout stamps attachedAtRef = 0 (Date.now mock).
    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
    })
    expect(onMismatch).toHaveBeenCalledTimes(1)

    // Advance clock past 15s from attach.
    ;(Date.now as jest.Mock).mockReturnValue(16_000)

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
    })

    // Should not heal again — window expired.
    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('heal budget resets when resting tops change, the warn does not repeat', async () => {
    const onMismatch = jest.fn()

    const { rerender, result } = await renderHookWithProviders(
      (props: { barCollapsedTop: number }) =>
        useContainerGeometryGuard({
          barCollapsedTop: props.barCollapsedTop,
          barExpandedTop: EXPANDED_BAR_TOP,
          barProgress: makeProgress(1),
          onMismatch,
        }),
      { initialProps: { barCollapsedTop: COLLAPSED_BAR_TOP } },
    )

    // Exhaust heal budget with original collapsed top.
    for (let i = 0; i < 5; i++)
      await act(async () => {
        result.current.onLayout(makeEvent(COLLAPSED_BAR_TOP + 24))
      })
    expect(onMismatch).toHaveBeenCalledTimes(5)

    // 6th heal — budget exhausted, no more heals.
    await act(async () => {
      result.current.onLayout(makeEvent(COLLAPSED_BAR_TOP + 24))
    })
    expect(onMismatch).toHaveBeenCalledTimes(5)

    // Re-render with a new resting top — budget resets.
    const NEW_TOP = 800
    await act(async () => {
      rerender({ barCollapsedTop: NEW_TOP })
    })

    await act(async () => {
      result.current.onLayout(makeEvent(NEW_TOP + 20))
    })
    expect(onMismatch).toHaveBeenCalledTimes(6)
    // One warning per session is enough to flag the recurrence in prod logs.
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'playerGeometryHeal',
      expect.objectContaining({
        attempt: 1,
        expectedTop: COLLAPSED_BAR_TOP,
        y: COLLAPSED_BAR_TOP + 24,
      }),
    )
  })

  test('tolerance boundary — y === expectedTop + 1 exactly does NOT heal', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 1))
    })

    // Strictly-greater: y - expectedTop = 1 is NOT > 1.
    expect(onMismatch).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('chained onLayout still invoked when a heal fires', async () => {
    const onLayout = jest.fn()
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        barCollapsedTop: COLLAPSED_BAR_TOP,
        barExpandedTop: EXPANDED_BAR_TOP,
        barProgress: makeProgress(0),
        onLayout,
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(EXPANDED_BAR_TOP + 24))
    })

    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(onMismatch).toHaveBeenCalledTimes(1)
  })
})

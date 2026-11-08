import { act } from '@testing-library/react-native'
import { type LayoutChangeEvent } from 'react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useContainerGeometryGuard } from './useContainerGeometryGuard'

const EXPECTED_TOP = 737.52

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

  test('no mismatch when layout matches expected', async () => {
    const onLayout = jest.fn()
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout,
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(737.52))
    })

    expect(onMismatch).not.toHaveBeenCalled()
    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('heals when container is lower than expected', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout: jest.fn(),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })

    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'playerGeometryHeal',
      expect.objectContaining({ attempt: 1, expectedTop: EXPECTED_TOP, y: 757.33 }),
    )
  })

  test('no heal when container is above expected (animation direction)', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout: jest.fn(),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(700))
    })

    expect(onMismatch).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('ignores violations while the bar morph is unsettled', async () => {
    const onLayout = jest.fn()
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: false,
        onLayout,
        onMismatch,
      }),
    )

    for (const y of [740, 757.33, 780])
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

  test('heals a wrong settled y after the morph lands', async () => {
    const onMismatch = jest.fn()

    const { rerender, result } = await renderHookWithProviders(
      (props: { isSettled: boolean }) =>
        useContainerGeometryGuard({
          expectedTop: EXPECTED_TOP,
          isSettled: props.isSettled,
          onLayout: jest.fn(),
          onMismatch,
        }),
      { initialProps: { isSettled: false } },
    )

    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })
    expect(onMismatch).not.toHaveBeenCalled()

    await act(async () => {
      rerender({ isSettled: true })
    })

    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })

    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('stops after MAX_HEALS mismatches and warns only once', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout: jest.fn(),
        onMismatch,
      }),
    )

    for (let i = 0; i < 7; i++)
      await act(async () => {
        result.current.onLayout(makeEvent(757.33))
      })

    expect(onMismatch).toHaveBeenCalledTimes(5)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('window expiry — mismatch no longer heals after 15s', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout: jest.fn(),
        onMismatch,
      }),
    )

    // First onLayout stamps attachedAtRef = 0 (Date.now mock).
    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })
    expect(onMismatch).toHaveBeenCalledTimes(1)

    // Advance clock past 15s from attach.
    ;(Date.now as jest.Mock).mockReturnValue(16_000)

    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })

    // Should not heal again — window expired.
    expect(onMismatch).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
  })

  test('heal budget resets when expectedTop changes, the warn does not repeat', async () => {
    const onMismatch = jest.fn()

    const { rerender, result } = await renderHookWithProviders(
      (props: { expectedTop: number }) =>
        useContainerGeometryGuard({
          expectedTop: props.expectedTop,
          isSettled: true,
          onLayout: jest.fn(),
          onMismatch,
        }),
      { initialProps: { expectedTop: EXPECTED_TOP } },
    )

    // Exhaust heal budget with original expectedTop.
    for (let i = 0; i < 5; i++)
      await act(async () => {
        result.current.onLayout(makeEvent(757.33))
      })
    expect(onMismatch).toHaveBeenCalledTimes(5)

    // 6th heal — budget exhausted, no more heals.
    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })
    expect(onMismatch).toHaveBeenCalledTimes(5)

    // Re-render with new expectedTop — budget resets.
    const NEW_TOP = 800
    await act(async () => {
      rerender({ expectedTop: NEW_TOP })
    })

    await act(async () => {
      result.current.onLayout(makeEvent(820))
    })
    expect(onMismatch).toHaveBeenCalledTimes(6)
    // One warning per session is enough to flag the recurrence in prod logs.
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'playerGeometryHeal',
      expect.objectContaining({ attempt: 1, expectedTop: EXPECTED_TOP, y: 757.33 }),
    )
  })

  test('tolerance boundary — y === expectedTop + 1 exactly does NOT heal', async () => {
    const onMismatch = jest.fn()

    const { result } = await renderHookWithProviders(() =>
      useContainerGeometryGuard({
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout: jest.fn(),
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(EXPECTED_TOP + 1))
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
        expectedTop: EXPECTED_TOP,
        isSettled: true,
        onLayout,
        onMismatch,
      }),
    )

    await act(async () => {
      result.current.onLayout(makeEvent(757.33))
    })

    expect(onLayout).toHaveBeenCalledTimes(1)
    expect(onMismatch).toHaveBeenCalledTimes(1)
  })
})
